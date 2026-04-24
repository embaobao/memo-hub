import type { Text2MemInstruction, Text2MemResult, IKernel, ITrackProvider } from '@memohub/protocol';
import { MemoOp, extractEntitiesFromText } from '@memohub/protocol';

export class InsightTrack implements ITrackProvider {
  id = 'track-insight';
  name = 'Insight Track';

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
      case MemoOp.MERGE:
        return this.handleMerge(instruction);
      case MemoOp.LIST:
        return this.handleList(instruction);
      default:
        return { success: false, error: `Operation ${instruction.op} not supported by track-insight` };
    }
  }

  private async handleAdd(inst: Text2MemInstruction): Promise<Text2MemResult> {
    try {
      const { text, category = 'other', importance = 0.5, tags = [], entities: providedEntities = [] } = inst.payload ?? {};
      if (!text) return { success: false, error: 'payload.text is required' };

      const cas = this.kernel.getCAS();
      const embedder = this.kernel.getEmbedder();
      const storage = this.kernel.getVectorStorage();

      const hash = await cas.write(text);
      const vector = await embedder.embed(text);
      const id = `insight-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      const entities = Array.isArray(providedEntities) && providedEntities.length > 0
        ? providedEntities
        : extractEntitiesFromText(text);

      await storage.add({
        id,
        vector,
        hash,
        track_id: this.id,
        entities,
        category,
        importance,
        tags,
        source: inst.context?.source ?? 'cli',
        timestamp: new Date().toISOString(),
        access_count: 0,
        last_accessed: new Date().toISOString(),
      });

      return { success: true, data: { id, hash } };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  private async handleRetrieve(inst: Text2MemInstruction): Promise<Text2MemResult> {
    try {
      const { query, limit = 5, filters } = inst.payload ?? {};
      if (!query) return { success: false, error: 'payload.query is required' };

      const embedder = this.kernel.getEmbedder();
      const storage = this.kernel.getVectorStorage();
      const cas = this.kernel.getCAS();

      const vector = await embedder.embed(query);
      let filterParts = [`track_id = '${this.id}'`];

      if (filters?.category) {
        filterParts.push(`category = '${filters.category}'`);
      }

      const results = await storage.search(vector, {
        limit,
        filter: filterParts.join(' AND '),
      });

      const hydrated = await Promise.all(
        results.map(async (r) => {
          const content = await cas.read(r.hash).catch(() => r.metadata?.text ?? '');
          return { ...r, text: content };
        }),
      );

      return { success: true, data: hydrated };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  private async handleUpdate(inst: Text2MemInstruction): Promise<Text2MemResult> {
    try {
      const { id, text } = inst.payload ?? {};
      if (!id) return { success: false, error: 'payload.id is required' };

      const cas = this.kernel.getCAS();
      const embedder = this.kernel.getEmbedder();
      const storage = this.kernel.getVectorStorage();

      const updates: Record<string, any> = {};
      if (text) {
        updates.hash = await cas.write(text);
        updates.vector = await embedder.embed(text);
      }
      if (inst.payload?.tags) updates.metadata = { ...(inst.payload.metadata ?? {}), tags: inst.payload.tags };
      if (inst.payload?.category) updates.metadata = { ...(updates.metadata ?? inst.payload.metadata ?? {}), category: inst.payload.category };

      await storage.update(id, updates);
      return { success: true, data: { id } };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  private async handleDelete(inst: Text2MemInstruction): Promise<Text2MemResult> {
    try {
      const { ids, category } = inst.payload ?? {};
      const storage = this.kernel.getVectorStorage();

      if (ids?.length) {
        for (const id of ids) {
          await storage.delete(`id = '${id}'`);
        }
      } else if (category) {
        await storage.delete(`track_id = '${this.id}' AND category = '${category}'`);
      } else {
        return { success: false, error: 'payload.ids or payload.category required' };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  private async handleMerge(inst: Text2MemInstruction): Promise<Text2MemResult> {
    try {
      const { ids } = inst.payload ?? {};
      if (!ids?.length || ids.length < 2) return { success: false, error: 'payload.ids must have at least 2 entries' };

      const storage = this.kernel.getVectorStorage();
      const cas = this.kernel.getCAS();

      const records = await storage.list(`track_id = '${this.id}'`);
      const toMerge = records.filter((r) => ids.includes(r.id));
      if (toMerge.length < 2) return { success: false, error: 'Not enough records found to merge' };

      const allTags = toMerge.flatMap((r) => r.metadata?.tags ?? []);
      const mergedTags = [...new Set(allTags)];
      const maxImportance = Math.max(...toMerge.map((r) => r.metadata?.importance ?? 0));

      const mergedText = (await Promise.all(toMerge.map((r) => cas.read(r.hash).catch(() => '')))).join('\n\n---\n\n');

      const result = await this.handleAdd({
        op: MemoOp.ADD,
        trackId: this.id,
        payload: { text: mergedText, tags: mergedTags, importance: maxImportance },
      });

      if (result.success) {
        for (const r of toMerge) {
          await storage.delete(`id = '${r.id}'`);
        }
      }

      return result;
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  private async handleList(inst: Text2MemInstruction): Promise<Text2MemResult> {
    try {
      const storage = this.kernel.getVectorStorage();
      const records = await storage.list(`track_id = '${this.id}'`);

      const categoryCounts: Record<string, number> = {};
      for (const r of records) {
        const cat = r.metadata?.category ?? 'uncategorized';
        categoryCounts[cat] = (categoryCounts[cat] ?? 0) + 1;
      }

      return { success: true, data: { categories: categoryCounts, total: records.length } };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }
}
