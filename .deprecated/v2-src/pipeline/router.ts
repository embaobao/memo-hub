import type { MemoContext, MemoIngestRequest, RoutingConfig, RoutingRuleConfig } from "../types/index.js";

export interface RouteDecision {
  /**
   * 最终路由到的轨道（如：gbrain / clawmem）
   */
  track: string;

  /**
   * 命中规则名称（便于观测与回放）
   */
  rule: string;

  /**
   * 规则命中原因（尽量简短、可读）
   */
  reason: string;
}

export interface RoutingRule {
  /**
   * 规则名称（稳定标识，用于观测与排查）
   */
  name: string;

  /**
   * 尝试基于请求/上下文做路由决策：
   * - 返回 RouteDecision：表示命中并给出最终 track
   * - 返回 null：表示未命中，交给下一条规则继续判断（责任链）
   */
  decide: (request: MemoIngestRequest, context?: MemoContext) => RouteDecision | null;
}

function normalizeSuffixList(suffixes: string[]): string[] {
  const normalized = suffixes
    .map((s) => String(s ?? "").trim().toLowerCase())
    .filter((s) => s !== "");

  const deduped: string[] = [];
  const seen = new Set<string>();
  for (const s of normalized) {
    if (seen.has(s)) {
      continue;
    }
    seen.add(s);
    deduped.push(s);
  }
  return deduped;
}

function getFileSuffix(filePath: string): string | undefined {
  const normalized = String(filePath ?? "").trim().toLowerCase();
  if (!normalized) {
    return undefined;
  }
  const lastDot = normalized.lastIndexOf(".");
  if (lastDot < 0) {
    return undefined;
  }
  return normalized.slice(lastDot);
}

export class RoutingEngine {
  private rules: RoutingRule[];

  constructor(rules: RoutingRule[]) {
    this.rules = rules;
  }

  /**
   * 执行责任链，返回最终路由结果
   *
   * 约定：
   * - 一旦某条规则返回 decision，即停止向下传递
   * - 若所有规则都不命中，则回退到 gbrain（保证兼容性，不让写入链路中断）
   */
  route(request: MemoIngestRequest, context?: MemoContext): RouteDecision {
    for (const rule of this.rules) {
      const decision = rule.decide(request, context);
      if (decision) {
        return decision;
      }
    }
    return {
      track: "gbrain",
      rule: "fallback",
      reason: "无规则命中，回退到默认轨道",
    };
  }
}

function createFileSuffixRule(options: {
  name: string;
  track: string;
  suffixes: string[];
}): RoutingRule {
  const { name, track, suffixes } = options;
  const normalizedSuffixes = normalizeSuffixList(suffixes);

  return {
    name,
    decide: (request, context) => {
      const ctx = (request?.context ?? context) as MemoContext | undefined;
      const filePath = typeof ctx?.filePath === "string" ? ctx.filePath : undefined;
      if (!filePath) {
        return null;
      }

      const suffix = getFileSuffix(filePath);
      if (!suffix) {
        return null;
      }

      if (!normalizedSuffixes.some((s) => suffix === s)) {
        return null;
      }

      return {
        track,
        rule: name,
        reason: `filePath 后缀命中：${suffix}`,
      };
    },
  };
}

function createDefaultRule(options: { name: string; track: string }): RoutingRule {
  const { name, track } = options;
  return {
    name,
    decide: () => ({
      track,
      rule: name,
      reason: "默认兜底规则",
    }),
  };
}

function normalizeRuleConfigs(configs: RoutingRuleConfig[]): RoutingRuleConfig[] {
  const safe = Array.isArray(configs) ? configs : [];
  return safe.filter((r): r is RoutingRuleConfig => {
    if (!r || typeof r !== "object") {
      return false;
    }
    const type = (r as { type?: unknown }).type;
    return type === "file_suffix" || type === "default";
  });
}

/**
 * 基于配置创建路由引擎
 *
 * 优先级说明：
 * - 调用方（ConfigManager）负责把“环境变量 > YAML > 默认值”的最终配置产出
 * - 本方法仅把最终 routing 配置编译为可执行的责任链规则列表
 */
export function createRoutingEngine(routing?: RoutingConfig): RoutingEngine {
  const enabled = typeof routing?.enabled === "boolean" ? routing.enabled : true;
  if (!enabled) {
    return new RoutingEngine([
      createDefaultRule({ name: "routing_disabled_fallback", track: "gbrain" }),
    ]);
  }

  const defaultTrack =
    typeof routing?.default_track === "string" && routing.default_track.trim() !== ""
      ? routing.default_track.trim()
      : "gbrain";

  const defaultCodeSuffixes =
    Array.isArray(routing?.code_suffixes) && routing.code_suffixes.length > 0
      ? routing.code_suffixes
      : [
          ".ts",
          ".tsx",
          ".js",
          ".jsx",
          ".mjs",
          ".cjs",
          ".json",
          ".md",
          ".py",
          ".go",
          ".rs",
          ".java",
          ".kt",
          ".swift",
          ".c",
          ".cc",
          ".cpp",
          ".h",
          ".hpp",
          ".cs",
          ".php",
          ".rb",
          ".lua",
          ".sql",
          ".sh",
          ".zsh",
          ".yml",
          ".yaml",
          ".toml",
        ];

  const rulesFromConfig = Array.isArray(routing?.rules) ? normalizeRuleConfigs(routing.rules) : undefined;

  const rules: RoutingRule[] = [];

  /**
   * 规则覆盖策略：
   * - 若用户显式提供 routing.rules，则认为是“全量覆盖”（引擎严格按其顺序执行）
   * - 若未提供 rules，则使用默认规则：file_suffix → default
   */
  if (rulesFromConfig && rulesFromConfig.length > 0) {
    for (const ruleConfig of rulesFromConfig) {
      if (ruleConfig.type === "file_suffix") {
        const suffixes = Array.isArray(ruleConfig.suffixes) ? ruleConfig.suffixes : [];
        rules.push(
          createFileSuffixRule({
            name:
              typeof ruleConfig.name === "string" && ruleConfig.name.trim() !== ""
                ? ruleConfig.name.trim()
                : "file_suffix",
            track:
              typeof ruleConfig.track === "string" && ruleConfig.track.trim() !== ""
                ? ruleConfig.track.trim()
                : "clawmem",
            suffixes,
          })
        );
      } else if (ruleConfig.type === "default") {
        rules.push(
          createDefaultRule({
            name:
              typeof ruleConfig.name === "string" && ruleConfig.name.trim() !== ""
                ? ruleConfig.name.trim()
                : "default",
            track:
              typeof ruleConfig.track === "string" && ruleConfig.track.trim() !== ""
                ? ruleConfig.track.trim()
                : defaultTrack,
          })
        );
      }
    }
  } else {
    rules.push(
      createFileSuffixRule({
        name: "default_file_suffix",
        track: "clawmem",
        suffixes: defaultCodeSuffixes,
      })
    );
    rules.push(createDefaultRule({ name: "default_fallback", track: defaultTrack }));
  }

  /**
   * 兼容性兜底：
   * - 用户 rules 未包含 default 规则时，补一个默认兜底，避免“全链不命中”导致返回空 track
   */
  const hasDefault = rules.some((r) => r.name === "default" || r.name === "default_fallback");
  if (!hasDefault) {
    rules.push(createDefaultRule({ name: "auto_fallback", track: defaultTrack }));
  }

  return new RoutingEngine(rules);
}

