import { MemoOp, extractEntitiesFromText } from '@memohub/protocol';
/**
 * 知识沉淀轨道 (Insight Track)
 * 职责: 存储 LLM 提纯后的事实、决策定论和用户偏好。
 */
export class InsightTrack {
    id = 'track-insight';
    name = 'Insight Track';
    kernel;
    /**
     * 初始化轨道，注入内核引用
     */
    async initialize(kernel) {
        this.kernel = kernel;
    }
    /**
     * 执行 Text2Mem 指令
     */
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
                return { success: false, error: `轨道 track-insight 不支持操作: ${instruction.op}` };
        }
    }
    /**
     * 添加新知识
     */
    async handleAdd(inst) {
        try {
            const { text, category = 'other', importance = 0.5, tags = [], entities: providedEntities = [], confidence = 0.9 } = inst.payload ?? {};
            if (!text)
                return { success: false, error: 'payload.text 不能为空' };
            const cas = this.kernel.getCAS();
            const storage = this.kernel.getVectorStorage();
            const embedder = this.kernel.getEmbedder();
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
                confidence,
                source: inst.context?.source ?? 'cli',
                timestamp: new Date().toISOString(),
                access_count: 0,
                last_accessed: new Date().toISOString(),
            });
            return { success: true, data: { id, hash } };
        }
        catch (error) {
            return { success: false, error: error instanceof Error ? error.message : String(error) };
        }
    }
    /**
     * 检索相关知识
     */
    async handleRetrieve(inst) {
        try {
            const { query, limit = 5, filters } = inst.payload ?? {};
            if (!query)
                return { success: false, error: 'payload.query 不能为空' };
            const storage = this.kernel.getVectorStorage();
            const embedder = this.kernel.getEmbedder();
            const cas = this.kernel.getCAS();
            const vector = await embedder.embed(query);
            let filterParts = [`track_id = '${this.id}'`];
            if (filters?.category)
                filterParts.push(`category = '${filters.category}'`);
            if (filters?.min_importance)
                filterParts.push(`importance >= ${filters.min_importance}`);
            const results = await storage.search(vector, {
                limit,
                filter: filterParts.join(' AND '),
            });
            const hydrated = await Promise.all(results.map(async (r) => {
                const content = await cas.read(r.hash).catch(() => '');
                return { ...r, text: content };
            }));
            return { success: true, data: hydrated };
        }
        catch (error) {
            return { success: false, error: error instanceof Error ? error.message : String(error) };
        }
    }
    /**
     * 更新知识
     */
    async handleUpdate(inst) {
        try {
            const { id, text, ...rest } = inst.payload ?? {};
            if (!id)
                return { success: false, error: 'payload.id 不能为空' };
            const updates = { ...rest };
            if (text) {
                updates.hash = await this.kernel.getCAS().write(text);
                updates.vector = await this.kernel.getEmbedder().embed(text);
            }
            await this.kernel.getVectorStorage().update(id, updates);
            return { success: true, data: { id } };
        }
        catch (error) {
            return { success: false, error: error instanceof Error ? error.message : String(error) };
        }
    }
    /**
     * 删除知识
     */
    async handleDelete(inst) {
        try {
            const { ids } = inst.payload ?? {};
            if (!ids?.length)
                return { success: false, error: 'payload.ids 不能为空' };
            const storage = this.kernel.getVectorStorage();
            for (const id of ids) {
                await storage.delete(`id = '${id}'`);
            }
            return { success: true };
        }
        catch (error) {
            return { success: false, error: error instanceof Error ? error.message : String(error) };
        }
    }
    /**
     * 合并多个知识条目
     */
    async handleMerge(inst) {
        try {
            const { ids, summary } = inst.payload ?? {};
            if (!ids?.length || ids.length < 2)
                return { success: false, error: '合并至少需要 2 个 ID' };
            const storage = this.kernel.getVectorStorage();
            const cas = this.kernel.getCAS();
            const records = await storage.list(`track_id = '${this.id}'`);
            const toMerge = records.filter(r => ids.includes(r.id));
            const texts = await Promise.all(toMerge.map(r => cas.read(r.hash)));
            const combinedText = summary || texts.join('\n\n---\n\n');
            const addResult = await this.handleAdd({
                op: MemoOp.ADD,
                trackId: this.id,
                payload: {
                    text: combinedText,
                    category: toMerge[0].category,
                    tags: [...new Set(toMerge.flatMap(r => r.tags || []))],
                    importance: Math.max(...toMerge.map(r => r.importance || 0.5)),
                }
            });
            if (addResult.success) {
                await this.handleDelete({ op: MemoOp.DELETE, trackId: this.id, payload: { ids } });
            }
            return addResult;
        }
        catch (error) {
            return { success: false, error: error instanceof Error ? error.message : String(error) };
        }
    }
    /**
     * 澄清知识冲突或模糊
     */
    async handleClarify(inst) {
        // 澄清通常涉及用户反馈，此处更新置信度或添加备注
        const { id, question, answer } = inst.payload ?? {};
        if (!id)
            return { success: false, error: 'payload.id 不能为空' };
        return this.handleUpdate({
            op: MemoOp.UPDATE,
            trackId: this.id,
            payload: {
                id,
                confidence: 1.0, // 澄清后置信度设为最高
                metadata: { clarification: { question, answer, timestamp: new Date().toISOString() } }
            }
        });
    }
    /**
     * 导出轨道数据
     */
    async handleExport(inst) {
        try {
            const { format = 'json' } = inst.payload ?? {};
            const records = await this.kernel.getVectorStorage().list(`track_id = '${this.id}'`);
            const cas = this.kernel.getCAS();
            const fullData = await Promise.all(records.map(async (r) => ({
                ...r,
                text: await cas.read(r.hash).catch(() => '')
            })));
            return { success: true, data: format === 'json' ? fullData : JSON.stringify(fullData, null, 2) };
        }
        catch (error) {
            return { success: false, error: error instanceof Error ? error.message : String(error) };
        }
    }
    /**
     * 蒸馏知识（提炼精华）
     */
    async handleDistill(inst) {
        const { ids } = inst.payload ?? {};
        if (!ids?.length)
            return { success: false, error: 'payload.ids 不能为空' };
        const completer = this.kernel.getCompleter();
        if (!completer)
            return { success: false, error: '内核未配置 AI Completer，无法执行蒸馏' };
        const records = await this.kernel.getVectorStorage().list(`track_id = '${this.id}'`);
        const toDistill = records.filter(r => ids.includes(r.id));
        const texts = await Promise.all(toDistill.map(r => this.kernel.getCAS().read(r.hash)));
        const summary = await completer.summarize(texts.join('\n\n'));
        return this.handleAdd({
            op: MemoOp.ADD,
            trackId: this.id,
            payload: {
                text: summary,
                category: 'distilled',
                importance: 0.9,
                tags: ['distilled', ...new Set(toDistill.flatMap(r => r.tags || []))]
            }
        });
    }
    /**
     * 锚定知识（关联外部实体）
     */
    async handleAnchor(inst) {
        const { id, external_ref } = inst.payload ?? {};
        if (!id || !external_ref)
            return { success: false, error: 'id 和 external_ref 均不能为空' };
        return this.handleUpdate({
            op: MemoOp.UPDATE,
            trackId: this.id,
            payload: { id, metadata: { anchor: external_ref } }
        });
    }
    /**
     * 对比知识差异
     */
    async handleDiff(inst) {
        const { source_id, target_id } = inst.payload ?? {};
        if (!source_id || !target_id)
            return { success: false, error: 'source_id 和 target_id 不能为空' };
        const cas = this.kernel.getCAS();
        const storage = this.kernel.getVectorStorage();
        const [src] = await storage.list(`id = '${source_id}'`);
        const [tgt] = await storage.list(`id = '${target_id}'`);
        if (!src || !tgt)
            return { success: false, error: '记录未找到' };
        const srcText = await cas.read(src.hash);
        const tgtText = await cas.read(tgt.hash);
        return {
            success: true,
            data: {
                text_diff: srcText === tgtText ? 'identical' : 'different',
                metadata_diff: JSON.stringify(src) === JSON.stringify(tgt) ? 'identical' : 'different'
            }
        };
    }
    /**
     * 同步外部数据
     */
    async handleSync(inst) {
        // 简单实现：如果是 ADD 模式则直接添加
        const { mode = 'add', data } = inst.payload ?? {};
        if (mode === 'add' && Array.isArray(data)) {
            const results = [];
            for (const item of data) {
                results.push(await this.handleAdd({ op: MemoOp.ADD, trackId: this.id, payload: item }));
            }
            return { success: true, data: results };
        }
        return { success: false, error: 'Sync 模式暂仅支持 add' };
    }
    /**
     * 列出轨道统计信息
     */
    async handleList(inst) {
        try {
            const { category } = inst.payload ?? {};
            let filter = `track_id = '${this.id}'`;
            if (category)
                filter += ` AND category = '${category}'`;
            const records = await this.kernel.getVectorStorage().list(filter);
            return { success: true, data: { count: records.length, items: records.map(r => ({ id: r.id, hash: r.hash, category: r.category })) } };
        }
        catch (error) {
            return { success: false, error: error instanceof Error ? error.message : String(error) };
        }
    }
}
//# sourceMappingURL=index.js.map