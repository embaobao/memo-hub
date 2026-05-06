import { QueryPlanner, type RecallQuery } from "@memohub/core";
import {
  EventSource,
  type CanonicalMemoryEvent,
  type ClarificationItem,
  type IEmbedder,
  type MemoryObject,
  type MemoHubEvent,
  resolveClarificationItem,
} from "@memohub/protocol";
import { ContentAddressableStorage } from "@memohub/storage-flesh";
import { VectorStorage, type VectorRecord } from "@memohub/storage-soul";
import {
  createVectorRecordsFromMemoryObject,
  normalizeMemoHubEvent,
} from "@memohub/integration-hub";
import { ChannelRegistry, type ChannelRegistryEntry, type ChannelOpenRequest } from "@memohub/channel";

export type RuntimeConfigSnapshot = Record<string, unknown>;

export interface UnifiedMemoryRuntimeConfig {
  cas: ContentAddressableStorage;
  vector: VectorStorage;
  embedder: IEmbedder;
  channels: ChannelRegistry;
  runtimeConfig?: RuntimeConfigSnapshot;
}

export interface UnifiedIngestResult {
  success: boolean;
  eventId: string;
  contentHash?: string;
  canonicalEvent?: CanonicalMemoryEvent;
  memoryObject?: MemoryObject;
  vectorRecordCount?: number;
  error?: string;
}

export interface ClarificationResolutionRequest {
  clarificationId: string;
  answer: string;
  resolvedBy: string;
  projectId?: string;
  actorId?: string;
  source?: string;
  memoryIds?: string[];
  question?: string;
  reason?: string;
}

export interface ClarificationResolutionResult {
  success: boolean;
  clarification: ClarificationItem;
  memoryObject?: MemoryObject;
  contentHash?: string;
  vectorRecordCount?: number;
  error?: string;
}

export class UnifiedMemoryRuntime {
  constructor(private readonly config: UnifiedMemoryRuntimeConfig) {}

  get vectorStore(): VectorStorage {
    return this.config.vector;
  }

  get channelRegistry(): ChannelRegistry {
    return this.config.channels;
  }

  async initialize(): Promise<void> {
    await this.config.vector.initialize();
    this.config.channels.initialize();
  }

  openChannel(request: ChannelOpenRequest): { reused: boolean; entry: ChannelRegistryEntry } {
    return this.config.channels.open(request);
  }

  listChannels(filters?: Parameters<ChannelRegistry["list"]>[0]): ChannelRegistryEntry[] {
    return this.config.channels.list(filters);
  }

  getChannel(channelId: string): ChannelRegistryEntry | undefined {
    return this.config.channels.get(channelId);
  }

  useChannel(channelId: string): ChannelRegistryEntry {
    return this.config.channels.use(channelId);
  }

  closeChannel(channelId: string): ChannelRegistryEntry {
    return this.config.channels.close(channelId);
  }

  autoBindWorkspaceChannel(input: Parameters<ChannelRegistry["autoBindWorkspaceChannel"]>[0]) {
    return this.config.channels.autoBindWorkspaceChannel(input);
  }

