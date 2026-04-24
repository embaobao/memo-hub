import * as fs from "node:fs/promises";
import type { MemoEngine } from "../pipeline/engine.js";
import type { MemoRecord } from "../types/index.js";
import { distillSessionTextToFacts } from "./distill.js";

export interface RunLibrarianSessionOptions {
  /**
   * 输入文本（与 inputFile 二选一）
   */
  inputText?: string;

  /**
   * 输入文件路径（与 inputText 二选一）
   */
  inputFile?: string;

  /**
   * GBrain 分类（默认 memory）
   */
  category?: string;

  /**
   * 额外标签
   */
  tags?: string[];

  /**
   * 会话 ID（用于 tags 与可追溯信息）
   */
  sessionId?: string;

  /**
   * 最多输出多少条事实
   */
  maxFacts?: number;
}

export interface RunLibrarianSessionResult {
  facts: string[];
  records: MemoRecord[];
}

/**
 * runLibrarianSession：对话/日志蒸馏后写入 GBrain（占位可运行实现）
 *
 * 约束：
 * - 先不引入任何外部 AI 依赖，避免破坏现有脚本/插件。
 * - 以“短句事实列表”为写入单位，便于后续检索与治理。
 */
export async function runLibrarianSession(
  engine: MemoEngine,
  options: RunLibrarianSessionOptions = {}
): Promise<RunLibrarianSessionResult> {
  const {
    inputText,
    inputFile,
    category = "memory",
    tags = [],
    sessionId,
    maxFacts = 12,
  } = options ?? {};

  const resolvedInputText =
    typeof inputText === "string" && String(inputText ?? "").trim() !== ""
      ? String(inputText)
      : typeof inputFile === "string" && String(inputFile ?? "").trim() !== ""
        ? await fs.readFile(String(inputFile), "utf-8")
        : "";

  const facts = distillSessionTextToFacts(resolvedInputText, { maxFacts });

  const resolvedSessionId =
    typeof sessionId === "string" && String(sessionId ?? "").trim() !== ""
      ? String(sessionId).trim()
      : undefined;

  const mergedTags = [
    "librarian",
    ...(resolvedSessionId ? [`session:${resolvedSessionId}`] : []),
    ...(Array.isArray(tags) ? tags : []),
  ].filter((t) => typeof t === "string" && t.trim() !== "");

  const records: MemoRecord[] = [];
  for (const fact of facts) {
    const text = String(fact ?? "").trim();
    if (!text) {
      continue;
    }

    const record = await engine.ingest({
      text,
      track: "gbrain",
      context: {
        source: "librarian_session",
        ...(resolvedSessionId ? { sessionId: resolvedSessionId } : {}),
      },
      metadata: {
        category,
        tags: mergedTags,
      },
    });

    records.push(record);
  }

  return { facts, records };
}

