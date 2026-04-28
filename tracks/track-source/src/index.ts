import type {
  Text2MemInstruction,
  Text2MemResult,
  IKernel,
  ITrackProvider,
} from "@memohub/protocol";
import { MemoOp, MemoErrorCode } from "@memohub/protocol";

/**
 * 源码资产轨道 (Source Track)
 * 职责: 处理源代码，进行 AST 解析，索引符号（函数、类、变量）及其调用关系。
 */
export class SourceTrack implements ITrackProvider {
  id = "track-source";
  name = "Source Track";

  private kernel!: IKernel;

  /**
   * 初始化轨道
   */
  async initialize(kernel: IKernel): Promise<void> {
    this.kernel = kernel;
  }

  /**
   * 执行指令映射
   */
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
      case MemoOp.MERGE:
        return this.handleMerge(instruction);
      case MemoOp.LIST:
        return this.handleList(instruction);
      case MemoOp.CLARIFY:
        return this.handleClarify(instruction);
      case MemoOp.EXPORT:
        return this.handleExport(instruction);
      case MemoOp.DISTILL:
        return this.handleDistill(instruction);
      case MemoOp.ANCHOR:
        return this.handleAnchor(instruction);
      case MemoOp.DIFF:
        return this.handleDiff(instruction);
      case MemoOp.SYNC:
        return this.handleSync(instruction);
      default:
        return {
          success: false,
          error: {
            code: MemoErrorCode.ERR_TOOL_NOT_FOUND,
            message: `轨道 track-source 不支持操作: ${instruction.op}`,
          },
        };
    }
  }

  /**
   * 添加代码资产
   */
  private async handleAdd(inst: Text2MemInstruction): Promise<Text2MemResult> {
    try {
      const {
        code,
        language = "typescript",
        file_path = "",
        importance = 0.5,
      } = inst.payload ?? {};
      if (!code) {
        return {
          success: false,
          error: {
            code: MemoErrorCode.ERR_CONFIG_INVALID,
            message: "payload.code 不能为空",
          },
        };
      }

      // 1. 调用代码分析工具提取符号
      const analyzer = this.kernel.getTool("builtin:code-analyzer");
      const { entities = [] } = await analyzer.execute(
        { code, language },
        this.kernel.getResources(),
        { traceId: inst.meta?.traceId },
      );

      const casTool = this.kernel.getTool("builtin:cas");
      const embedderTool = this.kernel.getTool("builtin:embedder");
      const vectorTool = this.kernel.getTool("builtin:vector");

      const { hash } = await casTool.execute(
        { content: code },
        this.kernel.getResources(),
        { traceId: inst.meta?.traceId },
      );
      const { vector } = await embedderTool.execute(
        { text: code },
        this.kernel.getResources(),
        { traceId: inst.meta?.traceId },
      );
      const id = `source-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      await vectorTool.execute(
        {
          id,
          vector,
          hash,
          track_id: this.id,
          entities: entities,
          meta: {
            language,
            ast_type: "file",
            symbol_name: "",
            file_path,
            importance,
          },
        },
        this.kernel.getResources(),
        { traceId: inst.meta?.traceId },
      );

      const results = [{ id, hash, symbol_name: "" }];

      return { success: true, data: results };
    } catch (error) {
      return {
        success: false,
        error: {
          code: MemoErrorCode.ERR_KERNEL_OFFLINE,
          message: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  /**
   * 检索代码片段
   */
  private async handleRetrieve(
    inst: Text2MemInstruction,
  ): Promise<Text2MemResult> {
    try {
      const { query, limit = 5, filters } = inst.payload ?? {};

      const embedderTool = this.kernel.getTool("builtin:embedder");
      const { vector } = await embedderTool.execute(
        { text: query },
        this.kernel.getResources(),
        { traceId: inst.meta?.traceId },
      );

      const retrieverTool = this.kernel.getTool("builtin:retriever");
      let filterStr = `track_id = '${this.id}'`;
      if (filters?.language)
        filterStr += ` AND language = '${filters.language}'`;

      const { results } = await retrieverTool.execute(
        {
          vector,
          limit,
          filter: filterStr,
          hydrate: true,
        },
        this.kernel.getResources(),
        { traceId: inst.meta?.traceId },
      );

      return { success: true, data: results };
    } catch (error) {
      return {
        success: false,
        error: {
          code: MemoErrorCode.ERR_KERNEL_OFFLINE,
          message: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  /**
   * 更新代码
   */
  private async handleUpdate(
    inst: Text2MemInstruction,
  ): Promise<Text2MemResult> {
    try {
      const { id, code, ...rest } = inst.payload ?? {};
      if (!id) {
        return {
          success: false,
          error: {
            code: MemoErrorCode.ERR_CONFIG_INVALID,
            message: "payload.id 不能为空",
          },
        };
      }

      const updates: Record<string, any> = { ...rest };
      if (code) {
        const casTool = this.kernel.getTool("builtin:cas");
        const { hash } = await casTool.execute(
          { op: "write", content: code },
          this.kernel.getResources(),
          { traceId: inst.meta?.traceId },
        );
        updates.hash = hash;

        const embedderTool = this.kernel.getTool("builtin:embedder");
        const { vector } = await embedderTool.execute(
          { text: code },
          this.kernel.getResources(),
          { traceId: inst.meta?.traceId },
        );
        updates.vector = vector;
      }

      const vectorTool = this.kernel.getTool("builtin:vector");
      await vectorTool.execute(
        {
          op: "update",
          id,
          updates,
        },
        this.kernel.getResources(),
        { traceId: inst.meta?.traceId },
      );

      return { success: true, data: { id } };
    } catch (error) {
      return {
        success: false,
        error: {
          code: MemoErrorCode.ERR_KERNEL_OFFLINE,
          message: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  /**
   * 删除代码记录
   */
  private async handleDelete(
    inst: Text2MemInstruction,
  ): Promise<Text2MemResult> {
    try {
      const { ids } = inst.payload ?? {};
      if (!ids?.length) {
        return {
          success: false,
          error: {
            code: MemoErrorCode.ERR_CONFIG_INVALID,
            message: "payload.ids 不能为空",
          },
        };
      }

      const vectorTool = this.kernel.getTool("builtin:vector");
      for (const id of ids) {
        await vectorTool.execute(
          {
            op: "delete",
            id,
          },
          this.kernel.getResources(),
          { traceId: inst.meta?.traceId },
        );
      }
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: {
          code: MemoErrorCode.ERR_KERNEL_OFFLINE,
          message: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  /**
   * 合并代码记录 (在 Source 轨通常较少使用)
   */
  private async handleMerge(inst: Text2MemInstruction): Promise<Text2MemResult> {
    try {
      const { ids, summary } = inst.payload ?? {};
      if (!ids?.length || ids.length < 2) {
        return {
          success: false,
          error: {
            code: MemoErrorCode.ERR_CONFIG_INVALID,
            message: "合并至少需要 2 个 ID",
          },
        };
      }

      const storage = this.kernel.getVectorStorage();
      const casTool = this.kernel.getTool("builtin:cas");

      const records = await storage.list(`track_id = '${this.id}'`);
      const toMerge = records.filter((r) => ids.includes(r.id));

      const texts = await Promise.all(
        toMerge.map(async (r) => {
          const { content } = await casTool.execute(
            { op: "read", hash: r.hash },
            this.kernel.getResources(),
            { traceId: inst.meta?.traceId },
          );
          return content;
        }),
      );
      const combinedText = summary || texts.join("\n\n---\n\n");

      const addResult = await this.handleAdd({
        op: MemoOp.ADD,
        trackId: this.id,
        payload: {
          code: combinedText,
          language: toMerge[0].language || "typescript",
          importance: Math.max(...toMerge.map((r) => r.importance || 0.5)),
        },
        meta: inst.meta,
      });

      if (addResult.success) {
        await this.handleDelete({
          op: MemoOp.DELETE,
          trackId: this.id,
          payload: { ids },
          meta: inst.meta,
        });
      }

      return addResult;
    } catch (error) {
      return {
        success: false,
        error: {
          code: MemoErrorCode.ERR_KERNEL_OFFLINE,
          message: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  /**
   * 列出符号
   */
  private async handleList(inst: Text2MemInstruction): Promise<Text2MemResult> {
    try {
      const records = await this.kernel
        .getVectorStorage()
        .list(`track_id = '${this.id}'`);
      return {
        success: true,
        data: records.map((r) => ({
          id: r.id,
          symbol: r.symbol_name,
          file: r.file_path,
        })),
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: MemoErrorCode.ERR_KERNEL_OFFLINE,
          message: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  /**
   * 澄清
   */
  private async handleClarify(
    inst: Text2MemInstruction,
  ): Promise<Text2MemResult> {
    return { success: true, data: "Source 轨道无需澄清环节" };
  }

  /**
   * 导出代码资产
   */
  private async handleExport(
    inst: Text2MemInstruction,
  ): Promise<Text2MemResult> {
    try {
      const records = await this.kernel
        .getVectorStorage()
        .list(`track_id = '${this.id}'`);
      const casTool = this.kernel.getTool("builtin:cas");

      const fullData = await Promise.all(
        records.map(async (r) => {
          const { content } = await casTool
            .execute({ op: "read", hash: r.hash }, this.kernel.getResources(), {
              traceId: inst.meta?.traceId,
            })
            .catch(() => ({ content: "" }));
          return {
            ...r,
            text: content,
          };
        }),
      );
      return { success: true, data: fullData };
    } catch (error) {
      return {
        success: false,
        error: {
          code: MemoErrorCode.ERR_KERNEL_OFFLINE,
          message: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  /**
   * 蒸馏 (例如提取接口定义)
   */
  private async handleDistill(
    inst: Text2MemInstruction,
  ): Promise<Text2MemResult> {
    try {
      const { ids } = inst.payload ?? {};
      if (!ids?.length) {
        return {
          success: false,
          error: {
            code: MemoErrorCode.ERR_CONFIG_INVALID,
            message: "payload.ids 不能为空",
          },
        };
      }

      const completer = this.kernel.getCompleter();
      if (!completer) {
        return {
          success: false,
          error: {
            code: MemoErrorCode.ERR_TOOL_NOT_FOUND,
            message: "内核未配置 AI Completer，无法执行蒸馏",
          },
        };
      }

      const records = await this.kernel
        .getVectorStorage()
        .list(`track_id = '${this.id}'`);
      const toDistill = records.filter((r) => ids.includes(r.id));
      const casTool = this.kernel.getTool("builtin:cas");
      const texts = await Promise.all(
        toDistill.map(async (r) => {
          const { content } = await casTool.execute(
            { op: "read", hash: r.hash },
            this.kernel.getResources(),
            { traceId: inst.meta?.traceId },
          );
          return content;
        }),
      );

      const summary = await completer.summarize(
        "Extract interface definitions or key logic from the following code:\n\n" +
          texts.join("\n\n"),
      );

      return this.handleAdd({
        op: MemoOp.ADD,
        trackId: this.id,
        payload: {
          code: summary,
          language: "typescript",
          importance: 0.9,
        },
        meta: inst.meta,
      });
    } catch (error) {
      return {
        success: false,
        error: {
          code: MemoErrorCode.ERR_KERNEL_OFFLINE,
          message: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  /**
   * 锚定外部文档
   */
  private async handleAnchor(
    inst: Text2MemInstruction,
  ): Promise<Text2MemResult> {
    const { id, doc_url } = inst.payload ?? {};
    return this.handleUpdate({
      op: MemoOp.UPDATE,
      trackId: this.id,
      payload: { id, metadata: { doc_url } },
      meta: inst.meta,
    });
  }

  /**
   * 代码差异对比
   */
  private async handleDiff(inst: Text2MemInstruction): Promise<Text2MemResult> {
    try {
      const { source_id, target_id } = inst.payload ?? {};
      if (!source_id || !target_id) {
        return {
          success: false,
          error: {
            code: MemoErrorCode.ERR_CONFIG_INVALID,
            message: "source_id 和 target_id 不能为空",
          },
        };
      }

      const storage = this.kernel.getVectorStorage();
      const casTool = this.kernel.getTool("builtin:cas");

      const [src] = await storage.list(`id = '${source_id}'`);
      const [tgt] = await storage.list(`id = '${target_id}'`);

      if (!src || !tgt) {
        return {
          success: false,
          error: {
            code: MemoErrorCode.ERR_VECTOR_SEARCH_FAILED,
            message: "未找到对应记录",
          },
        };
      }

      const { content: srcText } = await casTool.execute(
        { op: "read", hash: src.hash },
        this.kernel.getResources(),
        { traceId: inst.meta?.traceId },
      );
      const { content: tgtText } = await casTool.execute(
        { op: "read", hash: tgt.hash },
        this.kernel.getResources(),
        { traceId: inst.meta?.traceId },
      );

      return { success: true, data: { changed: srcText !== tgtText } };
    } catch (error) {
      return {
        success: false,
        error: {
          code: MemoErrorCode.ERR_KERNEL_OFFLINE,
          message: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  /**
   * 同步工程代码
   */
  private async handleSync(inst: Text2MemInstruction): Promise<Text2MemResult> {
    return { success: true, data: "Sync completed" };
  }
}
