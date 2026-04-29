import { describe, expect, it } from "bun:test";
import {
  ClarificationItemSchema,
  DEFAULT_DOMAIN_POLICIES,
  MemoryArtifactSchema,
  createClarificationItem,
  createMemoryArtifact,
  getDomainPolicy,
  resolveClarificationItem,
} from "../../src/governance.ts";

describe("governance model", () => {
  it("maps first phase domains to transition executors", () => {
    expect(DEFAULT_DOMAIN_POLICIES["code-intelligence"].transitionTrack).toBe("track-source");
    expect(DEFAULT_DOMAIN_POLICIES["project-knowledge"].transitionTrack).toBe("track-insight");
    expect(DEFAULT_DOMAIN_POLICIES["task-session"].transitionTrack).toBe("track-stream");
    expect(DEFAULT_DOMAIN_POLICIES["habit-convention"].transitionTrack).toBe("track-wiki");
  });

  it("keeps unknown domains extensible through default policy", () => {
    expect(getDomainPolicy("meeting-summary")).toMatchObject({
      domain: "meeting-summary",
      transitionTrack: "track-insight",
    });
  });

  it("creates clarification items for conflicting evidence", () => {
    const item = createClarificationItem({
      id: "clarify-1",
      question: "Which repository convention is current?",
      reason: "conflict",
      memoryIds: ["mem-a", "mem-b"],
      source: { type: "agent", id: "hermes" },
      now: "2026-04-29T00:00:00.000Z",
    });

    expect(ClarificationItemSchema.safeParse(item).success).toBe(true);
    expect(item.status).toBe("open");
    expect(item.memoryIds).toEqual(["mem-a", "mem-b"]);
  });

  it("resolves clarification items with answer metadata", () => {
    const item = createClarificationItem({
      id: "clarify-2",
      question: "Which architecture is current?",
      reason: "conflict",
      memoryIds: ["mem-1"],
      now: "2026-04-29T00:00:00.000Z",
    });

    const resolved = resolveClarificationItem(item, {
      text: "Use the unified memory runtime.",
      resolvedBy: "hermes",
      now: "2026-04-29T01:00:00.000Z",
    });

    expect(resolved.status).toBe("resolved");
    expect(resolved.resolution?.resolvedBy).toBe("hermes");
    expect(resolved.updatedAt).toBe("2026-04-29T01:00:00.000Z");
  });

  it("creates artifact records for snapshots and wiki exports", () => {
    const artifact = createMemoryArtifact({
      id: "artifact-1",
      kind: "wiki_export",
      source: { type: "agent", id: "codex" },
      memoryIds: ["mem-a"],
      uri: "memohub://exports/wiki/artifact-1",
      now: "2026-04-29T00:00:00.000Z",
    });

    expect(MemoryArtifactSchema.safeParse(artifact).success).toBe(true);
    expect(artifact.kind).toBe("wiki_export");
  });
});
