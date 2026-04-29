import { MemoryObject, SourceDescriptor, isDefaultVisibleMemory } from "@memohub/protocol";

export type RecallLayer = "self" | "project" | "global";
export type QueryViewName = "agent_profile" | "recent_activity" | "project_context" | "coding_context" | string;

export interface QueryRequest {
  view: QueryViewName;
  query?: string;
  actorId?: string;
  projectId?: string;
  workspaceId?: string;
  sessionId?: string;
  taskId?: string;
  domains?: string[];
  limit?: number;
  weightPolicy?: Partial<RecallWeightPolicy>;
}

export interface RecallQuery {
  layer: RecallLayer;
  query?: string;
  scopes: { type: string; id: string }[];
  domains: string[];
  limit: number;
}

export interface RecallWeightPolicy {
  id: string;
  layer: Record<string, number>;
  recency?: { halfLifeDays?: number; weight: number };
  confidence?: Record<string, number>;
  sourceTrust?: Record<string, number>;
  domain?: Record<string, number>;
  state?: Record<string, number>;
  metadata?: Record<string, unknown>;
}

export interface WeightedMemoryResult {
  object: MemoryObject;
  layer: RecallLayer;
  score: number;
  scoreBreakdown: Record<string, number>;
}

export interface ContextView {
  view: QueryViewName;
  selfContext: WeightedMemoryResult[];
  projectContext: WeightedMemoryResult[];
  globalContext: WeightedMemoryResult[];
  conflictsOrGaps: WeightedMemoryResult[];
  sources: SourceDescriptor[];
  metadata: {
    query?: string;
    policyId: string;
    appliedFactors: string[];
    layers: Record<RecallLayer, number>;
    [key: string]: unknown;
  };
}

export interface MemoryRecallStore {
  recall(query: RecallQuery): Promise<MemoryObject[]>;
}

export const DEFAULT_RECALL_WEIGHT_POLICY: RecallWeightPolicy = {
  id: "default-self-project-global",
  layer: { self: 3, project: 2, global: 1 },
  confidence: { verified: 1, observed: 0.8, reported: 0.6, inferred: 0.4, provisional: 0.2 },
  state: { curated: 1, raw: 0.6, conflicted: -1, archived: -2 },
  domain: {
    "code-intelligence": 1,
    "project-knowledge": 1,
    "task-session": 1,
    "habit-convention": 1,
  },
};

const VIEW_DOMAIN_DEFAULTS: Record<string, string[]> = {
  agent_profile: ["habit-convention", "task-session"],
  recent_activity: ["task-session"],
  project_context: ["project-knowledge", "habit-convention"],
  coding_context: ["code-intelligence", "project-knowledge"],
};

export class QueryPlanner {
  constructor(private readonly store: MemoryRecallStore) {}

  async query(request: QueryRequest): Promise<ContextView> {
    const limit = request.limit ?? 10;
    const domains = request.domains?.length ? request.domains : VIEW_DOMAIN_DEFAULTS[request.view] ?? [];
    const policy = mergePolicy(DEFAULT_RECALL_WEIGHT_POLICY, request.weightPolicy);
    const recallQueries = resolveLayerQueries(request, domains, limit);

    const [self, project, global] = await Promise.all([
      this.store.recall(recallQueries.self),
      this.store.recall(recallQueries.project),
      this.store.recall(recallQueries.global),
    ]);

    const selfContext = this.rank(self, "self", policy, domains);
    const projectContext = this.rank(project, "project", policy, domains);
    const globalContext = this.rank(global, "global", policy, domains);
    const visibleSelfContext = selfContext.filter((result) => isDefaultVisibleMemory(result.object));
    const visibleProjectContext = projectContext.filter((result) => isDefaultVisibleMemory(result.object));
    const visibleGlobalContext = globalContext.filter((result) => isDefaultVisibleMemory(result.object));
    const conflictsOrGaps = buildConflictsOrGaps(
      request,
      [...selfContext, ...projectContext, ...globalContext],
      domains,
    );

    return {
      view: request.view,
      selfContext: visibleSelfContext,
      projectContext: visibleProjectContext,
      globalContext: visibleGlobalContext,
      conflictsOrGaps,
      sources: uniqueSources([...self, ...project, ...global]),
      metadata: {
        query: request.query,
        policyId: policy.id,
        appliedFactors: ["layer", "confidence", "domain", "state", "sourceTrust"],
        layers: { self: self.length, project: project.length, global: global.length },
      },
    };
  }

