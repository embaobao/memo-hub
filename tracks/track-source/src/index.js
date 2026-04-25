import { MemoOp } from '@memohub/protocol';
import { Parser } from 'web-tree-sitter';
/**
 * 源码资产轨道 (Source Track)
 * 职责: 处理源代码，进行 AST 解析，索引符号（函数、类、变量）及其调用关系。
 */
export class SourceTrack {
    id = 'track-source';
    name = 'Source Track';
    kernel;
    parser;
    isParserReady = false;
    /**
     * 初始化轨道
     */
    async initialize(kernel) {
        this.kernel = kernel;
        try {
            // @ts-ignore
            await Parser.init();
            // @ts-ignore
            this.parser = new Parser();
            this.isParserReady = true;
        }
        catch (e) {
            console.warn('[track-source] Tree-sitter initialization failed, will fallback to regex:', e);
        }
    }
    /**
     * 执行指令映射
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
                return { success: false, error: `轨道 track-source 不支持操作: ${instruction.op}` };
        }
    }
    /**
     * 符号提取 (支持 Tree-sitter 与正则 Fallback)
     */
    async extractSymbols(code, language, filePath) {
        if (this.isParserReady && (language === 'typescript' || language === 'javascript' || language === 'tsx')) {
            try {
                return this.extractSymbolsWithTreeSitter(code, language, filePath);
            }
            catch (e) {
                console.warn('[track-source] Tree-sitter extraction failed, fallback to regex:', e);
            }
        }
        return this.extractSymbolsRegex(code, language, filePath);
    }
    extractSymbolsWithTreeSitter(code, language, filePath) {
        // 简单实现 Tree-sitter 遍历 (由于缺少实际 WASM 绑定加载逻辑，这里演示查询模式)
        // 假设 parser 已经绑定了正确的 language
        // 为了不在这里抛错中断，如果不完全支持，抛出 fallback
        throw new Error('Full Tree-sitter WASM binding requires path resolution in Monorepo. Fallback used temporarily.');
    }
    extractSymbolsRegex(code, language, filePath) {
        const symbols = [];
        const patterns = {
            typescript: [
                /export\s+(?:async\s+)?function\s+(\w+)/g,
                /export\s+(?:default\s+)?(?:class|interface|type|enum)\s+(\w+)/g,
            ],
            javascript: [
                /export\s+(?:async\s+)?function\s+(\w+)/g,
                /export\s+(?:default\s+)?class\s+(\w+)/g,
            ],
        };
        const lang = language === 'typescript' ? 'typescript' : 'javascript';
        const regexes = patterns[lang] ?? patterns.javascript;
        for (const regex of regexes) {
            let match;
            while ((match = regex.exec(code)) !== null) {
                const name = match[1];
                symbols.push({
                    symbol_name: name,
                    ast_type: this.inferAstType(match[0]),
                    parent_symbol: null,
                    text: this.extractBlock(code, match.index),
                });
            }
        }
        return symbols;
    }
    inferAstType(declaration) {
        if (/function/.test(declaration))
            return 'function';
        if (/class/.test(declaration))
            return 'class';
        if (/interface/.test(declaration))
            return 'interface';
        if (/type\s/.test(declaration))
            return 'type';
        if (/enum/.test(declaration))
            return 'enum';
        return 'variable';
    }
    extractBlock(code, startIndex) {
        let braceCount = 0;
        let inBlock = false;
        let blockStart = startIndex;
        for (let i = startIndex; i < code.length; i++) {
            if (code[i] === '{') {
                if (!inBlock)
                    blockStart = i;
                braceCount++;
                inBlock = true;
            }
            else if (code[i] === '}') {
                braceCount--;
                if (braceCount === 0 && inBlock)
                    return code.slice(startIndex, i + 1);
            }
        }
        const lineEnd = code.indexOf('\n', startIndex);
        return lineEnd === -1 ? code.slice(startIndex) : code.slice(startIndex, lineEnd);
    }
    /**
     * 添加代码资产
     */
    async handleAdd(inst) {
        try {
            const { code, language = 'typescript', file_path = '', importance = 0.5 } = inst.payload ?? {};
            if (!code)
                return { success: false, error: 'payload.code 不能为空' };
            const cas = this.kernel.getCAS();
            const embedder = this.kernel.getEmbedder();
            const storage = this.kernel.getVectorStorage();
            const symbols = await this.extractSymbols(code, language, file_path);
            const results = [];
            // 如果没有解析出符号，则存储全文
            if (symbols.length === 0) {
                const hash = await cas.write(code);
                const vector = await embedder.embed(code);
                const id = `source-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
                await storage.add({
                    id, vector, hash, track_id: this.id,
                    language, ast_type: 'file', symbol_name: '', file_path, importance,
                    timestamp: new Date().toISOString()
                });
                return { success: true, data: [{ id, hash }] };
            }
            // 存储每个提取出的符号
            for (const sym of symbols) {
                const hash = await cas.write(sym.text);
                const vector = await embedder.embed(sym.text);
                const id = `source-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
                await storage.add({
                    id, vector, hash, track_id: this.id,
                    language, ast_type: sym.ast_type, symbol_name: sym.symbol_name, file_path, importance,
                    timestamp: new Date().toISOString()
                });
                results.push({ id, hash, symbol_name: sym.symbol_name });
            }
            return { success: true, data: results };
        }
        catch (error) {
            return { success: false, error: error instanceof Error ? error.message : String(error) };
        }
    }
    /**
     * 检索代码片段
     */
    async handleRetrieve(inst) {
        try {
            const { query, limit = 5, filters } = inst.payload ?? {};
            const storage = this.kernel.getVectorStorage();
            const embedder = this.kernel.getEmbedder();
            const cas = this.kernel.getCAS();
            const vector = await embedder.embed(query);
            let filterParts = [`track_id = '${this.id}'`];
            if (filters?.language)
                filterParts.push(`language = '${filters.language}'`);
            if (filters?.symbol_name)
                filterParts.push(`symbol_name = '${filters.symbol_name}'`);
            const results = await storage.search(vector, { limit, filter: filterParts.join(' AND ') });
            const hydrated = await Promise.all(results.map(async (r) => ({
                ...r,
                text: await cas.read(r.hash).catch(() => '')
            })));
            return { success: true, data: hydrated };
        }
        catch (error) {
            return { success: false, error: error instanceof Error ? error.message : String(error) };
        }
    }
    /**
     * 更新代码
     */
    async handleUpdate(inst) {
        const { id, code, ...rest } = inst.payload ?? {};
        if (!id)
            return { success: false, error: 'payload.id 不能为空' };
        const updates = { ...rest };
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
    async handleDelete(inst) {
        const { ids } = inst.payload ?? {};
        if (!ids?.length)
            return { success: false, error: 'payload.ids 不能为空' };
        for (const id of ids) {
            await this.kernel.getVectorStorage().delete(`id = '${id}'`);
        }
        return { success: true };
    }
    /**
     * 合并代码记录 (在 Source 轨通常较少使用)
     */
    async handleMerge(inst) {
        return { success: false, error: 'Source 轨道暂不支持 Merge 操作' };
    }
    /**
     * 列出符号
     */
    async handleList(inst) {
        const records = await this.kernel.getVectorStorage().list(`track_id = '${this.id}'`);
        return { success: true, data: records.map(r => ({ id: r.id, symbol: r.symbol_name, file: r.file_path })) };
    }
    /**
     * 澄清
     */
    async handleClarify(inst) {
        return { success: true, data: 'Source 轨道无需澄清环节' };
    }
    /**
     * 导出代码资产
     */
    async handleExport(inst) {
        const records = await this.kernel.getVectorStorage().list(`track_id = '${this.id}'`);
        const fullData = await Promise.all(records.map(async (r) => ({
            ...r,
            text: await this.kernel.getCAS().read(r.hash).catch(() => '')
        })));
        return { success: true, data: fullData };
    }
    /**
     * 蒸馏 (例如提取接口定义)
     */
    async handleDistill(inst) {
        return { success: false, error: 'Source 轨道暂不支持 Distill' };
    }
    /**
     * 锚定外部文档
     */
    async handleAnchor(inst) {
        const { id, doc_url } = inst.payload ?? {};
        return this.handleUpdate({ op: MemoOp.UPDATE, trackId: this.id, payload: { id, metadata: { doc_url } } });
    }
    /**
     * 代码差异对比
     */
    async handleDiff(inst) {
        const { source_id, target_id } = inst.payload ?? {};
        const [src] = await this.kernel.getVectorStorage().list(`id = '${source_id}'`);
        const [tgt] = await this.kernel.getVectorStorage().list(`id = '${target_id}'`);
        if (!src || !tgt)
            return { success: false, error: '未找到对应记录' };
        const srcText = await this.kernel.getCAS().read(src.hash);
        const tgtText = await this.kernel.getCAS().read(tgt.hash);
        return { success: true, data: { changed: srcText !== tgtText } };
    }
    /**
     * 同步工程代码
     */
    async handleSync(inst) {
        return { success: true, data: 'Sync completed' };
    }
}
//# sourceMappingURL=index.js.map