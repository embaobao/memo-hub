// GBrain - 通用知识记忆系统
import * as lancedb from "@lancedb/lancedb";
import * as path from "node:path";
import * as os from "node:os";
import { computeHash } from "./utils.js";
export class GBrain {
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
            category: "other",
            scope: "global",
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
     * 添加知识记录
     */
    async addKnowledge(params) {
        const { text, category = this.config.default_category, importance = this.config.default_importance, tags = [], } = params;
        const vector = await this.embedder.embed(text);
        const hash = computeHash(text);
        const id = `gbrain-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
        await this.table.add([
            {
                id,
                text,
                vector,
                category,
                scope: "global",
                importance,
                timestamp: new Date().toISOString(),
                tags,
                source: "cli",
                access_count: 0,
                last_accessed: null,
                entities: [], // GBrain 实体暂时为空，后续可以从文本中提取
                hash,
            },
        ]);
        return id;
    }
    /**
     * 搜索知识
     */
    async searchKnowledge(query, options = {}) {
        const { limit = 5, category } = options;
        const vector = await this.embedder.embed(query);
        let search = this.table
            .vectorSearch(vector)
            .distanceType("cosine")
            .limit(limit);
        if (category) {
            search = search.where(`category = '${category.replace(/'/g, "\\'")}'`);
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
     * 列出所有分类
     */
    async listCategories() {
        const all = await this.table.query().limit(10000).toArray();
        const counts = {};
        for (const r of all) {
            const c = String(r.category ?? "unknown");
            counts[c] = (counts[c] || 0) + 1;
        }
        return counts;
    }
    /**
     * 获取所有记录
     */
    async getAllRecords() {
        const all = await this.table.query().limit(10000).toArray();
        return all;
    }
    /**
     * 删除知识记录
     */
    async deleteKnowledge(ids) {
        if (ids.length === 0) {
            return 0;
        }
        // 构建 WHERE 条件
        const conditions = ids.map((id) => `id = '${id.replace(/'/g, "\\'")}'`).join(" OR ");
        await this.table.delete(conditions);
        return ids.length;
    }
    /**
     * 按分类删除
     */
    async deleteByCategory(category) {
        await this.table.delete(`category = '${category.replace(/'/g, "\\'")}'`);
        // 返回删除的记录数
        const all = await this.table.query().limit(10000).toArray();
        const deleted = all.filter((r) => r.category === category).length;
        return deleted;
    }
}
//# sourceMappingURL=gbrain.js.map