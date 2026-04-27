import { MemoHubConfig } from '@memohub/config';
import { 
  IKernel, 
  Text2MemInstruction, 
  Text2MemResult, 
  ITrackProvider, 
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

import { ContentAddressableStorage } from '@memohub/storage-flesh';
import { VectorStorage } from '@memohub/storage-soul';
import { IHostResources } from './types-host.js';
import { EventEmitter } from 'node:events';

/**
 * MemoHub 核心内核 (Memory Kernel)
 * 职责: 协调原子工具与流编排引擎。
 */
export class MemoryKernel extends EventEmitter implements IKernel {
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
    super();
    this.config = config;
    this.aiHub = new AIHub(config.ai.providers, config.ai.agents);
    this.toolRegistry = new ToolRegistry();
    this.observation = new ObservationKernel(config.system.root);
    this.cache = new CacheManager(config.system.root);
    this.sessionCache = new SessionCacheLayer();
    
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
  }

  public async initialize(): Promise<void> {
    await this.vectorStorage.initialize();
  }

  /**
   * 注册轨道提供者
   */
  public async registerTrack(track: ITrackProvider): Promise<void> {
    this.tracks.set(track.id, track);
    await track.initialize(this);
  }

  public async dispatch(instruction: Text2MemInstruction): Promise<Text2MemResult> {
    const traceId = this.observation.createTraceId();
    const trackId = instruction.trackId || this.config.dispatcher.fallback;
    
    // 发射调度开始事件
    this.emit('dispatch', { traceId, trackId, op: instruction.op, stage: 'start' });

    try {
      // 1. 优先尝试配置驱动的 Flow
      const trackConfig = this.config.tracks.find(t => t.id === trackId);
      console.log(`[Kernel] Dispatching ${instruction.op} to track: ${trackId}. Config found: ${!!trackConfig}`);
      if (trackConfig) {
        const flow = (trackConfig.flows && trackConfig.flows[instruction.op]) || trackConfig.flow;
        console.log(`[Kernel] Selected flow: ${flow ? 'Array(' + flow.length + ')' : 'NONE'}`);
        if (flow && flow.length > 0) {
          const output = await this.flowEngine.executeFlow(flow, instruction.payload, traceId);
          this.emit('dispatch', { traceId, trackId, op: instruction.op, stage: 'end', success: true });
          return { success: true, data: output, meta: { traceId, trackId } };
        }
      }

      // 2. 兜底尝试编程式轨道
      const provider = this.tracks.get(trackId);
      if (provider) {
        const result = await provider.execute(instruction);
        this.emit('dispatch', { traceId, trackId, op: instruction.op, stage: 'end', success: result.success });
        return { ...result, meta: { ...result.meta, traceId, trackId } };
      }

      throw new Error(`[Kernel] 轨道定义不存在或未配置流: ${trackId}`);
    } catch (error: any) {
      this.emit('dispatch', { traceId, trackId, op: instruction.op, stage: 'end', success: false, error: error.message });
      return { success: false, error: error.message || String(error), meta: { traceId } };
    }
  }

  public getEmbedder(agentId: string = 'embedder') { return this.aiHub.getEmbedder(agentId); }
  public getCompleter(agentId: string = 'summarizer') { return this.aiHub.getCompleter(agentId); }
  public getCAS() { return this.cas; }
  public getVectorStorage() { return this.vectorStorage; }
  public getConfig() { return this.config; }
  public getToolRegistry() { return this.toolRegistry; }
  public async listTools() { return this.toolRegistry.list().map(t => t.manifest); }
  public async listTracks() { return Array.from(this.tracks.values()); }
  public clearCache(): void { this.cache.clear(); this.sessionCache.clear(); }

  public setComponents(components: { cas: ICAS, vector: IVectorStorage, embedder: IEmbedder, completer?: ICompleter }): void {
    this.cas = components.cas as any;
    this.vectorStorage = components.vector as any;
    this.hostResources.flesh = components.cas;
    this.hostResources.soul = components.vector;
    this.hostResources.ai.getEmbedder = () => components.embedder;
    if (components.completer) {
      this.hostResources.ai.getCompleter = () => components.completer as any;
    }
  }
}
