import { describe, expect, it } from "bun:test";
import { EventConfidence, EventKind, EventSource } from "@memohub/protocol";
import { normalizeMemoHubEvent } from "../../src/normalizer.ts";

const baseEvent = {
  id: "evt-1",
  source: EventSource.HERMES,
  channel: "hermes-session",
  kind: EventKind.MEMORY,
  projectId: "memo-hub",
  sessionId: "session-1",
  taskId: "task-1",
  confidence: EventConfidence.REPORTED,
  occurredAt: "2026-04-29T00:00:00.000Z",
  payload: {
    text: "User prefers concise answers.",
    kind: "memory" as const,
    category: "preference",
    metadata: {
      actorId: "hermes",
      vendor: "local",
      custom: "kept",
    },
  },
};

describe("normalizeMemoHubEvent", () => {
  it("normalizes Hermes memory into canonical event and memory object", () => {
    const result = normalizeMemoHubEvent(baseEvent, {
      contentHash: "hash-1",
      receivedAt: "2026-04-29T00:00:01.000Z",
    });

    expect(result.canonicalEvent.source.type).toBe("agent");
    expect(result.canonicalEvent.scopes.map((scope) => scope.type)).toContain("agent");
    expect(result.memoryObject.content[0].hash).toBe("hash-1");
    expect(result.memoryObject.state).toBe("raw");
  });

  it("maps CLI, MCP, IDE, scanner, and generic external sources", () => {
    const cases = [
      { source: EventSource.CLI, expectedType: "cli" },
      { source: EventSource.MCP, expectedType: "mcp" },
      { source: EventSource.IDE, expectedType: "ide" },
      { source: "scanner", expectedType: "scanner" },
      { source: "browser-extension", expectedType: "browser-extension" },
    ];

    for (const item of cases) {
      const result = normalizeMemoHubEvent({
        ...baseEvent,
        source: item.source as any,
        id: `evt-${item.source}`,
      });
      expect(result.canonicalEvent.source.type).toBe(item.expectedType);
    }
  });

  it("supports Gemini through open descriptors without protocol enum changes", () => {
    const result = normalizeMemoHubEvent({
      ...baseEvent,
      id: "evt-gemini",
      source: "gemini" as any,
      channel: "gemini-cli",
    });

    expect(result.canonicalEvent.source.id).toBe("gemini");
    expect(result.canonicalEvent.source.vendor).toBe("google");
    expect(result.memoryObject.source.id).toBe("gemini");
  });

  it("preserves source-specific metadata in provenance and event metadata", () => {
    const result = normalizeMemoHubEvent(baseEvent);

    expect(result.canonicalEvent.provenance?.metadata?.custom).toBe("kept");
    expect((result.memoryObject.metadata?.sourceMetadata as any).custom).toBe("kept");
  });

  it("adds code-intelligence domain for file memories", () => {
    const result = normalizeMemoHubEvent({
      ...baseEvent,
      payload: {
        ...baseEvent.payload,
        text: "Updated auth module.",
        file_path: "src/auth.ts",
        category: "code-change",
      },
    });

    expect(result.memoryObject.domains.map((domain) => domain.type)).toContain("code-intelligence");
    expect(result.memoryObject.content[0].type).toBe("code");
  });

  it("rejects invalid memory payloads", () => {
    expect(() => normalizeMemoHubEvent({
      ...baseEvent,
      payload: { kind: "memory" } as any,
    })).toThrow();
  });
});
