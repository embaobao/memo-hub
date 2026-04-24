// ClawMem - 代码记忆系统
import * as lancedb from "@lancedb/lancedb";
import * as path from "node:path";
import * as os from "node:os";
import { computeHash, extractCodeEntitiesAndMetadata } from "./utils.js";
import { addRowsWithSchemaCompatibility } from "./lancedb-compat.js";
export class ClawMem {
    db;
    table;
    config;
    embedder;
    cas;
    constructor(config, embedder, cas) {
        this.config = config;
        this.embedder = embedder;
        this.cas = cas;
    }
    /**
     * 初始化数据库连接
     */
    async initialize() {
        const dbPath = this.config.db_path.replace(/^~/, os.homedir());
        const absolutePath = path.resolve(dbPath);
        this.db = await lancedb.connect(absolutePath);
        // 检查表是否存在
        const tableNames = await this.db.tableNames();
        if (tableNames.includes(this.config.table_name)) {
            this.table = await this.db.openTable(this.config.table_name);
        }
        else {
            // 创建新表
            await this.createTable();
        }
    }
    /**
     * 创建新表
     */
    async createTable() {
        const seed = {
            id: "__schema__",
            text: "",
            vector: new Array(this.embedder["config"].dimensions).fill(0),
            ast_type: "unknown",
            symbol_name: "",
            parent_symbol: "", // 使用空字符串而不是 null
            file_path: "",
            language: this.config.default_language,
            importance: 0,
            timestamp: new Date().toISOString(),
            tags: ["seed"], // 使用非空数组让 LanceDB 正确推断类型
            source: "seed",
            access_count: 0,
            last_accessed: new Date().toISOString(), // 使用实际值而不是 null
            entities: ["seed"], // 非空数组
            hash: "seed", // 非空字符串
            content_ref: "sha256:seed", // 非空字符串（CAS 引用）
        };
        this.table = await this.db.createTable(this.config.table_name, [seed]);
        await this.table.delete('id = "__schema__"');
    }
    /**
     * 添加代码记录
     */
    async addCode(params) {
        const { text, language = this.config.default_language, ast_type = "unknown", symbol_name = "", file_path = "", importance = this.config.default_importance, tags = [], content_ref, } = params;
        const casResult = this.cas ? await this.cas.putText(text) : null;
        const hash = casResult?.contentHash ?? computeHash(text);
        const resolvedContentRef = content_ref ?? casResult?.contentRef;
        const vector = await this.embedder.embed(text);
        /**
         * 代码轨 AST/实体抽取（Tree-sitter 优先，正则兜底）
         *
         * 说明：
         * - entities 用于“实体纽带”（混合检索加权），会落入 ClawMem 索引字段
         * - primarySymbol 可用于在用户未显式传入 symbol_name/ast_type 时做自动补齐
         */
        const { entities, metadata } = await extractCodeEntitiesAndMetadata(text, language);
        const inferredAstType = ast_type && String(ast_type).trim() !== "" && ast_type !== "unknown"
            ? ast_type
            : (metadata.primarySymbol?.kind ?? "unknown");
        // 如果没有 symbol_name 但提取到了实体，优先使用导出符号，其次用第一个实体
        const inferredSymbolName = symbol_name && String(symbol_name).trim() !== ""
            ? symbol_name
            : (metadata.primarySymbol?.name ?? (entities.length > 0 ? entities[0] : ""));
        const id = `clawmem-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
        const baseRow = {
            id,
            text,
            vector,
            ast_type: inferredAstType,
            symbol_name: inferredSymbolName,
            parent_symbol: "", // 使用空字符串而不是 null
            file_path,
            language,
            importance,
            timestamp: new Date().toISOString(),
            tags,
            source: "cli",
            access_count: 0,
            last_accessed: null,
            entities,
            hash,
        };
        if (resolvedContentRef) {
            baseRow["content_ref"] = resolvedContentRef;
        }
        /**
         * 兼容性处理：老表 schema 缺字段时不要让写入失败。
         *
         * 典型场景：
         * - 新版本新增字段：access_count / last_accessed / entities / hash / content_ref ...
         * - 用户本地仍是旧表：没有这些字段，直接写会被 LanceDB 拒绝
         *
         * 策略：
         * - 优先按“表 schema 白名单”过滤 row（如果运行期可拿到 schema）
         * - 拿不到 schema 或仍报错时，再根据错误信息提取未知字段名并逐个剔除重试
         */
        await addRowsWithSchemaCompatibility(this.table, [baseRow]);
        return id;
    }
    /**
     * 搜索代码
     */
    async searchCode(query, options = {}) {
        const { limit = 5, language, ast_type } = options;
        const vector = await this.embedder.embed(query);
        let search = this.table
            .vectorSearch(vector)
            .distanceType("cosine")
            .limit(limit);
        const conditions = [];
        if (language) {
            conditions.push(`language = '${language.replace(/'/g, "\\'")}'`);
        }
        if (ast_type) {
            conditions.push(`ast_type = '${ast_type.replace(/'/g, "\\'")}'`);
        }
        if (conditions.length > 0) {
            search = search.where(conditions.join(" AND "));
        }
        const results = await search.toArray();
        return results;
    }
    /**
     * 搜索代码（FTS：全文检索，可选能力）
     *
     * 设计目标：
     * - 保持向量召回为必选（searchCode 不变）
     * - FTS 作为可选插槽：当 LanceDB / 表索引支持全文检索时启用；否则返回空数组
     *
     * 注意：
     * - FTS 是否真正生效，取决于表是否构建了全文索引（底层实现可能直接抛错）
     * - 为了保持兼容性，这里必须做“异常吞掉 + 空结果”兜底，不影响向量检索主链路
     */
    async searchCodeFTS(query, options = {}) {
        const { limit = 5, language, ast_type } = options ?? {};
        const tableSearch = this.table?.search;
        if (typeof tableSearch !== "function") {
            return [];
        }
        try {
            let search = tableSearch.call(this.table, query).limit(limit);
            const conditions = [];
            if (language) {
                conditions.push(`language = '${language.replace(/'/g, "\\'")}'`);
            }
            if (ast_type) {
                conditions.push(`ast_type = '${ast_type.replace(/'/g, "\\'")}'`);
            }
            if (conditions.length > 0) {
                search = search.where(conditions.join(" AND "));
            }
            const results = await search.toArray();
            return results;
        }
        catch {
            return [];
        }
    }
    /**
     * 获取统计数据
     */
    async getStats() {
        const count = await this.table.countRows();
        return {
            total_records: count,
            db_path: this.config.db_path,
            embedding_model: this.embedder["config"].model,
            vector_dim: this.embedder["config"].dimensions,
        };
    }
    /**
     * 列出所有符号
     */
    async listSymbols(options = {}) {
        const { language, ast_type } = options;
        const conditions = [];
        if (language) {
            conditions.push(`language = '${language}'`);
        }
        if (ast_type) {
            conditions.push(`ast_type = '${ast_type}'`);
        }
        const all = await this.table
            .query()
            .where(conditions.length > 0 ? conditions.join(" AND ") : undefined)
            .limit(10000)
            .toArray();
        return all
            .filter((r) => r.symbol_name && String(r.symbol_name) !== "")
            .map((r) => ({
            symbol: r.symbol_name,
            ast_type: r.ast_type,
            file_path: r.file_path,
            language: r.language,
        }));
    }
    /**
     * 获取所有记录
     */
    async getAllRecords() {
        const all = await this.table.query().limit(10000).toArray();
        return all;
    }
    /**
     * 删除代码记录
     */
    async deleteCode(ids) {
        if (ids.length === 0) {
            return 0;
        }
        // 构建 WHERE 条件
        const conditions = ids.map((id) => `id = '${id.replace(/'/g, "\\'")}'`).join(" OR ");
        await this.table.delete(conditions);
        return ids.length;
    }
    /**
     * 按语言删除
     */
    async deleteByLanguage(language) {
        await this.table.delete(`language = '${language.replace(/'/g, "\\'")}'`);
        // 返回删除的记录数
        const all = await this.table.query().limit(10000).toArray();
        const deleted = all.filter((r) => r.language === language).length;
        return deleted;
    }
}
//# sourceMappingURL=clawmem.js.map