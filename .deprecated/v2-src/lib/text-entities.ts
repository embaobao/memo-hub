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

export const DEFAULT_TEXT_ENTITY_EXTRACTOR_OPTIONS: Required<
  Pick<
    TextEntityExtractorOptions,
    | "enabled"
    | "maxEntities"
    | "includeCamelCase"
    | "includeDottedIdentifier"
    | "includeVersion"
    | "includeAcronym"
    | "minLength"
    | "maxLength"
  >
> = {
  enabled: true,
  maxEntities: 24,
  includeCamelCase: true,
  includeDottedIdentifier: true,
  includeVersion: true,
  includeAcronym: true,
  minLength: 2,
  maxLength: 64,
};

type MatchedToken = {
  token: string;
  index: number;
};

function clampMaxEntities(value: unknown, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) {
    return fallback;
  }
  const int = Math.floor(n);
  if (int <= 0) {
    return 0;
  }
  return Math.min(int, 256);
}

function isTokenLengthValid(token: string, minLength: number, maxLength: number): boolean {
  const len = token.length;
  return len >= minLength && len <= maxLength;
}

function pushMatches(
  bag: MatchedToken[],
  source: string,
  regex: RegExp,
  minLength: number,
  maxLength: number,
  shouldKeep?: (payload: { token: string; index: number; source: string }) => boolean
) {
  regex.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(source)) !== null) {
    const raw = String(match[1] ?? match[0] ?? "").trim();
    const index = typeof match.index === "number" ? match.index : 0;
    if (!raw) {
      continue;
    }
    if (!isTokenLengthValid(raw, minLength, maxLength)) {
      continue;
    }
    if (shouldKeep && !shouldKeep({ token: raw, index, source })) {
      continue;
    }
    bag.push({ token: raw, index });
  }
}

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
export function extractEntitiesFromText(
  text: string,
  options: TextEntityExtractorOptions = {}
): string[] {
  const source = String(text ?? "");

  const enabled = options.enabled ?? DEFAULT_TEXT_ENTITY_EXTRACTOR_OPTIONS.enabled;
  if (!enabled) {
    return [];
  }

  const maxEntities = clampMaxEntities(
    options.maxEntities,
    DEFAULT_TEXT_ENTITY_EXTRACTOR_OPTIONS.maxEntities
  );
  if (maxEntities === 0) {
    return [];
  }

  const includeCamelCase =
    options.includeCamelCase ?? DEFAULT_TEXT_ENTITY_EXTRACTOR_OPTIONS.includeCamelCase;
  const includeDottedIdentifier =
    options.includeDottedIdentifier ??
    DEFAULT_TEXT_ENTITY_EXTRACTOR_OPTIONS.includeDottedIdentifier;
  const includeVersion = options.includeVersion ?? DEFAULT_TEXT_ENTITY_EXTRACTOR_OPTIONS.includeVersion;
  const includeAcronym = options.includeAcronym ?? DEFAULT_TEXT_ENTITY_EXTRACTOR_OPTIONS.includeAcronym;

  const minLength = clampMaxEntities(
    options.minLength,
    DEFAULT_TEXT_ENTITY_EXTRACTOR_OPTIONS.minLength
  );
  const maxLengthRaw = clampMaxEntities(
    options.maxLength,
    DEFAULT_TEXT_ENTITY_EXTRACTOR_OPTIONS.maxLength
  );
  const maxLength = Math.max(maxLengthRaw, minLength);

  const matched: MatchedToken[] = [];

  if (includeDottedIdentifier) {
    /**
     * 带点标识符：
     * - a.b / a.b.c
     * - config.embedding.url
     *
     * 说明：
     * - 允许下划线与中划线，尽量覆盖 package/config 的真实命名
     * - 不支持 URL（含 ://）——这类 token 噪声更大，且通常不作为实体纽带
     */
    const dottedRegex = /\b([A-Za-z_][A-Za-z0-9_-]*(?:\.[A-Za-z_][A-Za-z0-9_-]*)+)\b/g;
    pushMatches(matched, source, dottedRegex, minLength, maxLength, ({ index, source }) => {
      /**
       * 过滤 URL 场景（例如 http://a.b.com）：
       * - URL 的 host 部分看起来也像“带点标识符”，但作为实体纽带价值较低、噪声较高
       */
      const prefix3 = source.slice(Math.max(0, index - 3), index);
      const prefix2 = source.slice(Math.max(0, index - 2), index);
      return prefix3 !== "://" && prefix2 !== "//";
    });
  }

  if (includeVersion) {
    /**
     * 版本号（语义化版本为主）：
     * - 1.2.3
     * - v1.2.3
     * - 1.2.0-beta.1 / v2.0.0+build.7
     *
     * 说明：
     * - 这里不追求 100% 严格 semver 校验，只要“像版本号”即可
     * - 避免只匹配单个数字，降低误报（比如年份、序号）
     */
    const semverRegex =
      /\b(v?\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?)\b/g;
    const looseVersionRegex = /\b(v?\d+\.\d+(?:\.\d+){0,2})\b/g;
    pushMatches(matched, source, semverRegex, minLength, maxLength);
    pushMatches(matched, source, looseVersionRegex, minLength, maxLength);
  }

  if (includeAcronym) {
    /**
     * 缩写：
     * - MCP / CLI / API / HTTP2
     *
     * 说明：
     * - 仅匹配 2 位及以上全大写，降低把单个大写字母当实体的概率
     * - 可带少量数字（如 HTTP2）
     */
    const acronymRegex = /\b([A-Z]{2,}[0-9]{0,3})\b/g;
    pushMatches(matched, source, acronymRegex, minLength, maxLength);
  }

  if (includeCamelCase) {
    /**
     * 驼峰词：
     * - lowerCamelCase：memoHub / addKnowledge
     * - PascalCase：MemoHub / GBrainTrackProvider
     *
     * 说明：
     * - lowerCamelCase：以小写开头，包含至少一个大写分隔
     * - PascalCase：以大写开头，至少包含两个“单词片段”（避免把普通首字母大写英文当实体）
     */
    const lowerCamelRegex = /\b([a-z]+[A-Z][A-Za-z0-9]*)\b/g;
    const pascalRegex = /\b([A-Z][A-Za-z0-9]*(?:[A-Z][a-z0-9]+)+)\b/g;
    pushMatches(matched, source, lowerCamelRegex, minLength, maxLength);
    pushMatches(matched, source, pascalRegex, minLength, maxLength);
  }

  /**
   * 去重与排序：
   * - 先按出现位置排序，保证输出稳定
   * - 再按“首次出现”去重
   */
  matched.sort((a, b) => a.index - b.index);

  const seen = new Set<string>();
  const entities: string[] = [];

  for (const item of matched) {
    const token = item.token;
    if (seen.has(token)) {
      continue;
    }
    seen.add(token);
    entities.push(token);
    if (entities.length >= maxEntities) {
      break;
    }
  }

  return entities;
}
