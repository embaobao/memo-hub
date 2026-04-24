import { createHash } from "node:crypto";
import type {
  GBrainRecord,
  MemoIngestRequest,
  MemoRecord,
  MemoRetrieveRequest,
  TrackProvider,
} from "../../types/index.js";
import { extractEntitiesFromText } from "../../lib/text-entities.js";

export interface GBrainLike {
  initialize: () => Promise<void>;
  addKnowledge: (params: {
    text: string;
    category?: string;
    importance?: number;
    tags?: string[];
    entities?: string[];
    content_ref?: string;
  }) => Promise<string>;
  searchKnowledge: (
    query: string,
    options?: { limit?: number; category?: string }
  ) => Promise<GBrainRecord[]>;
  /**
   * 可选：FTS（全文检索）召回
   *
   * 说明：
   * - 并非所有存储实现都支持 FTS；因此这里用可选方法表达“能力插槽”
   * - 当实现不存在或运行时报错（例如未建 FTS 索引）时，上层会自动退化为仅 Vector 召回
   */
  searchKnowledgeFTS?: (
    query: string,
    options?: { limit?: number; category?: string }
  ) => Promise<GBrainRecord[]>;
}

function computeSha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((v) => String(v)).filter((v) => v.trim() !== "");
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return [];
    }
    return trimmed.split(",").map((t) => t.trim()).filter(Boolean);
  }
  return [];
}

function toNumber(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
}

/**
 * GBrainTrackProvider：把现有 GBrain 适配为 TrackProvider
 *
 * 关键点：
 * - 不改变既有 GBrain 的 schema 与对外行为
 * - 在“新管道契约”层面补齐 track/contentHash/metadata 等字段，便于后续演进
 */
export class GBrainTrackProvider implements TrackProvider {
  readonly track = "gbrain";
  private gbrain: GBrainLike;

  constructor(gbrain: GBrainLike) {
    this.gbrain = gbrain;
  }

  async initialize() {
    await this.gbrain.initialize();
  }

  async ingest(request: MemoIngestRequest): Promise<MemoRecord> {
    const { text = "", metadata = {} } = request ?? {};

    const category = typeof metadata["category"] === "string" ? metadata["category"] : undefined;
    const importance = toNumber(metadata["importance"], 0.5);
    const tags = toStringArray(metadata["tags"]);

    /**
     * 轻量实体抽取（GBrain）：
     * - 默认启用，并限制最大数量，避免长文本噪声过大
     * - 允许通过 metadata 做“按次写入级”的开关控制（便于后续接入配置系统）
     */
    const entitiesEnabled =
      typeof metadata["entities_enabled"] === "boolean"
        ? (metadata["entities_enabled"] as boolean)
        : true;
    const entitiesMax =
      typeof metadata["entities_max"] === "number"
        ? (metadata["entities_max"] as number)
        : typeof metadata["entities_max"] === "string"
          ? Number(metadata["entities_max"])
          : undefined;
    const entities = extractEntitiesFromText(text, {
      enabled: entitiesEnabled,
      maxEntities: Number.isFinite(entitiesMax as number) ? (entitiesMax as number) : undefined,
    });

    const hash = computeSha256(text);
    const contentRefFromMetadata =
      typeof metadata["contentRef"] === "string" ? (metadata["contentRef"] as string) : undefined;
    const inferredContentRef = contentRefFromMetadata ?? `sha256:${hash}`;

    const id = await this.gbrain.addKnowledge({
      text,
      category,
      importance,
      tags,
      entities,
      content_ref: inferredContentRef,
    });

    return {
      id,
      track: this.track,
      text,
      contentHash: hash,
      contentRef: inferredContentRef,
      entities,
      metadata: {
        category,
        importance,
        tags,
      },
    };
  }

  async retrieve(request: MemoRetrieveRequest): Promise<MemoRecord[]> {
    const { query = "", limit = 5, filters = {} } = request ?? {};
    const category =
      typeof filters["category"] === "string" ? (filters["category"] as string) : undefined;

    const results = await this.gbrain.searchKnowledge(query, {
      limit,
      category,
    });

    return results.map((record) => {
      const distance = typeof record._distance === "number" ? record._distance : undefined;
      const score = typeof distance === "number" ? 1 - distance : undefined;

      return {
        id: record.id,
        track: this.track,
        text: record.text,
        contentHash: record.hash,
        contentRef:
          typeof record.content_ref === "string" && String(record.content_ref ?? "").trim() !== ""
            ? record.content_ref
            : `sha256:${record.hash}`,
        entities: record.entities ?? [],
        score,
        metadata: {
          category: record.category,
          scope: record.scope,
          importance: record.importance,
          tags: record.tags,
          timestamp: record.timestamp,
          source: record.source,
        },
      };
    });
  }

  async retrieveFTS(request: MemoRetrieveRequest): Promise<MemoRecord[]> {
    const { query = "", limit = 5, filters = {} } = request ?? {};
    const category =
      typeof filters["category"] === "string" ? (filters["category"] as string) : undefined;

    if (!this.gbrain.searchKnowledgeFTS) {
      return [];
    }

    /**
     * FTS 召回属于“增强能力”：
     * - 底层依赖/索引不可用时可能抛错
     * - 这里必须吞掉异常并回退为空结果，保证检索主链路不退化
     */
    let results: GBrainRecord[] = [];
    try {
      results = await this.gbrain.searchKnowledgeFTS(query, { limit, category });
    } catch {
      return [];
    }

    return results.map((record) => {
      const distance = typeof record._distance === "number" ? record._distance : undefined;
      const vectorScore = typeof distance === "number" ? 1 - distance : undefined;
      const rawFtsScore = typeof (record as any)._score === "number" ? (record as any)._score : undefined;
      const normalizedFtsScore =
        typeof rawFtsScore === "number"
          ? rawFtsScore >= 0 && rawFtsScore <= 1
            ? rawFtsScore
            : 1 - 1 / (1 + Math.max(rawFtsScore, 0))
          : undefined;

      /**
       * 评分兼容策略：
       * - 优先使用 FTS 原生评分（若存在）
       * - 否则退化到 distance→score 的计算方式（若底层也返回 _distance）
       * - 最终仍可能为 undefined：排序阶段会把 undefined 当作 0 处理
       */
      const score = normalizedFtsScore ?? vectorScore;

      return {
        id: record.id,
        track: this.track,
        text: record.text,
        contentHash: record.hash,
        contentRef:
          typeof record.content_ref === "string" && String(record.content_ref ?? "").trim() !== ""
            ? record.content_ref
            : `sha256:${record.hash}`,
        entities: record.entities ?? [],
        score,
        metadata: {
          category: record.category,
          scope: record.scope,
          importance: record.importance,
          tags: record.tags,
          timestamp: record.timestamp,
          source: record.source,
        },
      };
    });
  }
}