  private rank(
    objects: MemoryObject[],
    layer: RecallLayer,
    policy: RecallWeightPolicy,
    requestedDomains: string[],
  ): WeightedMemoryResult[] {
    return objects
      .map((object) => {
        const scoreBreakdown = scoreMemory(object, layer, policy, requestedDomains);
        const score = Object.values(scoreBreakdown).reduce((sum, value) => sum + value, 0);
        return { object, layer, score, scoreBreakdown };
      })
      .sort((a, b) => b.score - a.score);
  }
}

function buildConflictsOrGaps(
  request: QueryRequest,
  results: WeightedMemoryResult[],
  domains: string[],
): WeightedMemoryResult[] {
  const conflicts = results.filter((result) => result.object.state === "conflicted");
  if (conflicts.length > 0) return conflicts;

  if (results.filter((result) => isDefaultVisibleMemory(result.object)).length > 0) return [];

  const now = new Date().toISOString();
  return [{
    object: {
      id: `gap_${request.view}_${request.projectId ?? request.actorId ?? "global"}`,
      kind: "memory",
      source: { type: "system", id: "query-planner" },
      scopes: [{ type: request.projectId ? "project" : "global", id: request.projectId ?? "global" }],
      visibility: request.projectId ? "shared" : "global",
      domains: domains.length ? domains.map((type) => ({ type })) : [{ type: "project-knowledge" }],
      state: "raw",
      content: [{
        type: "text",
        text: `No memory found for ${request.view}. Clarification or new evidence is needed.`,
      }],
      provenance: { ingestedAt: now, metadata: { reason: "gap" } },
      metadata: { gap: true, view: request.view, query: request.query },
      createdAt: now,
      updatedAt: now,
    },
    layer: "global",
    score: 0,
    scoreBreakdown: { gap: 0 },
  }];
}

export function resolveLayerQueries(
  request: QueryRequest,
  domains: string[],
  limit: number,
): Record<RecallLayer, RecallQuery> {
  return {
    self: {
      layer: "self",
      query: request.query,
      scopes: [
        ...(request.actorId ? [{ type: "agent", id: request.actorId }] : []),
        ...(request.sessionId ? [{ type: "session", id: request.sessionId }] : []),
        ...(request.taskId ? [{ type: "task", id: request.taskId }] : []),
      ],
      domains,
      limit,
    },
    project: {
      layer: "project",
      query: request.query,
      scopes: [
        ...(request.projectId ? [{ type: "project", id: request.projectId }] : []),
        ...(request.workspaceId ? [{ type: "workspace", id: request.workspaceId }] : []),
      ],
      domains,
      limit,
    },
    global: {
      layer: "global",
      query: request.query,
      scopes: [{ type: "global", id: "global" }],
      domains,
      limit,
    },
  };
}

export function scoreMemory(
  object: MemoryObject,
  layer: RecallLayer,
  policy: RecallWeightPolicy,
  requestedDomains: string[],
): Record<string, number> {
  const confidence = String(object.metadata?.confidence ?? object.provenance.metadata?.confidence ?? "");
  const matchingDomainCount = object.domains.filter((domain) => requestedDomains.includes(domain.type)).length;

  return {
    layer: policy.layer[layer] ?? 0,
    confidence: policy.confidence?.[confidence] ?? 0,
    domain: matchingDomainCount > 0 ? matchingDomainCount * 0.5 : 0,
    state: policy.state?.[object.state] ?? 0,
    sourceTrust: policy.sourceTrust?.[object.source.id] ?? policy.sourceTrust?.[object.source.type] ?? 0,
  };
}

function mergePolicy(base: RecallWeightPolicy, override?: Partial<RecallWeightPolicy>): RecallWeightPolicy {
  if (!override) return base;
  return {
    ...base,
    ...override,
    layer: { ...base.layer, ...override.layer },
    confidence: { ...base.confidence, ...override.confidence },
    sourceTrust: { ...base.sourceTrust, ...override.sourceTrust },
    domain: { ...base.domain, ...override.domain },
    state: { ...base.state, ...override.state },
  };
}

function uniqueSources(objects: MemoryObject[]): SourceDescriptor[] {
  const map = new Map<string, SourceDescriptor>();
  for (const object of objects) {
    map.set(`${object.source.type}:${object.source.id}`, object.source);
  }
  return Array.from(map.values());
}
