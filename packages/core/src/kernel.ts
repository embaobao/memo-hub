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

/**
 * 宿主资源接口 (DI Container)
 */
export interface IHostResources {
  kernel: IKernel;
  flesh: ICAS;
  soul: IVectorStorage;
  ai: {
    getEmbedder: (id?: string) => IEmbedder;
    getCompleter: (id?: string) => ICompleter;
  };
  logger: {
    log: (msg: string, level?: string) => void;
  };
}

/**
 * MemoHub 核心内核 (Memory OS Kernel)
 * 职责: 协调轨道与工具，维护指令流转状态机。
 */
export class MemoryKernel extends EventEmitter implements IKernel {
  private config: Record<string, any>;
  private toolRegistry: ToolRegistry;
  private observation: ObservationKernel;
  private cache: CacheManager;
  
  // 核心资源 (DI 注入)
  private cas!: ICAS;
  private vectorStorage!: IVectorStorage;
  private embedder!: IEmbedder;
  private completer!: ICompleter | null;

  private tracks: Map<string, ITrackProvider> = new Map();

  constructor(config: any) {
    super();
    this.config = config;
    this.toolRegistry = new ToolRegistry();
    this.observation = new ObservationKernel(config.system?.root || './.memohub');
    this.cache = new CacheManager(config.system?.root || './.memohub');
  }

  /**
   * 手动注入核心组件 (Manual DI)
   */
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

  /**
   * 注册轨道提供者
   */
  public async registerTrack(track: ITrackProvider): Promise<void> {
    this.tracks.set(track.id, track);
    await track.initialize(this);
  }

  /**
   * 指令调度 (State Machine Driven)
   */
  public async dispatch(instruction: Text2MemInstruction): Promise<Text2MemResult> {
    const startTime = Date.now();
    const traceId = instruction.meta?.traceId || this.observation.createTraceId();
    const trackId = instruction.trackId;
    
    let currentState = InstructionState.RECEIVED;

    // 1. 发射接收事件
    this.emit("dispatch", { traceId, trackId, op: instruction.op, state: currentState });

    try {
      // 2. 状态流转: PARSED (校验)
      currentState = InstructionState.PARSED;
      const provider = this.tracks.get(trackId);
      if (!provider) {
        return this.fail(MemoErrorCode.ERR_TRACK_NOT_FOUND, `Track not found: ${trackId}`, traceId, trackId, startTime);
      }

      // 3. 执行轨道逻辑 (轨道内部负责后续的状态反馈)
      const result = await provider.execute({
        ...instruction,
        meta: { ...instruction.meta, traceId, timestamp: new Date().toISOString(), state: currentState }
      });

      const latencyMs = Date.now() - startTime;
      
      // 4. 发射完成事件
      this.emit("dispatch", { traceId, trackId, op: instruction.op, state: result.meta?.state || InstructionState.COMMITTED, latencyMs });

      return {
        ...result,
        meta: {
          traceId,
          trackId,
          state: result.meta?.state || InstructionState.COMMITTED,
          latencyMs
        }
      };

    } catch (error: any) {
      return this.fail(
        MemoErrorCode.ERR_KERNEL_OFFLINE, 
        error.message || "Internal Kernel Error", 
        traceId, 
        trackId, 
        startTime,
        error.stack
      );
    }
  }

  private fail(code: MemoErrorCode, message: string, traceId: string, trackId: string, start: number, stack?: string): Text2MemResult {
    const latencyMs = Date.now() - start;
    this.emit("dispatch", { traceId, trackId, state: InstructionState.FAILED, error: message });
    return {
      success: false,
      error: { code, message, stack },
      meta: { traceId, trackId, state: InstructionState.FAILED, latencyMs }
    };
  }

  // --- 资源暴露接口 (符合 IKernel 协议) ---

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

  public getToolRegistry() { return this.toolRegistry; }

  public clearCache(): void {
    this.cache.clear();
  }
}
