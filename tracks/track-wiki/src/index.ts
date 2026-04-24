import type { Text2MemInstruction, Text2MemResult, IKernel, ITrackProvider } from '@memohub/protocol';
import { MemoOp } from '@memohub/protocol';

/**
 * 真理库轨道 (Wiki Track)
 * 职责: 存储经过 Librarian 整理且通过“澄清环节”确认的权威知识。
 */
export class WikiTrack implements ITrackProvider {
  id = 'track-wiki';
  name = 'Wiki Track';

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
        return { success: false, error: `Wiki 轨道不支持操作: ${instruction.op}` };
    }
  }

  private async handleAdd(inst: Text2MemInstruction): Promise<Text2MemResult> {
    try {
      const { title, content, category = 'wiki', version = '1.0.0' } = inst.payload ?? {};
      if (!title || !content) return { success: false, error: 'title 和 content 均为必填项' };

      const hash = await this.kernel.getCAS().write(content);
      const vector = await this.kernel.getEmbedder().embed(`${title}\n${content}`);
      const id = `wiki-${Date.now()}`;

      await this.kernel.getVectorStorage().add({
        id, vector, hash, track_id: this.id,
        title, category, version,
        verified: true,
        timestamp: new Date().toISOString()
      });

      return { success: true, data: { id, hash } };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  private async handleRetrieve(inst: Text2MemInstruction): Promise<Text2MemResult> {
    const { query, limit = 5 } = inst.payload ?? {};
    const vector = await this.kernel.getEmbedder().embed(query);
    const results = await this.kernel.getVectorStorage().search(vector, {
      limit, filter: `track_id = '${this.id}'`
    });
    
    const hydrated = await Promise.all(results.map(async (r: any) => ({
      ...r,
      text: await this.kernel.getCAS().read(r.hash).catch(() => '')
    })));

    return { success: true, data: hydrated };
  }

  private async handleUpdate(inst: Text2MemInstruction): Promise<Text2MemResult> {
    const { id, content, version } = inst.payload ?? {};
    const updates: any = { version };
    if (content) {
      updates.hash = await this.kernel.getCAS().write(content);
      updates.vector = await this.kernel.getEmbedder().embed(content);
    }
    await this.kernel.getVectorStorage().update(id, updates);
    return { success: true };
  }

  private async handleDelete(inst: Text2MemInstruction): Promise<Text2MemResult> {
    const { ids } = inst.payload ?? {};
    for (const id of ids) await this.kernel.getVectorStorage().delete(`id = '${id}'`);
    return { success: true };
  }

  private async handleList(inst: Text2MemInstruction): Promise<Text2MemResult> {
    const records = await this.kernel.getVectorStorage().list(`track_id = '${this.id}'`);
    return { success: true, data: records };
  }

  private async handleExport(inst: Text2MemInstruction): Promise<Text2MemResult> {
    const records = await this.kernel.getVectorStorage().list(`track_id = '${this.id}'`);
    return { success: true, data: records };
  }

  private async handleAnchor(inst: Text2MemInstruction): Promise<Text2MemResult> {
    return { success: true };
  }
}
