/**
 * 检索流水线 - Pre / Exec / Post 三阶段检索系统
 *
 * 实现 LightRAG 风格的双层跨轨检索：
 * - Pre: 意图识别 + queryEntities 抽取 + token化
 * - Exec: 向量召回 + 词法通道 + 实体扩展召回
 * - Post: 融合去重 + 综合排序
 */

import type { IKernel, IEmbedder } from '@memohub/protocol';
import { extractEntitiesFromText } from '@memohub/protocol';

// ==================== 类型定义 ====================

export interface QueryIntent {
  type: 'code' | 'knowledge' | 'mixed';
  confidence: number;
  reason: string;
}

export interface QueryEntities {
  entities: string[];
  extracted: boolean;
  method: 'manual' | 'auto' | 'none';
}

export interface TokenizedQuery {
  tokens: string[];
  original: string;
}

export interface PreResult {
  intent: QueryIntent;
  entities: QueryEntities;
  tokenized: TokenizedQuery;
}

export interface ExecResult {
  vectorResults: RetrievedRecord[];
  lexicalResults?: RetrievedRecord[];
  entityExpandedResults?: RetrievedRecord[];
  stats: {
    vectorCount: number;
    lexicalCount?: number;
    entityExpandedCount?: number;
    expansionSources: string[];
  };
}

export interface PostResult {
  finalResults: RetrievedRecord[];
  dedupStats: {
    beforeCount: number;
    afterCount: number;
    duplicateCount: number;
  };
  rankingFactors: RankingFactor[];
}

export interface RetrievedRecord {
  id: string;
  track_id: string;
  text?: string;
  hash: string;
  entities: string[];
  metadata: Record<string, any>;
  timestamp: string;
  _distance?: number;
  _score?: number;
}

export interface RankingFactor {
  recordId: string;
  vectorScore: number;
  entityCoverage: number;
  trackWeight: number;
  freshness?: number;
  finalScore: number;
}

export interface RetrievalPipelineOptions {
  maxResults?: number;
  enableLexical?: boolean;
  enableEntityExpansion?: boolean;
  entityExpansionLimit?: number;
  trackWeights?: Record<string, number>;
  similarityThreshold?: number;
}

export interface PipelineResult {
  pre: PreResult;
  exec: ExecResult;
  post: PostResult;
  duration: number;
}

// ==================== Pre 阶段 ====================

export class PreProcessor {
  /**
   * 意图识别：判断查询是代码、知识还是混合型
   */
  static detectIntent(query: string): QueryIntent {
    const q = query.toLowerCase();

    // 代码相关关键词
    const codeKeywords = ['function', 'class', 'interface', 'type', 'import', 'export',
      'async', 'await', 'const', 'let', 'var', 'return', '=>', '.ts', '.js', '.py'];

    // 知识相关关键词
    const knowledgeKeywords = ['what', 'how', 'why', 'explain', 'describe', 'definition',
      'meaning', 'concept', 'idea', 'principle'];

    const codeCount = codeKeywords.filter(kw => q.includes(kw)).length;
    const knowledgeCount = knowledgeKeywords.filter(kw => q.includes(kw)).length;

    // 检查是否包含代码特征（如驼峰命名、特殊符号）
    const hasCodePattern = /[A-Z][a-z]+[A-Z]/.test(query) || /[{}();]/.test(query);

    let type: QueryIntent['type'];
    let confidence: number;
    let reason: string;

    if (hasCodePattern || codeCount >= 2) {
      type = 'code';
      confidence = hasCodePattern ? 0.9 : 0.7;
      reason = hasCodePattern ? '代码模式匹配' : '代码关键词匹配';
    } else if (knowledgeCount >= 1) {
      type = 'knowledge';
      confidence = 0.7;
      reason = '知识关键词匹配';
    } else {
      type = 'mixed';
      confidence = 0.5;
      reason = '无明显特征，默认混合型';
    }

    return { type, confidence, reason };
  }

  /**
   * 抽取查询实体
   */
  static extractEntities(query: string): QueryEntities {
    const entities = extractEntitiesFromText(query, {
      enabled: true,
      maxEntities: 10,
      includeCamelCase: true,
      includeDottedIdentifier: true,
      includeVersion: false,
      includeAcronym: true,
    });

    return {
      entities,
      extracted: entities.length > 0,
      method: entities.length > 0 ? 'auto' : 'none',
    };
  }

  /**
   * Token化查询
   */
  static tokenize(query: string): TokenizedQuery {
    // 简单的空格分词，移除标点符号
    const tokens = query
      .toLowerCase()
      .replace(/[^\w\s.]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length >= 2);

    return {
      tokens,
      original: query,
    };
  }

