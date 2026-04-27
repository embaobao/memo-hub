import {
  ICAS,
  IVectorStorage,
  IEmbedder,
  ICompleter,
  IKernel,
} from "@memohub/protocol";

/**
 * Host resources injected into tools during execution.
 * Decouples tools from MemoryKernel while providing necessary capability access.
 */
export interface IHostResources {
  kernel: IKernel;
  flesh: ICAS;
  soul: IVectorStorage;
  sessionCache: {
    get(id: string): any;
    set(id: string, record: any): void;
  };
  ai: {
    getEmbedder(agentId?: string): IEmbedder;
    getCompleter(agentId?: string): ICompleter;
  };
  logger: {
    log(msg: string, level?: "info" | "warn" | "error"): void;
  };
}
