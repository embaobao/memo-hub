import type {
  Text2MemInstruction,
  Text2MemResult,
  IKernel,
  ITrackProvider,
} from "@memohub/protocol";
import { MemoOp, MemoErrorCode } from "@memohub/protocol";

/**
 * 真理库轨道 (Wiki Track)
 * 职责: 存储经过 Librarian 整理且通过“澄清环节”确认的权威知识。
 */
export class WikiTrack implements ITrackProvider {
  id = "track-wiki";
  name = "Wiki Track";

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
      case MemoOp.UPDATE:
        return this.handleUpdate(instruction);
      case MemoOp.DELETE:
        return this.handleDelete(instruction);
      case MemoOp.LIST:
        return this.handleList(instruction);
      case MemoOp.EXPORT:
        return this.handleExport(instruction);
      case MemoOp.ANCHOR:
        return this.handleAnchor(instruction);
      default:
        return {
          success: false,
          error: {
            code: MemoErrorCode.ERR_TRACK_NOT_FOUND,
            message: `Wiki 轨道不支持操作: ${instruction.op}`,
          },
        };
    }
  }

  private async handleAdd(inst: Text2MemInstruction): Promise<Text2MemResult> {
    try {
      const {
        title,
        content,
        category = "wiki",
        version = "1.0.0",
      } = inst.payload ?? {};
      if (!title || !content)
        return {
          success: false,
          error: {
            code: MemoErrorCode.ERR_CONFIG_INVALID,
            message: "title 和 content 均为必填项",
          },
        };

      const casTool = this.kernel.getTool("builtin:cas");
      const embedderTool = this.kernel.getTool("builtin:embedder");
      const vectorTool = this.kernel.getTool("builtin:vector");

      const { hash } = await casTool.execute(
        { content },
        this.kernel.getResources(),
        { traceId: inst.meta?.traceId },
      );
      const { vector } = await embedderTool.execute(
        { text: `${title}\n${content}` },
        this.kernel.getResources(),
        { traceId: inst.meta?.traceId },
      );

      const id = `wiki-${Date.now()}`;
      await vectorTool.execute(
        {
          id,
          vector,
          hash,
          track_id: this.id,
          meta: { title, category, version, verified: true, timestamp: new Date().toISOString() },
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
      const { query, limit = 5 } = inst.payload ?? {};
      const embedderTool = this.kernel.getTool("builtin:embedder");
      const retrieverTool = this.kernel.getTool("builtin:retriever");
      const { vector } = await embedderTool.execute(
        { text: query },
        this.kernel.getResources(),
        { traceId: inst.meta?.traceId },
      );

      const { results } = await retrieverTool.execute(
        { vector, limit, filter: `track_id = '${this.id}'`, hydrate: true },
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

  private async handleUpdate(
    inst: Text2MemInstruction,
  ): Promise<Text2MemResult> {
    try {
      const { id, content, version, title } = inst.payload ?? {};
      const vectorStorage = this.kernel.getVectorStorage();
      const updates: any = { meta: { version, title } };

      if (content) {
        const casTool = this.kernel.getTool("builtin:cas");
        const embedderTool = this.kernel.getTool("builtin:embedder");
        
        const { hash } = await casTool.execute(
          { content },
          this.kernel.getResources(),
          { traceId: inst.meta?.traceId },
        );
        const { vector } = await embedderTool.execute(
          { text: content },
          this.kernel.getResources(),
          { traceId: inst.meta?.traceId },
        );
        updates.hash = hash;
        updates.vector = vector;
      }
      
      await vectorStorage.update(id, updates);
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

  private async handleDelete(
    inst: Text2MemInstruction,
  ): Promise<Text2MemResult> {
    try {
      const { ids = [] } = inst.payload ?? {};
      const vectorStorage = this.kernel.getVectorStorage();
      for (const id of ids)
        await vectorStorage.delete(`id = '${id}'`);
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

  private async handleList(inst: Text2MemInstruction): Promise<Text2MemResult> {
    try {
      const records = await this.kernel
        .getVectorStorage()
        .list(`track_id = '${this.id}'`);
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

  private async handleExport(
    inst: Text2MemInstruction,
  ): Promise<Text2MemResult> {
    try {
      const records = await this.kernel
        .getVectorStorage()
        .list(`track_id = '${this.id}'`);
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

  private async handleAnchor(
    inst: Text2MemInstruction,
  ): Promise<Text2MemResult> {
    return { success: true };
  }
}
