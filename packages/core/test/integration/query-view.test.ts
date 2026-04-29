import { describe, expect, it } from "bun:test";
import { MemoryObject } from "@memohub/protocol";
import { QueryPlanner, RecallQuery } from "../../src/query-planner.ts";

const now = "2026-04-29T00:00:00.000Z";

function memory(id: string, layer: string, domain: string): MemoryObject {
  return {
    id,
    kind: "memory",
    source: { type: "agent", id: layer === "self" ? "hermes" : "codex" },
    scopes: [{ type: layer === "self" ? "agent" : layer, id: layer === "self" ? "hermes" : layer }],
    visibility: layer === "global" ? "global" : "shared",
    domains: [{ type: domain }],
    state: "curated",
    content: [{ type: "text", text: id }],
    provenance: { ingestedAt: now, metadata: { confidence: "verified" } },
    metadata: { confidence: "verified" },
    createdAt: now,
    updatedAt: now,
  };
}

describe("layered context view assembly", () => {
  it("recalls Hermes self, project-shared, and global memory with attribution", async () => {
    const calls: RecallQuery[] = [];
    const planner = new QueryPlanner({
      async recall(query) {
        calls.push(query);
        if (query.layer === "self") return [memory("hermes-profile", "self", "habit-convention")];
        if (query.layer === "project") return [memory("memo-hub-context", "project", "project-knowledge")];
        return [memory("global-rule", "global", "habit-convention")];
      },
    });

    const view = await planner.query({
      view: "agent_profile",
      actorId: "hermes",
      projectId: "memo-hub",
      query: "习惯",
      limit: 5,
    });

    expect(calls.map((call) => call.layer)).toEqual(["self", "project", "global"]);
    expect(view.selfContext[0].object.id).toBe("hermes-profile");
    expect(view.projectContext[0].object.id).toBe("memo-hub-context");
    expect(view.globalContext[0].object.id).toBe("global-rule");
    expect(view.selfContext[0].layer).toBe("self");
    expect(view.projectContext[0].layer).toBe("project");
    expect(view.globalContext[0].layer).toBe("global");
  });

  it("applies configurable weighting and exposes ranking metadata", async () => {
    const planner = new QueryPlanner({
      async recall(query) {
        return [memory(`${query.layer}-memory`, query.layer, "project-knowledge")];
      },
    });

    const view = await planner.query({
      view: "project_context",
      actorId: "hermes",
      projectId: "memo-hub",
      weightPolicy: {
        id: "prefer-project",
        layer: { self: 1, project: 5, global: 1 },
      },
    });

    expect(view.metadata.policyId).toBe("prefer-project");
    expect(view.projectContext[0].scoreBreakdown.layer).toBe(5);
    expect(view.metadata.appliedFactors).toContain("layer");
  });
});
