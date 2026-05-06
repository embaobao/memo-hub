import { EventConfidence, EventSource, type MemoHubEvent } from "@memohub/protocol";
import { buildMemoryEvent, type MemoryIngestRequest } from "./memory-interface.js";

export type HermesMemoryCategory = "preference" | "habit" | "activity" | "project_fact" | "clarification";

export interface HermesMemoryWriteRequest {
  text: string;
  actorId?: string;
  source?: EventSource;
  channelId: string;
  projectId: string;
  sessionId?: string;
  taskId?: string;
  category: HermesMemoryCategory;
  confidence?: EventConfidence;
  metadata?: Record<string, unknown>;
}

export interface HermesMemoryCandidate extends HermesMemoryWriteRequest {
  evidence: string;
}

const CATEGORY_TO_DOMAIN_HINT: Record<HermesMemoryCategory, string> = {
  preference: "preference",
  habit: "habit",
  activity: "activity",
  project_fact: "project-fact",
  clarification: "clarification",
};

const PREFERENCE_PATTERNS = [/偏好/u, /习惯/u, /默认/u, /以后都/u, /\bprefer\b/iu, /\balways\b/iu];
const ACTIVITY_PATTERNS = [/正在做/u, /刚完成/u, /接下来/u, /阻塞/u, /\bworking on\b/iu, /\bnext\b/iu];
const FACT_PATTERNS = [/项目约定/u, /架构决定/u, /事实是/u, /以.+为准/u, /\bdecision\b/iu, /\bproject fact\b/iu];
const CLARIFICATION_PATTERNS = [/纠正/u, /澄清/u, /不是/u, /应该是/u, /\bclarif/i, /\binstead\b/iu];

/**
 * 统一把 Hermes 高层记忆类别映射为当前事件写入口能理解的 category 提示。
 */
export function buildHermesMemoryEvent(request: HermesMemoryWriteRequest): MemoHubEvent {
  const metadata = {
    actorId: request.actorId ?? "hermes",
    connector: "hermes",
    memoryCategory: request.category,
    ...(request.metadata ?? {}),
  };

  return buildMemoryEvent({
    text: request.text,
    source: request.source ?? EventSource.HERMES,
    channel: request.channelId,
    projectId: request.projectId,
    confidence: request.confidence ?? EventConfidence.REPORTED,
    sessionId: request.sessionId,
    taskId: request.taskId,
    category: CATEGORY_TO_DOMAIN_HINT[request.category],
    metadata,
  } satisfies MemoryIngestRequest);
}

/**
 * 第一阶段使用确定性规则提取高价值长期记忆候选，避免强依赖额外模型服务。
 */
export function extractHermesMemoryCandidates(input: {
  userMessage?: string;
  assistantMessage?: string;
  projectId: string;
  channelId: string;
  sessionId?: string;
  taskId?: string;
  metadata?: Record<string, unknown>;
}): HermesMemoryCandidate[] {
  const messages = [input.userMessage, input.assistantMessage]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0);
  const candidates: HermesMemoryCandidate[] = [];

  for (const message of messages) {
    const lines = splitCandidates(message);
    for (const line of lines) {
      const categories = detectCategories(line);
      for (const category of categories) {
        candidates.push({
          text: line,
          evidence: line,
          category,
          projectId: input.projectId,
          channelId: input.channelId,
          sessionId: input.sessionId,
          taskId: input.taskId,
          metadata: input.metadata,
        });
      }
    }
  }

  return dedupeCandidates(candidates);
}

function splitCandidates(text: string): string[] {
  return text
    .split(/[\n。！？!?]+/u)
    .map((item) => item.trim())
    .filter((item) => item.length >= 6);
}

function detectCategories(text: string): HermesMemoryCategory[] {
  const categories: HermesMemoryCategory[] = [];

  if (CLARIFICATION_PATTERNS.some((pattern) => pattern.test(text))) categories.push("clarification");
  if (PREFERENCE_PATTERNS.some((pattern) => pattern.test(text))) {
    categories.push(/习惯/u.test(text) ? "habit" : "preference");
  }
  if (ACTIVITY_PATTERNS.some((pattern) => pattern.test(text))) categories.push("activity");
  if (FACT_PATTERNS.some((pattern) => pattern.test(text))) categories.push("project_fact");

  return categories;
}

function dedupeCandidates(candidates: HermesMemoryCandidate[]): HermesMemoryCandidate[] {
  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    const key = `${candidate.category}:${candidate.text.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
