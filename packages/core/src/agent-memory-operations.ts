import {
  ClarificationItem,
  MemoryObject,
  ReviewState,
  SourceDescriptor,
  createClarificationItem,
} from "@memohub/protocol";

export type AgentMemoryOperationType = "summarize" | "extract" | "annotate" | "clarify" | "review";

export interface AgentMemoryOperationRequest {
  type: AgentMemoryOperationType;
  inputMemories: MemoryObject[];
  sourceAgent: SourceDescriptor;
  provider?: string;
  model?: string;
  confidence?: number;
  reviewState?: ReviewState;
  instruction?: string;
  annotation?: string;
  now?: string;
}

export interface AgentMemoryOperationResult {
  operationId: string;
  type: AgentMemoryOperationType;
  inputMemoryIds: string[];
  outputMemoryIds: string[];
  sourceAgent: SourceDescriptor;
  provider?: string;
  model?: string;
  confidence: number;
  reviewState: ReviewState;
  outputs: MemoryObject[];
  clarifications: ClarificationItem[];
  metadata: Record<string, unknown>;
}

export class AgentMemoryOperator {
  async run(request: AgentMemoryOperationRequest): Promise<AgentMemoryOperationResult> {
    const now = request.now ?? new Date().toISOString();
    const operationId = `op_${request.type}_${stableId(request.inputMemories.map((memory) => memory.id).join(":"))}`;
    const confidence = request.confidence ?? 0.5;
    const reviewState = request.reviewState ?? "proposed";

    const outputs = buildOperationOutputs(request, operationId, now, confidence, reviewState);
    const clarifications = request.type === "clarify"
      ? buildClarifications(request, operationId, now)
      : [];

    return {
      operationId,
      type: request.type,
      inputMemoryIds: request.inputMemories.map((memory) => memory.id),
      outputMemoryIds: outputs.map((memory) => memory.id),
      sourceAgent: request.sourceAgent,
      provider: request.provider,
      model: request.model,
      confidence,
      reviewState,
      outputs,
      clarifications,
      metadata: {
        operationType: request.type,
        inputCount: request.inputMemories.length,
        generatedAt: now,
      },
    };
  }
}

function buildOperationOutputs(
  request: AgentMemoryOperationRequest,
  operationId: string,
  now: string,
  confidence: number,
  reviewState: ReviewState,
): MemoryObject[] {
  if (request.type === "clarify") return [];

  const text = buildOperationText(request);
  const domains = request.inputMemories.flatMap((memory) => memory.domains);
  const scopes = request.inputMemories.flatMap((memory) => memory.scopes);

  return [{
    id: `mem_${operationId}`,
    kind: "memory",
    source: request.sourceAgent,
    actor: { type: "agent", id: request.sourceAgent.id, source: request.sourceAgent },
    scopes: dedupeBy(scopes.length ? scopes : [{ type: "global", id: "global" }], (scope) => `${scope.type}:${scope.id}`),
    visibility: request.type === "review" && reviewState === "accepted" ? "shared" : "private",
    domains: dedupeBy(domains.length ? domains : [{ type: "project-knowledge" }], (domain) => `${domain.type}:${domain.subtype ?? ""}`),
    state: request.type === "review" && reviewState === "accepted" ? "curated" : "raw",
    content: [{
      type: "text",
      text,
      metadata: {
        operationType: request.type,
        reviewState,
      },
    }],
    links: request.inputMemories.map((memory) => ({
      type: "derived_from",
      targetId: memory.id,
      targetKind: memory.kind,
    })),
    provenance: {
      ingestedAt: now,
      operationId,
      parentIds: request.inputMemories.map((memory) => memory.id),
      metadata: {
        provider: request.provider,
        model: request.model,
        confidence,
        reviewState,
      },
    },
    metadata: {
      confidence,
      reviewState,
      operationType: request.type,
    },
    createdAt: now,
    updatedAt: now,
  }];
}

function buildOperationText(request: AgentMemoryOperationRequest): string {
  const joined = request.inputMemories
    .flatMap((memory) => memory.content.map((block) => block.text).filter(Boolean))
    .join("\n");

  switch (request.type) {
    case "summarize":
      return request.instruction ?? `Summary candidate:\n${truncate(joined, 600)}`;
    case "extract":
      return request.instruction ?? `Extracted candidates: entities, claims, tasks, preferences, dependencies, and API facts from ${request.inputMemories.length} memories.`;
    case "annotate":
      return request.annotation ?? request.instruction ?? "Annotation candidate";
    case "review":
      return request.instruction ?? "Review decision recorded.";
    default:
      return request.instruction ?? truncate(joined, 600);
  }
}

function buildClarifications(
  request: AgentMemoryOperationRequest,
  operationId: string,
  now: string,
): ClarificationItem[] {
  const conflicted = request.inputMemories.filter((memory) => memory.state === "conflicted");
  if (conflicted.length > 0) {
    return [createClarificationItem({
      id: `clarify_${operationId}`,
      question: request.instruction ?? "Which conflicting memory should be treated as current?",
      reason: "conflict",
      memoryIds: conflicted.map((memory) => memory.id),
      source: request.sourceAgent,
      now,
    })];
  }

  return [createClarificationItem({
    id: `clarify_${operationId}`,
    question: request.instruction ?? "What missing context should be added to complete this memory set?",
    reason: "gap",
    memoryIds: request.inputMemories.map((memory) => memory.id),
    source: request.sourceAgent,
    now,
  })];
}

function stableId(value: string): string {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash.toString(16);
}

function truncate(value: string, maxLength: number): string {
  return value.length > maxLength ? `${value.slice(0, maxLength - 3)}...` : value;
}

function dedupeBy<T>(items: T[], keyOf: (item: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = keyOf(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
