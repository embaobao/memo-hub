import { describe, expect, it } from "bun:test";
import { MemoryObject } from "@memohub/protocol";
import { AgentMemoryOperator } from "../../src/agent-memory-operations.ts";

const now = "2026-04-29T00:00:00.000Z";

function memory(id: string, state = "raw"): MemoryObject {
  return {
    id,
    kind: "evidence",
    source: { type: "agent", id: "hermes" },
    actor: { type: "agent", id: "hermes" },
    scopes: [{ type: "project", id: "memo-hub" }],
    visibility: "shared",
    domains: [{ type: "project-knowledge" }],
    state,
    content: [{ type: "text", text: `memory ${id}` }],
    provenance: { ingestedAt: now },
    createdAt: now,
    updatedAt: now,
  };
}

describe("AgentMemoryOperator", () => {
  it("creates governed summarization output with provenance", async () => {
    const operator = new AgentMemoryOperator();
    const result = await operator.run({
      type: "summarize",
      inputMemories: [memory("mem-1"), memory("mem-2")],
      sourceAgent: { type: "agent", id: "codex" },
      provider: "openai",
      model: "gpt-5",
      confidence: 0.7,
      now,
    });

    expect(result.type).toBe("summarize");
    expect(result.inputMemoryIds).toEqual(["mem-1", "mem-2"]);
    expect(result.reviewState).toBe("proposed");
    expect(result.outputs[0].state).toBe("raw");
    expect(result.outputs[0].provenance.parentIds).toEqual(["mem-1", "mem-2"]);
    expect(result.outputs[0].metadata?.reviewState).toBe("proposed");
  });

  it("generates clarification items for conflicts", async () => {
    const operator = new AgentMemoryOperator();
    const result = await operator.run({
      type: "clarify",
      inputMemories: [memory("mem-conflict", "conflicted")],
      sourceAgent: { type: "agent", id: "hermes" },
      now,
    });

    expect(result.outputs).toHaveLength(0);
    expect(result.clarifications).toHaveLength(1);
    expect(result.clarifications[0].reason).toBe("conflict");
    expect(result.clarifications[0].memoryIds).toEqual(["mem-conflict"]);
  });

  it("marks accepted review output as curated", async () => {
    const operator = new AgentMemoryOperator();
    const result = await operator.run({
      type: "review",
      inputMemories: [memory("mem-1")],
      sourceAgent: { type: "agent", id: "reviewer" },
      reviewState: "accepted",
      now,
    });

    expect(result.outputs[0].state).toBe("curated");
    expect(result.outputs[0].visibility).toBe("shared");
  });
});
