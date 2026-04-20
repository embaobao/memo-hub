// ClawMem - 代码记忆系统
import * as lancedb from "@lancedb/lancedb";
import * as path from "node:path";
import * as os from "node:os";
import { computeHash, extractEntitiesFromCode } from "./utils.js";
export class ClawMem {
    db;
    table;
    config;
    embedder;
    constructor(config, embedder) {
        this.config = config;
        this.embedder = embedder;
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
        };
        this.table = await this.db.createTable(this.config.table_name, [seed]);
        await this.table.delete('id = "__schema__"');
    }
    /**
     * 添加代码记录
     */
    async addCode(params) {
        const { text, language = this.config.default_language, ast_type = "unknown", symbol_name = "", file_path = "", importance = this.config.default_importance, tags = [], } = params;
        const vector = await this.embedder.embed(text);
        const hash = computeHash(text);
        // 使用 Tree-sitter 提取实体（接口、函数、类名等）
        const entities = extractEntitiesFromCode(text, language);
        // 如果没有 symbol_name 但提取到了实体，使用第一个实体作为 symbol_name
        const finalSymbolName = symbol_name || (entities.length > 0 ? entities[0] : "");
        const id = `clawmem-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
        await this.table.add([
            {
                id,
                text,
                vector,
                ast_type,
                symbol_name: finalSymbolName,
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
            },
        ]);
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