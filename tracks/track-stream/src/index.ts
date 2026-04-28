import type {
  Text2MemInstruction,
  Text2MemResult,
  IKernel,
  ITrackProvider,
} from "@memohub/protocol";
import { MemoOp, MemoErrorCode } from "@memohub/protocol";

/**
 * 会话原始记录流 (Stream Track)
 * 职责: 高频记录原始会话碎片，作为 Insight 的原材料。
 */
export class StreamTrack implements ITrackProvider {
  id = "track-stream";
  name = "Stream Track";
  private kernel!: IKernel;

  async initialize(kernel: IKernel): Promise<void> {
    this.kernel = kernel;
  }

  async execute(instruction: Text2MemInstruction): Promise<Text2MemResult> {
    switch (instruction.op) {
      case MemoOp.ADD:
        return this.handleAdd(instruction);
      case MemoOp.RETRIEVE:
        return this.handleRetrieve(instruction);
      case MemoOp.LIST:
        return this.handleList(instruction);
      case MemoOp.DELETE:
        return this.handleDelete(instruction);
      default:
        return {
          success: false,
          error: {
            code: MemoErrorCode.ERR_TRACK_NOT_FOUND,
            message: `Stream 轨道不支持操作: ${instruction.op}`,
          },
        };
    }
  }

  private async handleAdd(inst: Text2MemInstruction): Promise<Text2MemResult> {
    try {
      const { text, role = "user", sessionId } = inst.payload ?? {};
      if (!text)
        return {
          success: false,
          error: {
            code: MemoErrorCode.ERR_CONFIG_INVALID,
            message: "payload.text 不能为空",
          },
        };

      const casTool = this.kernel.getTool("builtin:cas");
      const embedderTool = this.kernel.getTool("builtin:embedder");
      const vectorTool = this.kernel.getTool("builtin:vector");

      const { hash } = await casTool.execute(
        { content: text },
        this.kernel.getResources(),
        { traceId: inst.meta?.traceId },
      );
      const { vector } = await embedderTool.execute(
        { text },
        this.kernel.getResources(),
        { traceId: inst.meta?.traceId },
      );

      const id = `stream-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      await vectorTool.execute(
        {
          id,
          vector,
          hash,
          track_id: this.id,
          meta: { role, sessionId, timestamp: new Date().toISOString() },
        },
        this.kernel.getResources(),
        { traceId: inst.meta?.traceId },
      );

      return { success: true, data: { id, hash } };
    } catch (error) {
      return {
        success: false,
        error: {
          code: MemoErrorCode.ERR_KERNEL_OFFLINE,
          message: String(error),
        },
      };
    }
  }

  private async handleRetrieve(
    inst: Text2MemInstruction,
  ): Promise<Text2MemResult> {
    try {
      const { query, limit = 5, sessionId } = inst.payload ?? {};
      const retrieverTool = this.kernel.getTool("builtin:retriever");

      let filter = `track_id = '${this.id}'`;
      if (sessionId) filter += ` AND meta.sessionId = '${sessionId}'`;

      const results = await retrieverTool.execute(
        { query, limit, filter },
        this.kernel.getResources(),
        { traceId: inst.meta?.traceId },
      );

      return { success: true, data: results };
    } catch (error) {
      return {
        success: false,
        error: {
          code: MemoErrorCode.ERR_KERNEL_OFFLINE,
          message: String(error),
        },
      };
    }
  }

  private async handleList(inst: Text2MemInstruction): Promise<Text2MemResult> {
    try {
      const { limit = 20, sessionId } = inst.payload ?? {};
      const vectorStorage = this.kernel.getVectorStorage();

      let filter = `track_id = '${this.id}'`;
      if (sessionId) filter += ` AND meta.sessionId = '${sessionId}'`;

      const records = await vectorStorage.list(filter, limit);
      return { success: true, data: records };
    } catch (error) {
      return {
        success: false,
        error: {
          code: MemoErrorCode.ERR_KERNEL_OFFLINE,
          message: String(error),
        },
      };
    }
  }

  private async handleDelete(
    inst: Text2MemInstruction,
  ): Promise<Text2MemResult> {
    try {
      const { ids = [] } = inst.payload ?? {};
      const vectorStorage = this.kernel.getVectorStorage();

      for (const id of ids) {
        await vectorStorage.delete(`id = '${id}'`);
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: {
          code: MemoErrorCode.ERR_KERNEL_OFFLINE,
          message: String(error),
        },
      };
    }
  }
}