  /**
   * 执行 Pre 阶段
   */
  static async process(query: string): Promise<PreResult> {
    const intent = this.detectIntent(query);
    const entities = this.extractEntities(query);
    const tokenized = this.tokenize(query);

    return {
      intent,
      entities,
      tokenized,
    };
  }
}

// ==================== Exec 阶段 ====================

export class ExecProcessor {
  constructor(
    private kernel: IKernel,
    private embedder: IEmbedder,
    private options: RetrievalPipelineOptions = {}
  ) {
    this.options = {
      maxResults: 20,
      enableLexical: false,
      enableEntityExpansion: true,
      entityExpansionLimit: 10,
      trackWeights: {
        'track-insight': 1.0,
        'track-source': 1.0,
      },
      similarityThreshold: 0.3,
      ...options,
    };
  }

  /**
   * 向量召回
   */
  private async vectorRecall(query: string, pre: PreResult): Promise<RetrievedRecord[]> {
    const vector = await this.embedder.embed(query);

    // 根据意图选择轨道
    const tracks = this.selectTracks(pre.intent);

    const allResults: RetrievedRecord[] = [];

    for (const trackId of tracks) {
      const filter = `track_id = '${trackId}'`;
      const results = await this.kernel.getVectorStorage().search(vector, {
        limit: this.options.maxResults,
        filter,
      });

      allResults.push(...results as RetrievedRecord[]);
    }

    // 按相似度排序并截取
    return allResults
      .filter(r => (r._distance ?? 1) <= (1 - this.options.similarityThreshold!))
      .sort((a, b) => (a._distance ?? 1) - (b._distance ?? 1))
      .slice(0, this.options.maxResults);
  }

  /**
   * 词法通道召回（基于token overlap）
   */
  private async lexicalRecall(pre: PreResult, vectorResults: RetrievedRecord[]): Promise<RetrievedRecord[]> {
    if (!this.options.enableLexical || pre.tokenized.tokens.length === 0) {
      return [];
    }

    const queryTokens = new Set(pre.tokenized.tokens);
    const scored = vectorResults.map(record => {
      const text = (record.text ?? '').toLowerCase();
      const recordTokens = new Set(
        text.replace(/[^\w\s]/g, ' ').split(/\s+/).filter(t => t.length >= 2)
      );

      // 计算token overlap
      const overlap = [...queryTokens].filter(t => recordTokens.has(t)).length;
      const score = overlap / queryTokens.size;

      return { ...record, _score: score };
    });

    // 只保留有overlap的记录
    return scored.filter(r => (r._score ?? 0) > 0).sort((a, b) => (b._score ?? 0) - (a._score ?? 0));
  }

  /**
   * 实体扩展召回
   */
  private async entityExpansionRecall(
    pre: PreResult,
    vectorResults: RetrievedRecord[]
  ): Promise<{ results: RetrievedRecord[]; sources: string[] }> {
    if (!this.options.enableEntityExpansion || pre.entities.entities.length === 0) {
      return { results: [], sources: [] };
    }

    const allResults: RetrievedRecord[] = [];
    const sources: string[] = [];

    // 从向量结果中提取高频实体
    const entityCounts = new Map<string, number>();
    for (const record of vectorResults) {
      for (const entity of record.entities ?? []) {
        entityCounts.set(entity, (entityCounts.get(entity) ?? 0) + 1);
      }
    }

    // 选择高频实体进行扩展
    const topEntities = [...entityCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(e => e[0]);

    sources.push(...topEntities);

    // 基于高频实体进行跨轨扩展
    for (const entity of topEntities) {
      const filter = `array_contains(entities, '${entity}')`;
      const results = await this.kernel.getVectorStorage().search(
        await this.embedder.embed(entity),
        {
          limit: this.options.entityExpansionLimit,
          filter,
        }
      );

      allResults.push(...(results as RetrievedRecord[]));
    }

    return {
      results: allResults.slice(0, this.options.entityExpansionLimit!),
      sources: [...new Set(sources)],
    };
  }

  /**
   * 根据意图选择轨道
   */
  private selectTracks(intent: QueryIntent): string[] {
    switch (intent.type) {
      case 'code':
        return ['track-source'];
      case 'knowledge':
        return ['track-insight'];
      case 'mixed':
        return ['track-insight', 'track-source'];
      default:
        return ['track-insight', 'track-source'];
    }
  }

  /**
   * 执行 Exec 阶段
   */
  async execute(query: string, pre: PreResult): Promise<ExecResult> {
    const startTime = Date.now();

    // 向量召回
    const vectorResults = await this.vectorRecall(query, pre);

    // 词法通道
    const lexicalResults = await this.lexicalRecall(pre, vectorResults);

    // 实体扩展
    const { results: entityExpandedResults, sources: expansionSources } =
      await this.entityExpansionRecall(pre, vectorResults);

    return {
      vectorResults,
      lexicalResults: this.options.enableLexical ? lexicalResults : undefined,
      entityExpandedResults: this.options.enableEntityExpansion ? entityExpandedResults : undefined,
      stats: {
        vectorCount: vectorResults.length,
        lexicalCount: lexicalResults.length,
        entityExpandedCount: entityExpandedResults.length,
        expansionSources,
      },
    };
  }
}

// ==================== Post 阶段 ====================

export class PostProcessor {
  constructor(private options: RetrievalPipelineOptions = {}) {}

