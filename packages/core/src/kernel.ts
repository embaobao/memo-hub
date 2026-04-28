import { EventEmitter } from "node:events";
import { 
  IKernel, 
  ITrackProvider, 
  ITool, 
  IToolManifest,
  Text2MemInstruction, 
  Text2MemResult, 
  MemoErrorCode, 
  InstructionState,
  ICAS,
  IVectorStorage,
  IEmbedder,
  ICompleter
} from "@memohub/protocol";
import { ToolRegistry } from "./tool-registry.js";
import { ObservationKernel } from "./observation.js";
import { CacheManager } from "./cache.js";
import { SessionCacheLayer } from "./session-cache.js";
import { ContentAddressableStorage } from "@memohub/storage-flesh";
import { VectorStorage } from "@memohub/storage-soul";
import { AIHub } from "./ai-hub.js";
import { MemoryRouter } from "./router.js";

export class MemoryKernel extends EventEmitter implements IKernel {
  private config: any;
  private aiHub: AIHub;
  private toolRegistry: ToolRegistry;
  private observation: ObservationKernel;
  private cache: CacheManager;
  private sessionCache: SessionCacheLayer;
  private router: MemoryRouter;
  
  private cas!: ICAS;
  private vectorStorage!: IVectorStorage;
  private embedder!: IEmbedder;
  private completer: ICompleter | null = null;

  private tracks: Map<string, ITrackProvider> = new Map();

  constructor(config: any) {
    super();
    this.config = config;
    this.aiHub = new AIHub(config.ai?.providers || [], config.ai?.agents || {});
    this.toolRegistry = new ToolRegistry();
    this.observation = new ObservationKernel(config.system?.root || './.memohub');
    this.cache = new CacheManager(config.system?.root || './.memohub');
    this.sessionCache = new SessionCacheLayer();
    this.router = new MemoryRouter(config);
  }

  public setComponents(components: {
    cas: ICAS;
    vector: IVectorStorage;
    embedder: IEmbedder;
    completer?: ICompleter;
  }): void {
    this.cas = components.cas;
    this.vectorStorage = components.vector;
    this.embedder = components.embedder;
    this.completer = components.completer || null;
  }

  public async initialize(): Promise<void> {
    if (!this.cas || !this.vectorStorage) {
      throw new Error("[Kernel] 核心资源未注入，请先调用 setComponents");
    }
    await this.vectorStorage.initialize();
  }

  public async registerTrack(track: ITrackProvider): Promise<void> {
    this.tracks.set(track.id, track);
    await track.initialize(this);
  }

  public async dispatch(instruction: Text2MemInstruction): Promise<Text2MemResult> {
    const startTime = Date.now();
    const traceId = instruction.meta?.traceId || this.observation.createTraceId();
    
    // 自动路由逻辑
    const trackId = this.router.route(instruction);
    
    let currentState = InstructionState.RECEIVED;

    this.emit("dispatch", { traceId, trackId, op: instruction.op, state: currentState });

    try {
      currentState = InstructionState.PARSED;
      const provider = this.tracks.get(trackId);
      if (!provider) {
        return this.fail(MemoErrorCode.ERR_TRACK_NOT_FOUND, `Track not found: ${trackId}`, traceId, trackId, startTime);
      }

      const result = await provider.execute({
        ...instruction,
        trackId, // 确保 provider 收到的是路由后的 trackId
        meta: { ...instruction.meta, traceId, timestamp: new Date().toISOString(), state: currentState }
      });

      const latencyMs = Date.now() - startTime;
      const finalState = result.success ? (result.meta?.state || InstructionState.COMMITTED) : InstructionState.FAILED;
      
      this.emit("dispatch", { 
        traceId, 
        trackId, 
        op: instruction.op, 
        state: finalState, 
        latencyMs,
        error: result.error?.message 
      });

      return {
        ...result,
        meta: {
          traceId,
          trackId,
          state: finalState,
          latencyMs
        }
      };

    } catch (error: any) {
      return this.fail(
        MemoErrorCode.ERR_KERNEL_OFFLINE, 
        error.message || "Internal Kernel Error", 
        traceId, 
        trackId, 
        startTime
      );
    }
  }

  private fail(code: MemoErrorCode, message: string, traceId: string, trackId: string, start: number): Text2MemResult {
    const latencyMs = Date.now() - start;
    this.emit("dispatch", { traceId, trackId, state: InstructionState.FAILED, error: message });
    return {
      success: false,
      error: { code, message },
      meta: { traceId, trackId, state: InstructionState.FAILED, latencyMs }
    };
  }

  public getEmbedder() { return this.embedder; }
  public getCompleter() { return this.completer; }
  public getCAS() { return this.cas; }
  public getVectorStorage() { return this.vectorStorage; }
  public getConfig() { return this.config; }
  
  public getTool(id: string) {
    const tool = this.toolRegistry.get(id);
    if (!tool) throw new Error(`Tool not found: ${id}`);
    return tool;
  }

  public listTools(): IToolManifest[] {
    return this.toolRegistry.list().map(t => t.manifest);
  }

  public async listTracks() {
    return Array.from(this.tracks.values());
  }

  public getToolRegistry() { return this.toolRegistry; }

  public getResources(): any {
    return {
      kernel: this,
      flesh: this.cas,
      soul: this.vectorStorage,
      ai: {
        getEmbedder: (id?: string) => this.aiHub.getEmbedder(id),
        getCompleter: (id?: string) => this.aiHub.getCompleter(id)
      },
      logger: {
        log: (msg: string, level: string = 'info') => {
           console.log(`[${level.toUpperCase()}] ${msg}`);
        }
      }
    };
  }
}
