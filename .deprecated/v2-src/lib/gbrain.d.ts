import type { GBrainRecord, GBrainConfig, AddKnowledgeParams } from "../types/index.js";
import { Embedder } from "../core/embedder.js";
import { ContentAddressableStorage } from "../core/cas.js";
export declare class GBrain {
    private db;
    private table;
    private config;
    private embedder;
    private cas?;
    constructor(config: GBrainConfig, embedder: Embedder, cas?: ContentAddressableStorage);
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
    searchKnowledgeFTS(query: string, options?: {
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