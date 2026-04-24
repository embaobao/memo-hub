import { MemoHubConfig, resolvePath } from '@memohub/config';
import { IKernel, Text2MemInstruction, Text2MemResult } from '@memohub/protocol';
import { AIHub } from './ai-hub.js';
import { ToolRegistry } from './tool-registry.js';
import { FlowEngine } from './flow-engine.js';
import { ObservationKernel } from './observation.js';
import { CacheManager } from './cache.js';
import { CasTool } from './tools/builtin/cas.js';
import { VectorTool } from './tools/builtin/vector.js';
import { EmbedderTool } from './tools/builtin/embedder.js';
import { RetrieverTool } from './tools/builtin/retriever.js';
import { RerankerTool } from './tools/builtin/reranker.js';
import { AggregatorTool } from './tools/builtin/aggregator.js';
import { EntityLinkerTool } from './tools/builtin/entity-linker.js';
import { ContentAddressableStorage } from '@memohub/storage-flesh';
import { VectorStorage } from '@memohub/storage-soul';

export class MemoryKernel implements IKernel {
  private config: MemoHubConfig;
  private aiHub: AIHub;
  private toolRegistry: ToolRegistry;
  private flowEngine: FlowEngine;
  private observation: ObservationKernel;
  private cache: CacheManager;
  private cas: ContentAddressableStorage;
  private vectorStorage: VectorStorage;

  constructor(config: MemoHubConfig) {
    this.config = config;
    this.aiHub = new AIHub(config.ai.providers, config.ai.agents);
    this.toolRegistry = new ToolRegistry();
    this.observation = new ObservationKernel(config.system.root);
    this.cache = new CacheManager(config.system.root);
    this.flowEngine = new FlowEngine(this.toolRegistry, this.observation, this.aiHub, this.cache);

    // Initialize core storages
    this.cas = new ContentAddressableStorage(config.system.root + '/blobs');
    this.vectorStorage = new VectorStorage({
      dbPath: config.system.root + '/data/memohub.lancedb',
      tableName: 'memohub',
      dimensions: config.ai.agents.embedder?.dimensions || 768
    });

    // Register built-in tools
    this.toolRegistry.register(new CasTool(this.cas));
    this.toolRegistry.register(new VectorTool(this.vectorStorage));
    this.toolRegistry.register(new EmbedderTool(this.aiHub));
    this.toolRegistry.register(new RetrieverTool(this.vectorStorage));
    this.toolRegistry.register(new RerankerTool(this.aiHub));
    this.toolRegistry.register(new AggregatorTool());
    this.toolRegistry.register(new EntityLinkerTool());
    
    // In a real implementation, we would register external tools here based on config
  }

  public async initialize(): Promise<void> {
    await this.vectorStorage.initialize();
  }

  public clearCache(): void {
    this.cache.clear();
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
        // If dispatcher explicitly returns a string, it's the target track
        if (dispatchResult && typeof dispatchResult === 'string') {
          targetTrackId = dispatchResult;
        }
      }

      // 2. Track Phase
      const track = this.config.tracks.find(t => t.id === targetTrackId);
      if (!track) {
        throw new Error(`Track not found: ${targetTrackId}`);
      }

      // Determine which flow to run based on the operation
      const flow = (track.flows && track.flows[instruction.op]) || track.flow;

      if (!flow) {
        throw new Error(`No flow defined for operation ${instruction.op} on track ${targetTrackId}`);
      }

      const result = await this.flowEngine.executeFlow(        flow,
        instruction.payload,
        traceId
      );

      return {
        success: true,
        data: result,
        meta: { traceId, trackId: targetTrackId }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || String(error),
        meta: { traceId }
      };
    }
  }

  // Implementation of IKernel interface methods
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
