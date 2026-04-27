import type {
  Text2MemInstruction,
  Text2MemResult,
  IKernel,
  ITrackProvider,
} from "@memohub/protocol";

export type { IKernel, ITrackProvider, Text2MemInstruction, Text2MemResult };

export type KernelEvent =
  | { type: "pre-dispatch"; instruction: Text2MemInstruction }
  | {
      type: "post-dispatch";
      instruction: Text2MemInstruction;
      result: Text2MemResult;
    };

export type KernelEventHandler = (event: KernelEvent) => void;
