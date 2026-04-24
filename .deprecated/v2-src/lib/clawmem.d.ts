import type { ClawMemRecord, ClawMemConfig, AddCodeParams } from "../types/index.js";
import { Embedder } from "../core/embedder.js";
import { ContentAddressableStorage } from "../core/cas.js";
export declare class ClawMem {
    private db;
    private table;
    private config;
    private embedder;
    private cas?;
    constructor(config: ClawMemConfig, embedder: Embedder, cas?: ContentAddressableStorage);
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
    searchCodeFTS(query: string, options?: {
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