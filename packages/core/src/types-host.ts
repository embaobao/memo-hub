import { 
  IKernel, 
  ICAS, 
  IVectorStorage, 
  IEmbedder, 
  ICompleter 
} from "@memohub/protocol";

/**
 * 宿主资源接口 (DI Container)
 */
export interface IHostResources {
  kernel: IKernel;
  flesh: ICAS;
  soul: IVectorStorage;
  ai: {
    getEmbedder: (id?: string) => IEmbedder;
    getCompleter: (id?: string) => ICompleter | null;
  };
  logger: {
    log: (msg: string, level?: string) => void;
  };
}
