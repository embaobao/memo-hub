import type { ClawMemRecord, ClawMemConfig, AddCodeParams } from "../types/index.js";
import { Embedder } from "../core/embedder.js";
export declare class ClawMem {
    private db;
    private table;
    private config;
    private embedder;
    constructor(config: ClawMemConfig, embedder: Embedder);
    /**
     * 初始化数据库连接
     */
    initialize(): Promise<void>;
    /**
     * 创建新表
     */
    private createTable;
    /**
     * 添加代码记录
     */
    addCode(params: AddCodeParams): Promise<string>;
    /**
     * 搜索代码
     */
    searchCode(query: string, options?: {
        limit?: number;
        language?: string;
        ast_type?: string;
    }): Promise<ClawMemRecord[]>;
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
     * 列出所有符号
     */
    listSymbols(options?: {
        language?: string;
        ast_type?: string;
    }): Promise<Array<{
        symbol: string;
        ast_type: string;
        file_path: string;
        language: string;
    }>>;
    /**
     * 获取所有记录
     */
    getAllRecords(): Promise<ClawMemRecord[]>;
    /**
     * 删除代码记录
     */
    deleteCode(ids: string[]): Promise<number>;
    /**
     * 按语言删除
     */
    deleteByLanguage(language: string): Promise<number>;
}
//# sourceMappingURL=clawmem.d.ts.map