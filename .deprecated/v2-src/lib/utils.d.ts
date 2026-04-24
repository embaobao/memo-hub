/**
 * MemoHub 工具函数
 * 包含哈希计算、实体提取等功能
 */
/**
 * 代码符号类型（用于代码轨的“语义实体”抽取）
 *
 * 说明：
 * - 这里的 kind 不是 Tree-sitter 的节点类型一比一映射，而是对业务更友好的抽象。
 * - 之所以用联合类型而不是 enum，是为了让 metadata 序列化更直观、可读性更好。
 */
export type CodeSymbolKind = "function" | "class" | "interface" | "type" | "enum" | "variable" | "export" | "unknown";
/**
 * 代码片段范围（用于定位符号在原文中的位置）
 *
 * 说明：
 * - startIndex/endIndex：字节偏移（UTF-8 bytes，与 Tree-sitter 的 startIndex/endIndex 对齐）
 * - 行列信息用 0-based（与 Tree-sitter 的 row/column 对齐），上层展示时可自行 +1
 */
export interface CodeSpan {
    startIndex: number;
    endIndex: number;
    startRow: number;
    startColumn: number;
    endRow: number;
    endColumn: number;
}
/**
 * 单个符号抽取结果
 *
 * 说明：
 * - isExported：标记该符号是否“被导出”（用于优先挑选 symbol_name、也便于检索过滤）
 * - range：符号自身节点的范围（通常为标识符或声明节点范围）
 */
export interface CodeSymbol {
    name: string;
    kind: CodeSymbolKind;
    isExported: boolean;
    range: CodeSpan;
}
/**
 * 从代码中抽取到的元数据
 *
 * 说明：
 * - parseEngine：本次抽取使用的引擎（tree-sitter 或 regex 兜底）
 * - primarySymbol：用于作为“主符号名”的候选（优先导出符号，其次第一个符号）
 */
export interface ExtractedCodeMetadata {
    language: string;
    parseEngine: "tree-sitter" | "regex";
    symbols: CodeSymbol[];
    primarySymbol?: CodeSymbol;
}
/**
 * 计算文本的 SHA-256 哈希值
 * 用于去重和版本管理
 */
export declare function computeHash(text: string): string;
/**
 * 从代码中提取实体（接口、函数、类名等）
 *
 * 说明：
 * - 优先使用 Tree-sitter 做 AST 解析（至少覆盖 TS/JS）
 * - 如果 Tree-sitter 依赖缺失 / 解析异常，则回退到正则提取（保证能力不退化）
 *
 * 注意：
 * - 该函数为了兼容旧调用点，仍然只返回 entities（符号名数组）
 * - 更完整的结构化信息请使用 extractCodeEntitiesAndMetadata
 */
export declare function extractEntitiesFromCode(code: string, language?: string): Promise<string[]>;
/**
 * 从代码文本中抽取“实体纽带（entities）”与“结构化元数据（metadata）”
 *
 * 说明：
 * - entities：仅包含符号名（字符串），用于索引与混合检索的轻量特征
 * - metadata：包含符号类型、是否导出、片段范围等结构化信息，便于后续做更精细的过滤/展示
 */
export declare function extractCodeEntitiesAndMetadata(code: string, language?: string): Promise<{
    entities: string[];
    metadata: ExtractedCodeMetadata;
}>;
/**
 * 从查询文本中提取实体关键词
 * 用于混合检索的实体过滤
 */
export declare function extractEntitiesFromQuery(query: string): string[];
/**
 * 混合检索：向量相似度 + 实体精确匹配
 * 返回重新排序的结果
 */
export interface HybridSearchResult {
    record: any;
    vector_score: number;
    entity_match_count: number;
    final_score: number;
}
export declare function hybridSearch(vectorResults: any[], queryEntities: string[]): HybridSearchResult[];
//# sourceMappingURL=utils.d.ts.map