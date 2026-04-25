import { MemoOp } from '@memohub/protocol';
/**
 * 时序流轨道 (Stream Track)
 * 职责: 记录原始对话 Log，管理 TTL。
 */
export class StreamTrack {
    id = 'track-stream';
    name = 'Stream Track';
    kernel;
    async initialize(kernel) {
        this.kernel = kernel;
    }
    async execute(instruction) {
        switch (instruction.op) {
            case MemoOp.ADD:
                return this.handleAdd(instruction);
            case MemoOp.RETRIEVE:
                return this.handleRetrieve(instruction);
            case MemoOp.DELETE:
                return this.handleDelete(instruction);
            case MemoOp.LIST:
                return this.handleList(instruction);
            default:
                return { success: false, error: `Operation ${instruction.op} not supported by track-stream` };
        }
    }
    async handleAdd(inst) {
        try {
            const { content, role = 'user', session_id = 'default' } = inst.payload ?? {};
            const storage = this.kernel.getVectorStorage();
            const embedder = this.kernel.getEmbedder();
            const cas = this.kernel.getCAS();
            const hash = await cas.write(content);
            const vector = await embedder.embed(content);
            const id = `stream-${Date.now()}`;
            await storage.add({
                id, vector, hash, track_id: this.id,
                session_id, role, timestamp: new Date().toISOString(),
                distilled: false
            });
            return { success: true, data: { id, hash } };
        }
        catch (e) {
            return { success: false, error: String(e) };
        }
    }
    async handleRetrieve(inst) {
        const { query, limit = 5 } = inst.payload ?? {};
        const vector = await this.kernel.getEmbedder().embed(query);
        const results = await this.kernel.getVectorStorage().search(vector, {
            limit, filter: `track_id = '${this.id}'`
        });
        const hydrated = await Promise.all(results.map(async (r) => ({
            ...r,
            text: await this.kernel.getCAS().read(r.hash).catch(() => '')
        })));
        return { success: true, data: hydrated };
    }
    async handleDelete(inst) {
        const { ids } = inst.payload ?? {};
        for (const id of ids)
            await this.kernel.getVectorStorage().delete(`id = '${id}'`);
        return { success: true };
    }
    async handleList(inst) {
        const records = await this.kernel.getVectorStorage().list(`track_id = '${this.id}'`);
        return { success: true, data: records };
    }
}
//# sourceMappingURL=index.js.map