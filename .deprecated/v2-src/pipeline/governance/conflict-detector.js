import { randomUUID } from "node:crypto";
/**
 * 最小冲突检测器（纯函数）
 *
 * 输入约定：
 * - anchor：触发检测的锚点记录（通常是待写入的新内容）
 * - candidates：可能与之冲突的候选记录（通常来自检索/已有库）
 *
 * 输出约定：
 * - 无冲突：返回 null
 * - 有冲突：返回 CONFLICT_PENDING 事件（包含候选与解释信息）
 */
export function detectConflicts(options) {
    const { anchor, candidates = [], context, config } = options ?? {};
    const { enabled = true, threshold = 0.9, strategy = "jaccard", min_text_length = 12, max_candidates = 5, } = config ?? {};
    if (!enabled) {
        return null;
    }
    const anchorText = normalizeText(anchor?.text);
    if (!anchorText || anchorText.length < Math.max(0, min_text_length)) {
        return null;
    }
    const scored = [];
    for (const candidate of candidates ?? []) {
        const candidateText = normalizeText(candidate?.text);
        if (!candidateText) {
            continue;
        }
        const score = strategy === "contains"
            ? containsSimilarity(anchorText, candidateText)
            : jaccardSimilarity(anchorText, candidateText);
        if (score >= threshold) {
            scored.push({
                record: candidate,
                score,
                reason: buildReason(strategy, score, threshold),
            });
        }
    }
    if (scored.length === 0) {
        return null;
    }
    const top = scored.sort((a, b) => b.score - a.score).slice(0, Math.max(1, max_candidates));
    return {
        name: "CONFLICT_PENDING",
        id: `conflict-${randomUUID()}`,
        timestamp: new Date().toISOString(),
        anchor,
        candidates: top,
        threshold,
        strategy,
        context,
    };
}
function buildReason(strategy, score, threshold) {
    const p = Number.isFinite(score) ? score.toFixed(3) : String(score);
    const t = Number.isFinite(threshold) ? threshold.toFixed(3) : String(threshold);
    if (strategy === "contains") {
        return `contains 命中：相似度=${p} ≥ 阈值=${t}`;
    }
    return `jaccard 命中：相似度=${p} ≥ 阈值=${t}`;
}
/**
 * 归一化文本：用于相似度计算（不改变原始入库内容）
 */
function normalizeText(input) {
    const raw = typeof input === "string" ? input : "";
    return raw.replace(/\s+/g, " ").trim().toLowerCase();
}
/**
 * contains 策略：互相包含则视为高相似
 *
 * 规则：
 * - a 包含 b：score = |b| / |a|
 * - b 包含 a：score = |a| / |b|
 * - 否则 score=0
 */
function containsSimilarity(a, b) {
    if (!a || !b) {
        return 0;
    }
    if (a.includes(b)) {
        return b.length / a.length;
    }
    if (b.includes(a)) {
        return a.length / b.length;
    }
    return 0;
}
/**
 * Jaccard 相似度：|A ∩ B| / |A ∪ B|
 *
 * 说明：
 * - token 化规则刻意轻量：按非字母数字分割 + 过滤过短 token
 * - 该规则不是 NLP，目标是“先有最小可用闭环”，后续可替换为向量/编辑距离等策略
 */
function jaccardSimilarity(a, b) {
    const aTokens = tokenize(a);
    const bTokens = tokenize(b);
    if (aTokens.size === 0 || bTokens.size === 0) {
        return 0;
    }
    let intersection = 0;
    for (const t of aTokens) {
        if (bTokens.has(t)) {
            intersection += 1;
        }
    }
    const union = aTokens.size + bTokens.size - intersection;
    if (union <= 0) {
        return 0;
    }
    return intersection / union;
}
function tokenize(text) {
    const parts = text
        .split(/[^a-z0-9_]+/i)
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)
        .filter((s) => s.length >= 2);
    return new Set(parts);
}
//# sourceMappingURL=conflict-detector.js.map