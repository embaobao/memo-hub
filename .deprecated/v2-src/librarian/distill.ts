/**
 * distillSessionTextToFacts：把“对话/日志”蒸馏为可写入的原子事实（占位实现）
 *
 * 重要说明：
 * - 这里先提供“可运行、可解释、可控”的最小实现，满足 Task9 的骨架要求。
 * - 未来若接入 LLM/规则库，应保持输出为“短句事实列表”，以便写入 GBrain 时更利于检索与复用。
 */
export function distillSessionTextToFacts(
  rawText: string,
  options: { maxFacts?: number } = {}
): string[] {
  const { maxFacts = 12 } = options ?? {};

  const text = String(rawText ?? "").trim();
  if (!text) {
    return [];
  }

  /**
   * 预处理（轻量）：
   * - 去掉明显的时间戳前缀（避免把日志噪声当作“事实实体”）
   * - 合并多余空行
   */
  const normalizedLines = text
    .split("\n")
    .map((line) => line.trimEnd())
    .map((line) => line.replace(/^\[?\d{4}-\d{2}-\d{2}.*?\]?\s*/, ""))
    .map((line) => line.replace(/^\d{2}:\d{2}:\d{2}\s*/, ""))
    .map((line) => line.trim())
    .filter(Boolean);

  if (normalizedLines.length === 0) {
    return [];
  }

  /**
   * 规则优先级（从强到弱）：
   * 1) 显式结论/决定/规则
   * 2) TODO/FIXME/行动项
   * 3) 列表项（- / * / 1.）
   * 4) 兜底：取若干行作为短事实
   */
  const strongPrefixes = ["结论", "决定", "规则", "原则", "约定", "注意", "风险", "原因", "方案"];
  const actionPrefixes = ["TODO", "FIXME", "Action", "行动项", "待办"];

  const strong: string[] = [];
  const actions: string[] = [];
  const bullets: string[] = [];
  const fallback: string[] = [];

  for (const line of normalizedLines) {
    const compact = line.replace(/\s+/g, " ").trim();
    if (!compact) {
      continue;
    }

    const isStrong = strongPrefixes.some(
      (p) => compact.startsWith(`${p}:`) || compact.startsWith(`${p}：`)
    );
    if (isStrong) {
      strong.push(compact);
      continue;
    }

    const upper = compact.toUpperCase();
    const isAction =
      actionPrefixes.some((p) => upper.startsWith(`${p}:`) || upper.startsWith(`${p}：`)) ||
      /\bTODO\b|\bFIXME\b/i.test(compact);
    if (isAction) {
      actions.push(compact);
      continue;
    }

    const isBullet = /^([-*]|\d+\.)\s+/.test(compact);
    if (isBullet) {
      bullets.push(compact.replace(/^([-*]|\d+\.)\s+/, "").trim());
      continue;
    }

    fallback.push(compact);
  }

  const merged = [
    ...dedupeByValue(strong),
    ...dedupeByValue(actions),
    ...dedupeByValue(bullets),
  ];

  /**
   * 兜底策略：
   * - 如果强规则/行动项/列表项都没有，就取前几行作为“短事实”
   * - 这样保证“最小可用”，不会因为输入格式不规范而完全没有产物
   */
  if (merged.length === 0) {
    merged.push(...dedupeByValue(fallback));
  }

  return merged
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, Math.max(1, Number(maxFacts) || 1));
}

function dedupeByValue(items: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of items ?? []) {
    const key = String(item ?? "").trim();
    if (!key) {
      continue;
    }
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(key);
  }
  return result;
}

