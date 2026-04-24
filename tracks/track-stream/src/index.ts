import type { Text2MemInstruction, Text2MemResult, IKernel, ITrackProvider } from '@memohub/protocol';
import { MemoOp } from '@memohub/protocol';

/**
 * 时序流轨道 (Stream Track)
 * 职责: 记录原始对话 Log，管理 TTL，为 Librarian 提供蒸馏素材。
 */
export class StreamTrack implements ITrackProvider {
  id = 'track-stream';
  name = 'Stream Track';

  private kernel!: IKernel;
  private defaultTTL = 30 * 24 * 60 * 60 * 1000; // 默认 30 天

  /**
   * 初始化轨道
   */
  async initialize(kernel: IKernel): Promise<void> {
    this.kernel = kernel;
  }

  /**
   * 执行指令
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
      case MemoOp.LIST:
        return this.handleList(instruction);
      case MemoOp.DISTILL:
        return this.handleDistill(instruction);
      case MemoOp.EXPORT:
        return this.handleExport(instruction);
      case MemoOp.CLARIFY:
      case MemoOp.MERGE:
      case MemoOp.ANCHOR:
      case MemoOp.DIFF:
      case MemoOp.SYNC:
        return { success: false, error: `时序轨道暂不支持操作: ${instruction.op}` };
      default:
        return { success: false, error: `未知操作: ${instruction.op}` };
    }
  }

  /**
   * 添加对话记录
   */
  private async handleAdd(inst: Text2MemInstruction): Promise<Text2MemResult> {
    try {
      const { content, role = 'user', session_id = 'default', ttl = this.defaultTTL } = inst.payload ?? {};
      if (!content) return { success: false, error: 'payload.content 不能为空' };

      const cas = this.kernel.getCAS();
      const storage = this.kernel.getVectorStorage();
      const embedder = this.kernel.getEmbedder();

      const hash = await cas.write(content);
      const vector = await embedder.embed(content);
      const id = `stream-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      await storage.add({
        id,
        vector,
        hash,
        track_id: this.id,
        session_id,
        role,
        timestamp: new Date().toISOString(),
        expires_at: new Date(Date.now() + ttl).toISOString(),
        distilled: false,
      });

      return { success: true, data: { id, hash } };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  /**
   * 检索历史对话
   */
  private async handleRetrieve(inst: Text2MemInstruction): Promise<Text2MemResult> {
    try {
      const { query, limit = 10, session_id } = inst.payload ?? {};
      const storage = this.kernel.getVectorStorage();
      const embedder = this.kernel.getEmbedder();
      const cas = this.kernel.getCAS();

      const vector = query ? await embedder.embed(query) : new Array(1536).fill(0); // 假定向量维度
      let filterParts = [`track_id = '${this.id}'`];
      if (session_id) filterParts.push(`session_id = '${session_id}'`);

      const results = await storage.search(vector, { limit, filter: filterParts.join(' AND ') });
      const hydrated = await Promise.all(results.map(async r => ({
        ...r,
        text: await cas.read(r.hash).catch(() => '')
      })));

      return { success: true, data: hydrated };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  /**
   * 更新记录状态（如标记已蒸馏）
   */
  private async handleUpdate(inst: Text2MemInstruction): Promise<Text2MemResult> {
    const { id, distilled } = inst.payload ?? {};
    if (!id) return { success: false, error: 'id 不能为空' };
    await this.kernel.getVectorStorage().update(id, { distilled });
    return { success: true };
  }

  /**
   * 删除记录
   */
  private async handleDelete(inst: Text2MemInstruction): Promise<Text2MemResult> {
    const { ids, session_id } = inst.payload ?? {};
    const storage = this.kernel.getVectorStorage();
    if (ids?.length) {
      for (const id of ids) await storage.delete(`id = '${id}'`);
    } else if (session_id) {
      await storage.delete(`track_id = '${this.id}' AND session_id = '${session_id}'`);
    }
    return { success: true };
  }

  /**
   * 蒸馏对话为知识
   */
  private async handleDistill(inst: Text2MemInstruction): Promise<Text2MemResult> {
    const { session_id, limit = 20 } = inst.payload ?? {};
    const storage = this.kernel.getVectorStorage();
    const cas = this.kernel.getCAS();
    const completer = this.kernel.getCompleter();

    if (!completer) return { success: false, error: '无 AI 补全器，无法蒸馏' };

    const filter = session_id 
      ? `track_id = '${this.id}' AND session_id = '${session_id}' AND distilled = false`
      : `track_id = '${this.id}' AND distilled = false`;

    const records = await storage.list(filter, limit);
    if (records.length === 0) return { success: false, error: '没有待蒸馏的内容' };

    const texts = await Promise.all(records.map(r => cas.read(r.hash)));
    const summary = await completer.summarize(texts.join('\n\n'));

    // 将蒸馏后的内容添加到 Insight 轨道
    const result = await this.kernel.dispatch({
      op: MemoOp.ADD,
      trackId: 'track-insight',
      payload: { text: summary, category: 'distilled_from_stream', tags: ['stream_distill'] }
    });

    if (result.success) {
      // 标记原记录为已蒸馏
      for (const r of records) {
        await storage.update(r.id, { distilled: true });
      }
    }

    return result;
  }

  /**
   * 列表显示
   */
  private async handleList(inst: Text2MemInstruction): Promise<Text2MemResult> {
    const records = await this.kernel.getVectorStorage().list(`track_id = '${this.id}'`);
    return { success: true, data: records.map(r => ({ id: r.id, session: r.session_id, timestamp: r.timestamp })) };
  }

  /**
   * 导出
   */
  private async handleExport(inst: Text2MemInstruction): Promise<Text2MemResult> {
    const records = await this.kernel.getVectorStorage().list(`track_id = '${this.id}'`);
    const cas = this.kernel.getCAS();
    const full = await Promise.all(records.map(async r => ({ ...r, text: await cas.read(r.hash) })));
    return { success: true, data: full };
  }
}
