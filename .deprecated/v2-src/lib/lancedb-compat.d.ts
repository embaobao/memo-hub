/**
 * LanceDB 写入兼容工具
 *
 * 背景：
 * - MemoHub 的表 schema 会随着版本演进新增字段（如 access_count / entities / hash / content_ref 等）
 * - 但用户本地可能已经存在“旧 schema 的老表”（没有这些新字段）
 * - LanceDB 在写入包含“表 schema 不认识的字段”时会直接抛错，导致写入链路（例如 librarian ingest-git）中断
 *
 * 目标：
 * - 通用化兼容策略：尽最大努力写入，不因为“老表缺字段”而失败
 * - 优先使用表 schema 做白名单过滤；若运行期拿不到 schema，则退化为“按错误提示剔除字段并重试”
 *
 * 重要说明：
 * - 这里只处理“多余字段”导致的 schema mismatch；
 * - 若是“必填字段缺失 / 类型不匹配 / 其它底层错误”，应直接抛出，避免吞掉真实问题。
 */
type AnyTable = {
    add: (rows: Array<Record<string, unknown>>) => Promise<unknown>;
    schema?: unknown;
};
type AddCompatResult = {
    removed_fields: string[];
    used_schema_filter: boolean;
    attempts: number;
};
/**
 * 通用写入兼容：按 schema 过滤 + 异常驱动剔除未知字段重试。
 *
 * 使用方式：
 * - 你只要把“新版本要写入的完整 row”传进来即可
 * - 函数会尽力让写入在旧表上也能成功（把旧表没有的字段自动去掉）
 */
export declare function addRowsWithSchemaCompatibility(table: AnyTable, rows: Array<Record<string, unknown>>, options?: {
    max_retries?: number;
}): Promise<AddCompatResult>;
export {};
//# sourceMappingURL=lancedb-compat.d.ts.map