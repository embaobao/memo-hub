import { describe, expect, it } from "bun:test";
import { MemoryObject } from "@memohub/protocol";
import {
  createVectorRecordsFromMemoryObject,
  domainToTransitionTrack,
  InMemoryStructuredIndex,
} from "../../src/memory-projection.ts";

const memory: MemoryObject = {
  id: "mem-1",
  kind: "evidence",
  source: { type: "agent", id: "hermes" },
  actor: { type: "agent", id: "hermes" },
  subject: { type: "project", id: "memo-hub" },
  scopes: [
    { type: "agent", id: "hermes" },
    { type: "project", id: "memo-hub" },
  ],
  visibility: "shared",
  domains: [{ type: "code-intelligence", subtype: "file" }],
  state: "raw",
  content: [
    { type: "code", text: "export const x = 1;", hash: "hash-1" },
    { type: "json", data: { ignored: true } },
  ],
  links: [{ type: "relates_to", targetId: "file-src-index" }],
  provenance: { ingestedAt: "2026-04-29T00:00:00.000Z", sourceEventId: "evt-1" },
  tags: ["code"],
  createdAt: "2026-04-29T00:00:00.000Z",
  updatedAt: "2026-04-29T00:00:00.000Z",
};

describe("createVectorRecordsFromMemoryObject", () => {
  it("indexes text-bearing content blocks with query metadata", async () => {
    const records = await createVectorRecordsFromMemoryObject(memory, async () => [0.1, 0.2]);

    expect(records).toHaveLength(1);
    expect(records[0].hash).toBe("hash-1");
    expect(records[0].memory_id).toBe("mem-1");
    expect(records[0].scope_ids).toContain("memo-hub");
    expect(records[0].visibility).toBe("shared");
    expect(records[0].domain_types).toContain("code-intelligence");
    expect(records[0].source_id).toBe("hermes");
    expect(records[0].track_id).toBe("track-source");
  });

  it("does not index archived memories in default projections", async () => {
    const records = await createVectorRecordsFromMemoryObject(
      { ...memory, state: "archived" },
      async () => [0.1, 0.2],
    );

    expect(records).toHaveLength(0);
  });

  it("keeps legacy track transition mapping explicit", () => {
    expect(domainToTransitionTrack("code-intelligence")).toBe("track-source");
    expect(domainToTransitionTrack("project-knowledge")).toBe("track-insight");
    expect(domainToTransitionTrack("task-session")).toBe("track-stream");
    expect(domainToTransitionTrack("habit-convention")).toBe("track-wiki");
  });
});

describe("InMemoryStructuredIndex", () => {
  it("indexes links and scopes for relation lookup", () => {
    const index = new InMemoryStructuredIndex();
    index.addMemoryObject(memory);

    expect(index.queryBySource("mem-1").map((entry) => entry.relation)).toContain("relates_to");
    expect(index.queryByTarget("memo-hub").map((entry) => entry.relation)).toContain("scope:project");
  });
});
