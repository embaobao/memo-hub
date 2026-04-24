import type { CasConfig } from "../types/index.js";
export interface CasPutResult {
    contentHash: string;
    contentRef: string;
}
/**
 * ContentAddressableStorage：内容寻址存储（CAS）
 *
 * 目标：
 * - 输入原文 text → 计算 sha256 → 以 hash 命名落盘
 * - 通过 contentRef 引用原文，便于后续“灵肉分离”：索引可重建、原文可去重
 *
 * 约定：
 * - contentHash：sha256 十六进制字符串
 * - contentRef：统一使用 `sha256:<hash>` 形式（不包含物理路径，便于迁移根目录）
 * - 文件落盘：<root>/<hash前2位>/<hash>（分片目录避免单目录过多文件）
 */
export declare class ContentAddressableStorage {
    private rootPath;
    constructor(config: CasConfig);
    /**
     * 计算 sha256（十六进制）
     *
     * 注意：
     * - 这里不复用 src/lib/utils.ts 的 computeHash，是为了避免引入 Tree-sitter 等可选依赖，
     *   保持 CAS 为一个轻量、可独立复用的基础设施模块
     */
    computeSha256(text: string): string;
    /**
     * 构造 contentRef（不包含物理路径）
     */
    buildContentRef(hash: string): string;
    /**
     * 从 contentRef 解析 hash
     *
     * 兼容策略：
     * - 支持 `sha256:<hash>`（推荐）
     * - 支持直接传 `<hash>`（用于历史/调试场景）
     */
    parseHashFromRef(contentRef: string): string | null;
    /**
     * 根据 hash 计算落盘路径
     */
    resolvePathByHash(hash: string): string;
    /**
     * 写入原文（幂等）：同 hash 内容只会落盘一次
     */
    putText(text: string): Promise<CasPutResult>;
    /**
     * 读取原文
     */
    getTextByRef(contentRef: string): Promise<string | null>;
    /**
     * 校验并读取原文（校验失败返回 null）
     */
    getTextVerified(options: {
        contentRef: string;
        contentHash?: string;
    }): Promise<string | null>;
    /**
     * 遍历 CAS 内的所有 hash（用于索引重建/巡检）
     */
    listAllHashes(): Promise<string[]>;
    private fileExists;
    private safeUnlink;
}
//# sourceMappingURL=cas.d.ts.map