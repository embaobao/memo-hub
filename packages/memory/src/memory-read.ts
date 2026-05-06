import type { MemoryObject } from "@memohub/protocol";
import type { UnifiedMemoryRuntime } from "./unified-memory-runtime.js";

export interface MemoryOverviewEntry {
  actorId: string;
  count: number;
  latestUpdatedAt: string;
  latestText: string;
  projectId?: string;
}

export interface HermesPrefetchSummary {
  channel: {
    channelId: string;
    actorId: string;
    source: string;
    projectId: string;
    purpose: string;
    sessionId?: string;
  };
  actorSummary: string[];
  projectSummary: string[];
  globalHints: string[];
  conflictsOrGaps: string[];
  nextActions: string[];
}

export function buildMemoryOverview(memories: MemoryObject[], limit = 20): MemoryOverviewEntry[] {
  const grouped = new Map<string, MemoryObject[]>();
  for (const memory of memories) {
    const actorId = memory.actor?.id ?? memory.source.id;
    const current = grouped.get(actorId) ?? [];
    current.push(memory);
    grouped.set(actorId, current);
  }

  return Array.from(grouped.entries())
    .map(([actorId, items]) => {
      const latest = items.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0];
      return {
        actorId,
        count: items.length,
        latestUpdatedAt: latest.updatedAt,
        latestText: previewText(latest.content?.[0]?.text ?? ""),
        projectId: latest.subject?.id,
      };
    })
    .sort((left, right) => right.latestUpdatedAt.localeCompare(left.latestUpdatedAt))
    .slice(0, limit);
}

export async function prefetchHermesMemory(
  runtime: UnifiedMemoryRuntime,
  input: {
    actorId: string;
    projectId: string;
    channel: {
      channelId: string;
      actorId: string;
      source: string;
      projectId: string;
      purpose: string;
      sessionId?: string;
    };
    limit?: number;
  },
): Promise<HermesPrefetchSummary> {
  const limit = input.limit ?? 5;
  const [profileView, recentView, projectView, globalMemories] = await Promise.all([
    runtime.queryView({
      view: "agent_profile",
      actorId: input.actorId,
      projectId: input.projectId,
      query: "preferences habits memory profile",
      limit,
    }),
    runtime.queryView({
      view: "recent_activity",
      actorId: input.actorId,
      projectId: input.projectId,
      query: "recent activity current work",
      limit,
    }),
    runtime.queryView({
      view: "project_context",
      actorId: input.actorId,
      projectId: input.projectId,
      query: "project facts architecture conventions",
      limit,
    }),
    runtime.listMemories({
      perspective: "global",
      limit,
    }),
  ]);

  const actorSummary = [
    ...profileView.selfContext.map((item) => previewText(item.object.content?.[0]?.text ?? "")),
    ...recentView.selfContext.map((item) => previewText(item.object.content?.[0]?.text ?? "")),
  ].filter(Boolean).slice(0, limit);

  const projectSummary = projectView.projectContext
    .map((item) => previewText(item.object.content?.[0]?.text ?? ""))
    .filter(Boolean)
    .slice(0, limit);

  const globalHints = globalMemories
    .map((memory) => previewText(memory.content?.[0]?.text ?? ""))
    .filter(Boolean)
    .slice(0, Math.min(limit, 3));

  const conflictsOrGaps = [
    ...(profileView.conflictsOrGaps ?? []).map((item: any) => item.message ?? String(item)),
    ...(recentView.conflictsOrGaps ?? []).map((item: any) => item.message ?? String(item)),
    ...(projectView.conflictsOrGaps ?? []).map((item: any) => item.message ?? String(item)),
  ];

  const nextActions = [
    "Use sync_turn to capture durable preferences, activity, project facts, and clarifications.",
    "Use logs query or memohub_logs_query when current behavior does not match recalled memory.",
  ];

  return {
    channel: input.channel,
    actorSummary,
    projectSummary,
    globalHints,
    conflictsOrGaps,
    nextActions,
  };
}

function previewText(value: string, max = 120): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 3)}...`;
}
