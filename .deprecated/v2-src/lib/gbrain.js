// GBrain - 通用知识记忆系统
import * as lancedb from "@lancedb/lancedb";
import * as path from "node:path";
import * as os from "node:os";
import { computeHash } from "./utils.js";
import { extractEntitiesFromText } from "./text-entities.js";
import { addRowsWithSchemaCompatibility } from "./lancedb-compat.js";
export class GBrain {
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
            content_ref: "sha256:seed", // 非空字符串（CAS 引用）
        };
        this.table = await this.db.createTable(this.config.table_name, [seed]);
        await this.table.delete('id = "__schema__"');
    }
    /**
     * 添加知识记录
     */
    async addKnowledge(params) {
        const { text, category = this.config.default_category, importance = this.config.default_importance, tags = [], entities: providedEntities, content_ref, } = params;
        const casResult = this.cas ? await this.cas.putText(text) : null;
        const hash = casResult?.contentHash ?? computeHash(text);
        const resolvedContentRef = content_ref ?? casResult?.contentRef;
        const vector = await this.embedder.embed(text);
        const id = `gbrain-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
        /**
         * GBrain 通用实体抽取：
         * - 默认由存储层兜底抽取，确保 CLI 直写也能得到 entities
         * - 上层（如反应式管道）如果已抽取，可直接传 entities 进来，避免重复计算
         */
        const entities = Array.isArray(providedEntities) ? providedEntities : extractEntitiesFromText(text);
        const baseRow = {
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
     * 搜索知识（FTS：全文检索，可选能力）
     *
     * 设计目标：
     * - 保持向量召回为必选（searchKnowledge 不变）
     * - FTS 作为可选插槽：当 LanceDB / 表索引支持全文检索时启用；否则返回空数组
     *
     * 兼容性说明：
     * - 该方法不会被旧版 CLI/MCP 直接调用，只供新检索管道（TrackProvider.retrieveFTS）选择性使用
     * - 运行期若缺少 FTS 索引或 API 不支持，必须吞掉异常并返回空结果，避免影响主流程
     */
    async searchKnowledgeFTS(query, options = {}) {
        const { limit = 5, category } = options ?? {};
        const tableSearch = this.table?.search;
        if (typeof tableSearch !== "function") {
            return [];
        }
        try {
            let search = tableSearch.call(this.table, query).limit(limit);
            if (category) {
                search = search.where(`category = '${category.replace(/'/g, "\\'")}'`);
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