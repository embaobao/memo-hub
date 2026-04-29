import { describe, expect, it } from "bun:test";
import {
  CanonicalMemoryEventSchema,
  MemoryObjectSchema,
  validateCanonicalMemoryEvent,
  validateInstruction,
  validateMemoryObject,
  MemoOp,
} from "../../src/index.ts";

const now = "2026-04-29T00:00:00.000Z";

function makeMemoryObject(overrides: Record<string, unknown> = {}) {
  return {
    id: "mem-1",
    kind: "memory",
    source: {
      type: "agent",
      id: "hermes",
      vendor: "local",
    },
    actor: {
      type: "agent",
      id: "hermes",
    },
    scopes: [
      { type: "agent", id: "hermes" },
      { type: "project", id: "memo-hub" },
    ],
    visibility: "shared",
    domains: [
      { type: "project-knowledge" },
      { type: "habit-convention", subtype: "agent" },
    ],
    state: "raw",
    content: [
      { type: "text", text: "Hermes prefers concise implementation notes." },
      { type: "json", data: { preference: "concise" } },
    ],
    provenance: {
      ingestedAt: now,
      sourceEventId: "evt-1",
    },
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("MemoryObjectSchema", () => {
  it("validates a canonical memory object with required fields", () => {
    const result = validateMemoryObject(makeMemoryObject());
    expect(result.success).toBe(true);
    expect(result.data?.id).toBe("mem-1");
  });

  it("accepts open source descriptors such as Gemini without enum changes", () => {
    const result = validateMemoryObject(makeMemoryObject({
      source: {
        type: "agent",
        id: "gemini",
        vendor: "google",
        metadata: { model: "gemini" },
      },
    }));

    expect(result.success).toBe(true);
    expect(result.data?.source.id).toBe("gemini");
  });

  it("supports multiple scopes and domains", () => {
    const parsed = MemoryObjectSchema.parse(makeMemoryObject());
    expect(parsed.scopes.map((scope) => scope.type)).toEqual(["agent", "project"]);
    expect(parsed.domains.map((domain) => domain.type)).toEqual([
      "project-knowledge",
      "habit-convention",
    ]);
  });

  it("requires query-critical fields", () => {
    const result = validateMemoryObject(makeMemoryObject({ scopes: [] }));
    expect(result.success).toBe(false);
    expect(result.error).toContain("scopes");
  });

  it("requires content blocks to carry content references", () => {
    const result = validateMemoryObject(makeMemoryObject({
      content: [{ type: "text" }],
    }));
    expect(result.success).toBe(false);
    expect(result.error).toContain("content block");
  });
});

describe("CanonicalMemoryEventSchema", () => {
  it("validates a canonical event with open descriptors", () => {
    const result = validateCanonicalMemoryEvent({
      id: "evt-1",
      kind: "memory.ingested",
      source: {
        type: "agent",
        id: "gemini",
        vendor: "google",
      },
      scopes: [{ type: "project", id: "memo-hub" }],
      visibility: "shared",
      domains: [{ type: "project-knowledge" }],
      content: [{ type: "text", text: "Gemini captured a project note." }],
      occurredAt: now,
      receivedAt: now,
      confidence: "reported",
    });

    expect(result.success).toBe(true);
    expect(result.data?.source.id).toBe("gemini");
  });

  it("exports schemas for direct parsing", () => {
    const parsed = CanonicalMemoryEventSchema.parse({
      id: "evt-2",
      kind: "memory.ingested",
      source: { type: "cli", id: "memohub-cli" },
      scopes: [{ type: "global", id: "global" }],
      visibility: "global",
      domains: [{ type: "habit-convention" }],
      content: [{ type: "markdown", text: "# Note" }],
      occurredAt: now,
      receivedAt: now,
    });
    expect(parsed.visibility).toBe("global");
  });
});

describe("Text2Mem compatibility", () => {
  it("keeps existing Text2MemInstruction validation backward compatible", () => {
    const result = validateInstruction({
      op: MemoOp.ADD,
      trackId: "track-insight",
      payload: { text: "legacy instruction" },
      context: { source: "cli" },
      meta: { traceId: "trace-1", timestamp: now },
    });

    expect(result.success).toBe(true);
    expect(result.data?.trackId).toBe("track-insight");
  });
});
