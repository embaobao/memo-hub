import { ICAS, IVectorStorage, IEmbedder, ICompleter } from '@memohub/protocol';

/**
 * Host resources injected into tools during execution.
 * Decouples tools from MemoryKernel.
 */
export interface IHostResources {
  flesh: ICAS;
  soul: IVectorStorage;
  ai: {
    getEmbedder(agentId?: string): IEmbedder;
    getCompleter(agentId?: string): ICompleter;
  };
  logger: {
    log(msg: string, level?: 'info' | 'warn' | 'error'): void;
  };
}
