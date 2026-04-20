import type { GBrainRecord, GBrainConfig, AddKnowledgeParams } from "../types/index.js";
import { Embedder } from "../core/embedder.js";
export declare class GBrain {
    private db;
    private table;
    private config;
    private embedder;
    constructor(config: GBrainConfig, embedder: Embedder);
    /**
     * 初始化数据库连接
     */
    initialize(): Promise<void>;
    /**
     * 创建新表
     */
    private createTable;
    /**
     * 添加知识记录
     */
    addKnowledge(params: AddKnowledgeParams): Promise<string>;
    /**
     * 搜索知识
     */
    searchKnowledge(query: string, options?: {
        limit?: number;
        category?: string;
    }): Promise<GBrainRecord[]>;
    /**
     * 获取统计数据
     */
    getStats(): Promise<{
        total_records: number;
        db_path: string;
        embedding_model: string;
        vector_dim: number;
    }>;
    /**
     * 列出所有分类
     */
    listCategories(): Promise<Record<string, number>>;
    /**
     * 获取所有记录
     */
    getAllRecords(): Promise<GBrainRecord[]>;
    /**
     * 删除知识记录
     */
    deleteKnowledge(ids: string[]): Promise<number>;
    /**
     * 按分类删除
     */
    deleteByCategory(category: string): Promise<number>;
}
//# sourceMappingURL=gbrain.d.ts.map