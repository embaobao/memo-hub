import { MemoHubConfig, resolvePath } from '@memohub/config';
import { IKernel, Text2MemInstruction, Text2MemResult } from '@memohub/protocol';
import { AIHub } from './ai-hub.js';
import { ToolRegistry } from './tool-registry.js';
import { FlowEngine } from './flow-engine.js';
import { ObservationKernel } from './observation.js';
import { CacheManager } from './cache.js';
import { SessionCacheLayer } from './session-cache.js';
import { CasTool } from './tools/builtin/cas.js';
import { VectorTool } from './tools/builtin/vector.js';
import { EmbedderTool } from './tools/builtin/embedder.js';
import { RetrieverTool } from './tools/builtin/retriever.js';
import { RerankerTool } from './tools/builtin/reranker.js';
import { AggregatorTool } from './tools/builtin/aggregator.js';
import { EntityLinkerTool } from './tools/builtin/entity-linker.js';
import { GraphStoreTool } from './tools/builtin/graph-store.js';
import { ContentAddressableStorage } from '@memohub/storage-flesh';
import { VectorStorage } from '@memohub/storage-soul';
import { IHostResources } from './types-host.js';

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

  private tracks: Map<string, ITrackProvider> = new Map();

  constructor(config: MemoHubConfig) {
    this.config = config;
    this.aiHub = new AIHub(config.ai.providers, config.ai.agents);
    this.toolRegistry = new ToolRegistry();
    this.observation = new ObservationKernel(config.system.root);
    this.cache = new CacheManager(config.system.root);
    this.sessionCache = new SessionCacheLayer();
    
    // Initialize core storages
    this.cas = new ContentAddressableStorage(config.system.root + '/blobs');
    this.vectorStorage = new VectorStorage({
      dbPath: config.system.root + '/data/memohub.lancedb',
      tableName: 'memohub',
      dimensions: config.ai.agents.embedder?.dimensions || 768
    });

    // Create Host Resources (The "Environment")
    this.hostResources = {
      flesh: this.cas,
      soul: this.vectorStorage,
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

    // Register built-in tools
    this.toolRegistry.register(new CasTool());
    this.toolRegistry.register(new VectorTool());
    this.toolRegistry.register(new EmbedderTool());
    this.toolRegistry.register(new RetrieverTool());
    this.toolRegistry.register(new RerankerTool());
    this.toolRegistry.register(new AggregatorTool());
    this.toolRegistry.register(new EntityLinkerTool());
    this.toolRegistry.register(new GraphStoreTool(config.system.root));
  }

  public async initialize(): Promise<void> {
    await this.vectorStorage.initialize();

    // 注册核心内置轨道
    await this.registerTrack(new InsightTrack());
    await this.registerTrack(new SourceTrack());
    await this.registerTrack(new StreamTrack());
    await this.registerTrack(new WikiTrack());
  }

  public async registerTrack(track: ITrackProvider): Promise<void> {
    this.tracks.set(track.id, track);
    await track.initialize(this);
  }

  public clearCache(): void {
    this.cache.clear();
    this.sessionCache.clear();
  }

  public async dispatch(instruction: Text2MemInstruction): Promise<Text2MemResult> {
    const traceId = this.observation.createTraceId();
    
    try {
      // 1. Dispatcher Phase (Flow-based routing)
      let targetTrackId = instruction.trackId || this.config.dispatcher.fallback;
      
      if (this.config.dispatcher.flow && this.config.dispatcher.flow.length > 0) {
        const dispatchResult = await this.flowEngine.executeFlow(
          this.config.dispatcher.flow,
          instruction.payload,
          traceId
        );
        if (dispatchResult && typeof dispatchResult === 'string') {
          targetTrackId = dispatchResult;
        }
      }

      // 2. Track Phase - Config Based
      const configTrack = this.config.tracks.find(t => t.id === targetTrackId);
      if (configTrack) {
        const flow = (configTrack.flows && configTrack.flows[instruction.op]) || track.flow;
        if (flow) {
          const result = await this.flowEngine.executeFlow(
            flow,
            instruction.payload,
            traceId
          );
          return { success: true, data: result, meta: { traceId, trackId: targetTrackId } };
        }
      }

      // 3. Track Phase - Provider Based Fallback
      const provider = this.tracks.get(targetTrackId);
      if (provider) {
        const result = await provider.execute(instruction);
        return { ...result, meta: { ...result.meta, traceId, trackId: targetTrackId } };
      }

      throw new Error(`未找到轨道实现: ${targetTrackId}`);
    } catch (error: any) {
      return {
        success: false,
        error: error.message || String(error),
        meta: { traceId }
      };
    }
  }

  public getEmbedder(agentId: string = 'embedder') { return this.aiHub.getEmbedder(agentId); }
  public getCompleter(agentId: string = 'summarizer') { return this.aiHub.getCompleter(agentId); }
  public getCAS() { return this.cas; }
  public getVectorStorage() { return this.vectorStorage; }
  public getConfig() { return this.config; }
  public getToolRegistry() { return this.toolRegistry; }

  public async listTools() {
    return this.toolRegistry.list().map(t => t.manifest);
  }

  public async listTracks() {
    return this.config.tracks;
  }
}
