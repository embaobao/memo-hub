import type {
  Text2MemInstruction,
  Text2MemResult,
  IKernel,
  ITrackProvider,
} from "@memohub/protocol";
import { MemoOp } from "@memohub/protocol";

/**
 * 会话原始记录流 (Stream Track)
 */
export class StreamTrack implements ITrackProvider {
  id = "track-stream";
  name = "Stream Track";
  private kernel!: IKernel;

  async initialize(kernel: IKernel): Promise<void> {
    this.kernel = kernel;
  }

  async execute(instruction: Text2MemInstruction): Promise<Text2MemResult> {
    const { op, payload, meta } = instruction;
    
    if (op === MemoOp.ADD) {
      const cas = this.kernel.getTool('builtin:cas');
      const embedder = this.kernel.getTool('builtin:embedder');
      const vector = this.kernel.getTool('builtin:vector');

      const { hash } = await cas.execute({ content: payload.text }, {}, { traceId: meta?.traceId });
      const { vector: v } = await embedder.execute({ text: payload.text }, {}, { traceId: meta?.traceId });
      
      await vector.execute({
        id: `stream-${Date.now()}`,
        vector: v,
        hash,
        track_id: this.id,
        meta: { role: payload.role, session_id: payload.session_id }
      }, {}, { traceId: meta?.traceId });

      return { success: true, data: { hash } };
    }

    return { 
      success: false, 
      error: {
        code: MemoErrorCode.ERR_KERNEL_OFFLINE,
        message: "Op not supported in stream track MVP"
      }
    };
  }
}
