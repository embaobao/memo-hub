import { MemoHubConfig } from '@memohub/config';
import { 
  IKernel, 
  Text2MemInstruction, 
  Text2MemResult, 
  ICAS, 
  IVectorStorage, 
  IEmbedder, 
  ICompleter 
} from '@memohub/protocol';
import { AIHub } from './ai-hub.js';
import { ToolRegistry } from './tool-registry.js';
import { FlowEngine } from './flow-engine.js';
import { ObservationKernel } from './observation.js';
import { CacheManager } from './cache.js';
import { SessionCacheLayer } from './session-cache.js';

// 内置原子工具
import { CasTool } from './tools/builtin/cas.js';
import { VectorTool } from './tools/builtin/vector.js';
import { EmbedderTool } from './tools/builtin/embedder.js';
import { RetrieverTool } from './tools/builtin/retriever.js';
import { RerankerTool } from './tools/builtin/reranker.js';
import { AggregatorTool } from './tools/builtin/aggregator.js';
import { EntityLinkerTool } from './tools/builtin/entity-linker.js';
import { GraphStoreTool } from './tools/builtin/graph-store.js';
import { CodeAnalyzerTool } from './tools/builtin/code-analyzer.js';

import { ContentAddressableStorage } from '@memohub/storage-flesh';
import { VectorStorage } from '@memohub/storage-soul';
import { IHostResources } from './types-host.js';

/**
 * MemoHub 核心内核 (Memory Kernel)
 * 职责: 协调原子工具与流编排引擎。
 * 
 * 核心设计:
 * 1. 没有任何硬编码的轨道 (No hardcoded tracks)
 * 2. 所有的轨道均为 config.jsonc 中定义的 Flow
 * 3. 所有的操作均由 FlowEngine 调度执行
 */
export class MemoryKernel implements IKernel {
  private config: MemoHubConfig;
  private aiHub: AIHub;
  private toolRegistry: ToolRegistry;
  private flowEngine: FlowEngine;
  private observation: ObservationKernel;
  private cache: CacheManager;
  private sessionCache: SessionCacheLayer;
  private cas: ContentAddressableStorage;
  private vectorStorage: VectorStorage;
  private hostResources: IHostResources;

  constructor(config: MemoHubConfig) {
    this.config = config;
    this.aiHub = new AIHub(config.ai.providers, config.ai.agents);
    this.toolRegistry = new ToolRegistry();
    this.observation = new ObservationKernel(config.system.root);
    this.cache = new CacheManager(config.system.root);
    this.sessionCache = new SessionCacheLayer();
    
    // 初始化物理与向量存储
    this.cas = new ContentAddressableStorage(config.system.root + '/blobs');
    this.vectorStorage = new VectorStorage({
      dbPath: config.system.root + '/data/memohub.lancedb',
      tableName: 'memohub',
      dimensions: config.ai.agents.embedder?.dimensions || 768
    });

    this.hostResources = {
      kernel: this,
      flesh: this.cas,
      soul: this.vectorStorage,
      sessionCache: this.sessionCache,
      ai: {
        getEmbedder: (id) => this.aiHub.getEmbedder(id || 'embedder'),
        getCompleter: (id) => this.aiHub.getCompleter(id || 'summarizer'),
      },
      logger: {
        log: (msg, level = 'info') => console.log(`[${level.toUpperCase()}] ${msg}`)
      }
    };

    this.flowEngine = new FlowEngine(
      this.toolRegistry, 
      this.observation, 
      this.aiHub, 
      this.cache, 
      this.hostResources
    );

    // 自动注册内置原子工具节点 (Built-in Nodes)
    this.toolRegistry.register(new CasTool());
    this.toolRegistry.register(new VectorTool());
    this.toolRegistry.register(new EmbedderTool());
    this.toolRegistry.register(new RetrieverTool());
    this.toolRegistry.register(new RerankerTool());
    this.toolRegistry.register(new AggregatorTool());
    this.toolRegistry.register(new EntityLinkerTool());
    this.toolRegistry.register(new CodeAnalyzerTool());
    this.toolRegistry.register(new GraphStoreTool(config.system.root));
  }

  public async initialize(): Promise<void> {
    await this.vectorStorage.initialize();
  }

  /**
   * 核心分发逻辑: 纯 Flow 驱动
   */
  public async dispatch(instruction: Text2MemInstruction): Promise<Text2MemResult> {
    const traceId = this.observation.createTraceId();
    const trackId = instruction.trackId || this.config.dispatcher.fallback;
    
    try {
      // 1. 查找轨道配置
      const trackConfig = this.config.tracks.find(t => t.id === trackId);
      if (!trackConfig) {
        throw new Error(`[Kernel] 轨道定义不存在: ${trackId}`);
      }

      // 2. 匹配具体操作的 Flow，若无则使用默认 Flow
      const flow = (trackConfig.flows && trackConfig.flows[instruction.op]) || trackConfig.flow;
      
      if (!flow || flow.length === 0) {
        throw new Error(`[Kernel] 轨道 ${trackId} 未定义操作 ${instruction.op} 的编排流`);
      }

      // 3. 执行流编排
      const output = await this.flowEngine.executeFlow(
        flow,
        instruction.payload,
        traceId
      );

      return {
        success: true,
        data: output,
        meta: { traceId, trackId }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || String(error),
        meta: { traceId }
      };
    }
  }

  // 接口兼容性方法
  public getEmbedder(agentId: string = 'embedder') { return this.aiHub.getEmbedder(agentId); }
  public getCompleter(agentId: string = 'summarizer') { return this.aiHub.getCompleter(agentId); }
  public getCAS() { return this.cas; }
  public getVectorStorage() { return this.vectorStorage; }
  public getConfig() { return this.config; }
  public getToolRegistry() { return this.toolRegistry; }
  public async listTools() { return this.toolRegistry.list().map(t => t.manifest); }
  public async listTracks() { return this.config.tracks; }
  public clearCache(): void { this.cache.clear(); this.sessionCache.clear(); }

  /**
   * 注入依赖组件 (主要用于单元测试中的 Mock 注入)
   */
  public setComponents(components: { cas: ICAS, vector: IVectorStorage, embedder: IEmbedder, completer?: ICompleter }): void {
    this.cas = components.cas as any;
    this.vectorStorage = components.vector as any;
    // this.embedder is not stored, but resources.ai.getEmbedder could be mocked
    this.hostResources.flesh = components.cas;
    this.hostResources.soul = components.vector;
    this.hostResources.ai.getEmbedder = () => components.embedder;
    if (components.completer) {
      this.hostResources.ai.getCompleter = () => components.completer as any;
    }
  }
}
