import type { IEmbedder, ICompleter } from "@memohub/ai-provider";
import type { ContentAddressableStorage } from "@memohub/storage-flesh";
import type { VectorStorage } from "@memohub/storage-soul";
import type { Text2MemInstruction, Text2MemResult } from "@memohub/protocol";

export interface IKernel {
  getEmbedder(): IEmbedder;
  getCompleter(): ICompleter | null;
  getCAS(): ContentAddressableStorage;
  getVectorStorage(): VectorStorage;
  getConfig(): Record<string, any>;
  dispatch(instruction: Text2MemInstruction): Promise<Text2MemResult>;
}

export interface ITrackProvider {
  id: string;
  name: string;
  initialize(kernel: IKernel): Promise<void>;
  execute(instruction: Text2MemInstruction): Promise<Text2MemResult>;
}

export type KernelEvent =
  | { type: "pre-dispatch"; instruction: Text2MemInstruction }
  | {
      type: "post-dispatch";
      instruction: Text2MemInstruction;
      result: Text2MemResult;
    };

export type KernelEventHandler = (event: KernelEvent) => void;
