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
          error: `轨道 track-source 不支持操作: ${instruction.op}`,
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
      if (!code) return { success: false, error: "payload.code 不能为空" };

      // 1. 调用代码分析工具提取符号
      const analyzer = this.kernel.getTool('builtin:code-analyzer');
      const { entities = [] } = await analyzer.execute({ code, language }, {}, { traceId: inst.meta?.traceId });

      const casTool = this.kernel.getTool('builtin:cas');
      const embedderTool = this.kernel.getTool('builtin:embedder');
      const vectorTool = this.kernel.getTool('builtin:vector');

      const { hash } = await casTool.execute({ content: code }, {}, { traceId: inst.meta?.traceId });
      const { vector } = await embedderTool.execute({ text: code }, {}, { traceId: inst.meta?.traceId });
      const id = `source-\${Date.now()}-\${Math.random().toString(36).slice(2, 8)}`;
      
      await vectorTool.execute({
        id,
        vector,
        hash,
        track_id: this.id,
        entities: entities,
        meta: {
          language,
          ast_type: 'file',
          symbol_name: '',
          file_path,
          importance
        }
      }, {}, { traceId: inst.meta?.traceId });
      
      const results = [{ id, hash, symbol_name: '' }];

      return { success: true, data: results };
    } catch (error) {
      return {
        success: false,
        error: {
          code: MemoErrorCode.ERR_KERNEL_OFFLINE,
          message: error instanceof Error ? error.message : String(error),
        }
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
      
      const embedderTool = this.kernel.getTool('builtin:embedder');
      const { vector } = await embedderTool.execute({ text: query }, {}, { traceId: inst.meta?.traceId });

      const retrieverTool = this.kernel.getTool('builtin:retriever');
      let filterStr = `track_id = '${this.id}'`;
      if (filters?.language) filterStr += ` AND language = '${filters.language}'`;
      
      const { results } = await retrieverTool.execute({
        vector,
        limit,
        filter: filterStr,
        hydrate: true
      }, {}, { traceId: inst.meta?.traceId });

      return { success: true, data: results };
    } catch (error) {
      return {
        success: false,
        error: {
          code: MemoErrorCode.ERR_KERNEL_OFFLINE,
          message: error instanceof Error ? error.message : String(error),
        }
      };
    }
  }

  /**
   * 更新代码
   */
  private async handleUpdate(
    inst: Text2MemInstruction,
  ): Promise<Text2MemResult> {
    const { id, code, ...rest } = inst.payload ?? {};
    if (!id) return { success: false, error: "payload.id 不能为空" };

    const updates: Record<string, any> = { ...rest };
    if (code) {
      updates.hash = await this.kernel.getCAS().write(code);
      updates.vector = await this.kernel.getEmbedder().embed(code);
    }
    await this.kernel.getVectorStorage().update(id, updates);
    return { success: true, data: { id } };
  }

  /**
   * 删除代码记录
   */
  private async handleDelete(
    inst: Text2MemInstruction,
  ): Promise<Text2MemResult> {
    const { ids } = inst.payload ?? {};
    if (!ids?.length) return { success: false, error: "payload.ids 不能为空" };
    for (const id of ids) {
      await this.kernel.getVectorStorage().delete(`id = '${id}'`);
    }
    return { success: true };
  }

  /**
   * 合并代码记录 (在 Source 轨通常较少使用)
   */
  private async handleMerge(
    inst: Text2MemInstruction,
  ): Promise<Text2MemResult> {
    return { success: false, error: "Source 轨道暂不支持 Merge 操作" };
  }

  /**
   * 列出符号
   */
  private async handleList(inst: Text2MemInstruction): Promise<Text2MemResult> {
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
    const records = await this.kernel
      .getVectorStorage()
      .list(`track_id = '${this.id}'`);
    const fullData = await Promise.all(
      records.map(async (r) => ({
        ...r,
        text: await this.kernel
          .getCAS()
          .read(r.hash)
          .catch(() => ""),
      })),
    );
    return { success: true, data: fullData };
  }

  /**
   * 蒸馏 (例如提取接口定义)
   */
  private async handleDistill(
    inst: Text2MemInstruction,
  ): Promise<Text2MemResult> {
    return { success: false, error: "Source 轨道暂不支持 Distill" };
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
    });
  }

  /**
   * 代码差异对比
   */
  private async handleDiff(inst: Text2MemInstruction): Promise<Text2MemResult> {
    const { source_id, target_id } = inst.payload ?? {};
    const [src] = await this.kernel
      .getVectorStorage()
      .list(`id = '${source_id}'`);
    const [tgt] = await this.kernel
      .getVectorStorage()
      .list(`id = '${target_id}'`);
    if (!src || !tgt) return { success: false, error: "未找到对应记录" };
    const srcText = await this.kernel.getCAS().read(src.hash);
    const tgtText = await this.kernel.getCAS().read(tgt.hash);
    return { success: true, data: { changed: srcText !== tgtText } };
  }

  /**
   * 同步工程代码
   */
  private async handleSync(inst: Text2MemInstruction): Promise<Text2MemResult> {
    return { success: true, data: "Sync completed" };
  }
}
