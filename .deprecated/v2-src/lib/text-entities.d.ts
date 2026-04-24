/**
 * 通用文本实体抽取器（用于 GBrain 写入时填充 entities）
 *
 * 设计目标：
 * 1) 轻量：仅做“可解释的正则抽取”，不引入重依赖，不做 NLP 分词
 * 2) 可控：支持按开关启用/关闭某类实体，并限制最大实体数量，避免噪声爆炸
 * 3) 稳定：保持“按出现顺序输出 + 去重”，保证同一文本多次写入结果一致
 *
 * 注意：
 * - entities 的用途是“实体纽带”（跨轨检索加权/过滤），不是精准命名实体识别
 * - 因此这里更偏向抽取工程语料中的“标识符/版本号/缩写”等可复用 token
 */
export interface TextEntityExtractorOptions {
    /**
     * 是否启用实体抽取
     *
     * 说明：
     * - false：直接返回空数组（用于在某些场景关闭增强能力）
     * - true / undefined：按其它选项抽取
     */
    enabled?: boolean;
    /**
     * 最大实体数量（超过会截断）
     *
     * 说明：
     * - 该限制是“写入侧保护阀”，避免长文/日志把 entities 填满导致无意义的噪声与索引膨胀
     */
    maxEntities?: number;
    /**
     * 是否抽取驼峰词（camelCase / PascalCase）
     */
    includeCamelCase?: boolean;
    /**
     * 是否抽取带点标识符（a.b / config.embedding.url）
     */
    includeDottedIdentifier?: boolean;
    /**
     * 是否抽取版本号（v1.2.3 / 1.2.0-beta.1 等）
     */
    includeVersion?: boolean;
    /**
     * 是否抽取缩写（API / MCP / HTTP2 等）
     */
    includeAcronym?: boolean;
    /**
     * 最短 token 长度（过短的 token 往往噪声更大）
     */
    minLength?: number;
    /**
     * 最长 token 长度（避免把超长 hash/url 误认为实体）
     */
    maxLength?: number;
}
export declare const DEFAULT_TEXT_ENTITY_EXTRACTOR_OPTIONS: Required<Pick<TextEntityExtractorOptions, "enabled" | "maxEntities" | "includeCamelCase" | "includeDottedIdentifier" | "includeVersion" | "includeAcronym" | "minLength" | "maxLength">>;
/**
 * 从纯文本中抽取通用实体 token
 *
 * 覆盖的实体类型：
 * - 驼峰词：lowerCamelCase / PascalCase（工程标识符高频）
 * - 带点标识符：a.b / a.b.c（配置项/包名/模块路径常见）
 * - 版本号：v1.2.3 / 1.2.0-beta.1（依赖版本/协议版本常见）
 * - 缩写：API / MCP / HTTP2（工程术语常见）
 *
 * 返回：
 * - 去重后的 token 数组（按出现顺序）
 */
export declare function extractEntitiesFromText(text: string, options?: TextEntityExtractorOptions): string[];
//# sourceMappingURL=text-entities.d.ts.map