  async ingest(event: MemoHubEvent): Promise<UnifiedIngestResult> {
    try {
      // 第一步：先保存原始证据。后续所有投影和整理结果都必须能追溯到这个 CAS hash。
      const content = extractEventText(event);
      const contentHash = await this.config.cas.write(content);

      // 第二步：把所有外部来源归一成产品层记忆模型，CLI/MCP/Hermes/IDE 不再生成轨道记录。
      const normalized = normalizeMemoHubEvent(event as never, {
        eventId: event.id,
        receivedAt: new Date().toISOString(),
        contentHash,
      });

      // 第三步：把规范化记忆对象投影到向量记录。这是存储投影，不是对外暴露的轨道选择。
      const records = await createVectorRecordsFromMemoryObject(
        normalized.memoryObject,
        (text) => this.config.embedder.embed(text),
      );

      if (records.length > 0) await this.config.vector.add(records);

      return {
        success: true,
        eventId: normalized.canonicalEvent.id,
        contentHash,
        canonicalEvent: normalized.canonicalEvent,
        memoryObject: normalized.memoryObject,
        vectorRecordCount: records.length,
      };
    } catch (error) {
      return {
        success: false,
        eventId: event.id ?? "unknown",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async queryView(request: {
    view: string;
    query?: string;
    actorId?: string;
    projectId?: string;
    workspaceId?: string;
    sessionId?: string;
    taskId?: string;
    domains?: string[];
    limit?: number;
    source?: EventSource;
  }) {
    // QueryPlanner 负责 scope 解析、层级归因、权重和冲突/缺口组装；Runtime 只负责从存储召回。
    const planner = new QueryPlanner({
      recall: (query) => this.recall(query),
    });

    return planner.query(request);
  }

  async listMemories(request: {
    perspective: "actor" | "project" | "global";
    actorId?: string;
    projectId?: string;
    workspaceId?: string;
    sessionId?: string;
    taskId?: string;
    domains?: string[];
    limit?: number;
  }): Promise<MemoryObject[]> {
    const limit = request.limit ?? 20;
    const domains = request.domains ?? [];
    const scopes = buildListScopes(request);
    const records = await this.listFallbackCandidates({
      layer: request.perspective === "actor" ? "self" : request.perspective === "project" ? "project" : "global",
      scopes,
      domains,
      limit,
    }, limit);

    return dedupeMemoryObjects(
      records
        .map((record, index) => vectorRecordToMemoryObject(record, {
          layer: request.perspective === "actor" ? "self" : request.perspective === "project" ? "project" : "global",
          scopes,
          domains,
          limit,
        }, index))
        .filter((memory) => scopes.length === 0 || matchesList(memory, scopes))
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
        .slice(0, limit),
    );
  }

  async resolveClarification(request: ClarificationResolutionRequest): Promise<ClarificationResolutionResult> {
    const now = new Date().toISOString();
    const clarification: ClarificationItem = {
      id: request.clarificationId,
      status: "open",
      question: request.question ?? "External clarification answer",
      reason: request.reason ?? "external-resolution",
      memoryIds: request.memoryIds?.length ? request.memoryIds : [request.clarificationId],
      source: {
        type: "agent",
        id: request.resolvedBy,
      },
      createdAt: now,
      updatedAt: now,
    };

    const resolved = resolveClarificationItem(clarification, {
      text: request.answer,
      resolvedBy: request.resolvedBy,
      now,
      metadata: {
        projectId: request.projectId,
        actorId: request.actorId,
        source: request.source,
      },
    });

    try {
      // 澄清回答本身要成为可检索记忆，否则外部对话中的修正不会进入后续上下文。
      const memoryObject = buildClarificationResolutionMemory(request, resolved, now);
      const persisted = await this.persistMemoryObject(memoryObject);

      return {
        success: true,
        clarification: resolved,
        memoryObject,
        contentHash: persisted.contentHash,
        vectorRecordCount: persisted.vectorRecordCount,
      };
    } catch (error) {
      return {
        success: false,
        clarification: resolved,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async inspect() {
    return {
      version: "1.1.0",
      runtime: "unified-memory-runtime",
      config: this.config.runtimeConfig,
      stores: ["cas", "vector"],
      model: "MemoryObject",
      queryLayers: ["self", "project", "global"],
      views: ["agent_profile", "recent_activity", "project_context", "coding_context"],
      agentOperations: ["summarize", "extract", "annotate", "clarification_create", "clarification_resolve", "review"],
    };
  }

  private async persistMemoryObject(memory: MemoryObject): Promise<{ contentHash: string; vectorRecordCount: number }> {
    const text = memory.content.map((block) => block.text ?? JSON.stringify(block.data ?? "")).join("\n");
    const contentHash = await this.config.cas.write(text);
    const memoryWithHash: MemoryObject = {
      ...memory,
      provenance: {
        ...memory.provenance,
        sourceEventId: memory.provenance.sourceEventId ?? contentHash,
        metadata: {
          ...memory.provenance.metadata,
          contentHash,
        },
      },
    };
    const records = await createVectorRecordsFromMemoryObject(
      memoryWithHash,
      (value) => this.config.embedder.embed(value),
    );
    if (records.length > 0) await this.config.vector.add(records);
    return { contentHash, vectorRecordCount: records.length };
  }

  private async recall(query: RecallQuery): Promise<MemoryObject[]> {
    // 当前存储 MVP 先走向量检索；如果候选不足，再回退到作用域/领域兜底扫描，
    // 避免真实接入时“刚写入但未被前几条向量候选召回”的问题。
    const queryText = query.query ?? query.scopes.map((scope) => `${scope.type}:${scope.id}`).join(" ");
    const queryVector = await this.config.embedder.embed(queryText || query.layer);
    const candidateLimit = Math.max(query.limit * 3, query.limit);
    const searched = await this.config.vector.search(queryVector, { limit: candidateLimit });
    const fallback = await this.listFallbackCandidates(query, candidateLimit);
    const merged = dedupeVectorRecords([...searched, ...fallback]);

    return merged
      .map((record, index) => vectorRecordToMemoryObject(record, query, index))
      .filter((memory) => matchesRecall(memory, query))
      .slice(0, query.limit);
  }

  private async listFallbackCandidates(query: RecallQuery, limit: number): Promise<VectorRecord[]> {
    const list = (this.config.vector as VectorStorage & { list?: (filter?: string, limit?: number) => Promise<VectorRecord[]> }).list;
    if (typeof list !== "function") return [];

    const records = await list.call(this.config.vector, undefined, Math.max(limit * 10, 200));
    return records.filter((record) => {
      const scopeTypes = arrayField(record.scope_types);
      const scopeIds = arrayField(record.scope_ids);
      const domainTypes = arrayField(record.domain_types);
      const scopeMatch = query.scopes.length === 0
        || query.scopes.some((scope) =>
          scopeTypes.some((type, index) => type === scope.type && scopeIds[index] === scope.id));
      const domainMatch = query.domains.length === 0
        || domainTypes.some((domain) => query.domains.includes(domain));
      return scopeMatch && domainMatch;
    }).slice(0, limit);
  }
}

function buildClarificationResolutionMemory(
  request: ClarificationResolutionRequest,
  clarification: ClarificationItem,
  now: string,
): MemoryObject {
  const projectId = request.projectId ?? "default";
  const memoryIds = request.memoryIds?.length ? request.memoryIds : [];
  const operationId = `resolve_${safeId(request.clarificationId)}_${safeId(request.resolvedBy)}`;

  return {
    id: `mem_${operationId}`,
    kind: "memory",
    source: {
      type: request.source ?? "mcp",
      id: request.source ?? "mcp",
    },
    actor: {
      type: "agent",
      id: request.actorId ?? request.resolvedBy,
    },
    scopes: [
      { type: "project", id: projectId },
      ...(request.actorId ? [{ type: "agent", id: request.actorId }] : []),
    ],
    visibility: "shared",
    domains: [{ type: "project-knowledge", subtype: "clarification" }],
    state: "curated",
    content: [{
      type: "text",
      text: request.answer,
      metadata: {
        clarificationId: request.clarificationId,
        question: clarification.question,
        resolvedBy: request.resolvedBy,
      },
    }],
    links: [
      { type: "resolves", targetId: request.clarificationId, targetKind: "clarification" },
      ...memoryIds.map((memoryId) => ({
        type: "derived_from",
        targetId: memoryId,
        targetKind: "memory",
      })),
    ],
    provenance: {
      ingestedAt: now,
      operationId,
      parentIds: memoryIds,
      metadata: {
        clarificationStatus: clarification.status,
        resolvedAt: clarification.resolution?.resolvedAt,
      },
    },
    metadata: {
      confidence: "verified",
      reviewState: "accepted",
      clarificationId: request.clarificationId,
      operationType: "resolve_clarification",
    },
    tags: ["clarification", "resolution"],
    createdAt: now,
    updatedAt: now,
  };
}

function safeId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80);
}

function extractEventText(event: MemoHubEvent): string {
  const payload = event.payload as { text?: unknown };
  return typeof payload?.text === "string" ? payload.text : JSON.stringify(event.payload ?? {});
}

function matchesRecall(memory: MemoryObject, query: RecallQuery): boolean {
  const domainMatch = query.domains.length === 0 || memory.domains.some((domain) => query.domains.includes(domain.type));
  if (!domainMatch) return false;
  if (query.scopes.length === 0) return true;
  return memory.scopes.some((scope) => query.scopes.some((expected) => expected.type === scope.type && expected.id === scope.id));
}

function matchesList(memory: MemoryObject, scopes: { type: string; id: string }[]): boolean {
  return memory.scopes.some((scope) => scopes.some((expected) => expected.type === scope.type && expected.id === scope.id));
}

function buildListScopes(request: {
  perspective: "actor" | "project" | "global";
  actorId?: string;
  projectId?: string;
  workspaceId?: string;
  sessionId?: string;
  taskId?: string;
}): { type: string; id: string }[] {
  if (request.perspective === "global") return [];

  if (request.perspective === "actor") {
    return [
      ...(request.actorId ? [{ type: "agent", id: request.actorId }] : []),
      ...(request.sessionId ? [{ type: "session", id: request.sessionId }] : []),
      ...(request.taskId ? [{ type: "task", id: request.taskId }] : []),
    ];
  }

  return [
    ...(request.projectId ? [{ type: "project", id: request.projectId }] : []),
    ...(request.workspaceId ? [{ type: "workspace", id: request.workspaceId }] : []),
  ];
}

function vectorRecordToMemoryObject(record: VectorRecord, query: RecallQuery, index: number): MemoryObject {
  const now = new Date().toISOString();
  const scopeTypes = arrayField(record.scope_types);
  const scopeIds = arrayField(record.scope_ids);
  const scopes = scopeTypes.map((type, scopeIndex) => ({ type, id: scopeIds[scopeIndex] ?? type }));
  const domainTypes = arrayField(record.domain_types);

  return {
    id: String(record.memory_id ?? record.id ?? `memory_${query.layer}_${index}`),
    kind: "memory",
    source: {
      type: String(record.source_type ?? record.source ?? "unknown"),
      id: String(record.source_id ?? record.source ?? "unknown"),
    },
    actor: record.actor_id ? { type: "agent", id: String(record.actor_id) } : undefined,
    subject: record.subject_id ? { type: "subject", id: String(record.subject_id) } : undefined,
    scopes: scopes.length ? scopes : query.scopes,
    visibility: String(record.visibility ?? (query.layer === "global" ? "global" : "shared")),
    domains: domainTypes.length ? domainTypes.map((type) => ({ type })) : query.domains.map((type) => ({ type })),
    state: String(record.state ?? "raw"),
    content: [{ type: "text", text: String(record.text ?? "") }],
    provenance: {
      ingestedAt: String(record.timestamp ?? now),
      sourceEventId: String(record.hash ?? record.id),
      metadata: {
        vectorRecordId: record.id,
      },
    },
    tags: arrayField(record.tags),
    metadata: {
      confidence: record.confidence ?? "reported",
      vectorDistance: record._distance,
      operationType: record.operation_type,
      clarificationId: record.clarification_id,
      reviewState: record.review_state,
    },
    createdAt: String(record.timestamp ?? now),
    updatedAt: String(record.timestamp ?? now),
  };
}

function arrayField(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

function dedupeVectorRecords(records: VectorRecord[]): VectorRecord[] {
  const seen = new Set<string>();
  return records.filter((record) => {
    const id = String(record.id ?? "");
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function dedupeMemoryObjects(records: MemoryObject[]): MemoryObject[] {
  const seen = new Set<string>();
  return records.filter((record) => {
    if (seen.has(record.id)) return false;
    seen.add(record.id);
    return true;
  });
}