  /**
   * 融合和去重
   */
  private fuseAndDedup(exec: ExecResult): RetrievedRecord[] {
    const allRecords: RetrievedRecord[] = [
      ...exec.vectorResults,
      ...(exec.lexicalResults ?? []),
      ...(exec.entityExpandedResults ?? []),
    ];

    // 按hash或id去重
    const seen = new Set<string>();
    const deduped: RetrievedRecord[] = [];

    for (const record of allRecords) {
      const key = record.hash ?? record.id;
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(record);
      }
    }

    return deduped;
  }

  /**
   * 计算综合得分
   */
  private calculateScores(records: RetrievedRecord[], exec: ExecResult): RankingFactor[] {
    return records.map(record => {
      // 向量相似度得分（距离越小越好）
      const vectorScore = record._distance ? (1 - record._distance) : 0.5;

      // 实体覆盖得分
      const entityCoverage = this.calculateEntityCoverage(record, exec);

      // 轨道权重
      const trackWeight = this.options.trackWeights?.[record.track_id] ?? 1.0;

      // 综合得分（加权平均）
      const finalScore =
        vectorScore * 0.6 +
        entityCoverage * 0.3 +
        trackWeight * 0.1;

      return {
        recordId: record.id,
        vectorScore,
        entityCoverage,
        trackWeight,
        finalScore,
      };
    });
  }

  /**
   * 计算实体覆盖得分
   */
  private calculateEntityCoverage(record: RetrievedRecord, exec: ExecResult): number {
    const recordEntities = new Set(record.entities ?? []);

    // 计算与扩展源的覆盖度
    const coverage = exec.stats.expansionSources.filter(source =>
      recordEntities.has(source)
    ).length;

    return Math.min(coverage / Math.max(exec.stats.expansionSources.length, 1), 1.0);
  }

  /**
   * 执行 Post 阶段
   */
  async process(exec: ExecResult): Promise<PostResult> {
    const beforeCount =
      exec.vectorResults.length +
      (exec.lexicalResults?.length ?? 0) +
      (exec.entityExpandedResults?.length ?? 0);

    // 融合去重
    const fused = this.fuseAndDedup(exec);

    // 计算得分
    const rankingFactors = this.calculateScores(fused, exec);

    // 按综合得分排序
    const sorted = fused
      .map((record, i) => ({ record, factor: rankingFactors[i] }))
      .sort((a, b) => b.factor.finalScore - a.factor.finalScore)
      .slice(0, this.options.maxResults ?? 10)
      .map(item => ({
        ...item.record,
        _score: item.factor.finalScore,
      }));

    return {
      finalResults: sorted,
      dedupStats: {
        beforeCount,
        afterCount: sorted.length,
        duplicateCount: beforeCount - sorted.length,
      },
      rankingFactors,
    };
  }
}

// ==================== 流水线主类 ====================

export class RetrievalPipeline {
  constructor(
    private kernel: IKernel,
    private embedder: IEmbedder,
    private options: RetrievalPipelineOptions = {}
  ) {}

  /**
   * 执行完整的检索流水线
   */
  async execute(query: string): Promise<PipelineResult> {
    const startTime = Date.now();

    // Pre 阶段
    const pre = await PreProcessor.process(query);

    // Exec 阶段
    const execProcessor = new ExecProcessor(this.kernel, this.embedder, this.options);
    const exec = await execProcessor.execute(query, pre);

    // Post 阶段
    const postProcessor = new PostProcessor(this.options);
    const post = await postProcessor.process(exec);

    return {
      pre,
      exec,
      post,
      duration: Date.now() - startTime,
    };
  }
}
