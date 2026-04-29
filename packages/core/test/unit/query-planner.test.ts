import { describe, expect, it } from "bun:test";
import { MemoryObject } from "@memohub/protocol";
import { QueryPlanner, RecallQuery, resolveLayerQueries } from "../../src/query-planner.ts";

const now = "2026-04-29T00:00:00.000Z";

function memory(id: string, layerScope: { type: string; id: string }, domain: string, state = "raw"): MemoryObject {
  return {
    id,
    kind: "memory",
    source: { type: "agent", id: id.startsWith("self") ? "hermes" : "codex" },
    scopes: [layerScope],
    visibility: layerScope.type === "global" ? "global" : "shared",
    domains: [{ type: domain }],
    state,
    content: [{ type: "text", text: id }],
    provenance: { ingestedAt: now, metadata: { confidence: "verified" } },
    metadata: { confidence: "verified" },
    createdAt: now,
    updatedAt: now,
  };
}

describe("resolveLayerQueries", () => {
  it("resolves self, project, and global scopes", () => {
    const queries = resolveLayerQueries({
      view: "coding_context",
      actorId: "hermes",
      projectId: "memo-hub",
      sessionId: "s1",
      taskId: "t1",
      query: "router",
    }, ["code-intelligence"], 5);

    expect(queries.self.scopes.map((scope) => scope.type)).toEqual(["agent", "session", "task"]);
    expect(queries.project.scopes[0]).toEqual({ type: "project", id: "memo-hub" });
    expect(queries.global.scopes[0]).toEqual({ type: "global", id: "global" });
  });
});

describe("QueryPlanner", () => {
  it("queries all layers and preserves attribution", async () => {
    const calls: RecallQuery[] = [];
    const planner = new QueryPlanner({
      async recall(query) {
        calls.push(query);
        if (query.layer === "self") return [memory("self-1", { type: "agent", id: "hermes" }, "habit-convention")];
        if (query.layer === "project") return [memory("project-1", { type: "project", id: "memo-hub" }, "project-knowledge")];
        return [memory("global-1", { type: "global", id: "global" }, "habit-convention")];
      },
    });

    const view = await planner.query({
      view: "agent_profile",
      actorId: "hermes",
      projectId: "memo-hub",
      query: "habits",
    });

    expect(calls.map((call) => call.layer)).toEqual(["self", "project", "global"]);
    expect(view.selfContext[0].layer).toBe("self");
    expect(view.projectContext[0].layer).toBe("project");
    expect(view.globalContext[0].layer).toBe("global");
    expect(view.metadata.policyId).toBe("default-self-project-global");
  });

  it("applies default self > project > global layer weights", async () => {
    const planner = new QueryPlanner({
      async recall(query) {
        return [memory(`${query.layer}-1`, query.scopes[0], "project-knowledge")];
      },
    });

    const view = await planner.query({ view: "project_context", actorId: "hermes", projectId: "memo-hub" });

    expect(view.selfContext[0].scoreBreakdown.layer).toBeGreaterThan(view.projectContext[0].scoreBreakdown.layer);
    expect(view.projectContext[0].scoreBreakdown.layer).toBeGreaterThan(view.globalContext[0].scoreBreakdown.layer);
  });

  it("separates conflicted memories into conflictsOrGaps", async () => {
    const planner = new QueryPlanner({
      async recall(query) {
        return query.layer === "project"
          ? [memory("conflict-1", { type: "project", id: "memo-hub" }, "project-knowledge", "conflicted")]
          : [];
      },
    });

    const view = await planner.query({ view: "project_context", actorId: "hermes", projectId: "memo-hub" });
    expect(view.conflictsOrGaps).toHaveLength(1);
    expect(view.conflictsOrGaps[0].object.state).toBe("conflicted");
  });

  it("emits a gap candidate when all recall layers are empty", async () => {
    const planner = new QueryPlanner({
      async recall() {
        return [];
      },
    });

    const view = await planner.query({ view: "project_context", actorId: "hermes", projectId: "memo-hub" });
    expect(view.conflictsOrGaps).toHaveLength(1);
    expect(view.conflictsOrGaps[0].object.metadata?.gap).toBe(true);
  });

  it("hides archived memories from default context views", async () => {
    const planner = new QueryPlanner({
      async recall(query) {
        return [memory(`${query.layer}-archived`, query.scopes[0], "project-knowledge", "archived")];
      },
    });

    const view = await planner.query({ view: "project_context", actorId: "hermes", projectId: "memo-hub" });
    expect(view.selfContext).toHaveLength(0);
    expect(view.projectContext).toHaveLength(0);
    expect(view.globalContext).toHaveLength(0);
  });

  it("supports coding_context view domain defaults and ranking metadata", async () => {
    const planner = new QueryPlanner({
      async recall(query) {
        return [memory(`${query.layer}-code`, query.scopes[0], "code-intelligence")];
      },
    });

    const view = await planner.query({ view: "coding_context", actorId: "hermes", projectId: "memo-hub" });
    expect(view.selfContext[0].scoreBreakdown.domain).toBeGreaterThan(0);
    expect(view.metadata.appliedFactors).toContain("domain");
    expect(view.sources.length).toBeGreaterThan(0);
  });
});
