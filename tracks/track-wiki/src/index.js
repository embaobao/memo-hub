import { MemoOp } from '@memohub/protocol';
/**
 * 真理库轨道 (Wiki Track)
 * 职责: 存储经过 Librarian 整理且通过“澄清环节”确认的权威知识。
 */
export class WikiTrack {
    id = 'track-wiki';
    name = 'Wiki Track';
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
    async handleAdd(inst) {
        try {
            const { title, content, category = 'wiki', version = '1.0.0' } = inst.payload ?? {};
            if (!title || !content)
                return { success: false, error: 'title 和 content 均为必填项' };
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
        }
        catch (error) {
            return { success: false, error: String(error) };
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
    async handleUpdate(inst) {
        const { id, content, version } = inst.payload ?? {};
        const updates = { version };
        if (content) {
            updates.hash = await this.kernel.getCAS().write(content);
            updates.vector = await this.kernel.getEmbedder().embed(content);
        }
        await this.kernel.getVectorStorage().update(id, updates);
        return { success: true };
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
    async handleExport(inst) {
        const records = await this.kernel.getVectorStorage().list(`track_id = '${this.id}'`);
        return { success: true, data: records };
    }
    async handleAnchor(inst) {
        return { success: true };
    }
}
//# sourceMappingURL=index.js.map