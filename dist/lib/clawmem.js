// ClawMem - 代码记忆系统
import * as lancedb from "@lancedb/lancedb";
import * as path from "node:path";
import * as os from "node:os";
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
            parent_symbol: null,
            file_path: "",
            language: this.config.default_language,
            importance: 0,
            timestamp: new Date().toISOString(),
            tags: [],
            source: "seed",
            access_count: 0,
            last_accessed: null,
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
        const id = `clawmem-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
        await this.table.add([
            {
                id,
                text,
                vector,
                ast_type,
                symbol_name,
                parent_symbol: null,
                file_path,
                language,
                importance,
                timestamp: new Date().toISOString(),
                tags,
                source: "cli",
                access_count: 0,
                last_accessed: null,
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
}
//# sourceMappingURL=clawmem.js.map