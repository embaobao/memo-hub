import {
  CanonicalMemoryEvent,
  ContentBlock,
  DomainRef,
  EventConfidence,
  EventKind,
  EventSource,
  MemoryEventPayload,
  MemoryObject,
  MemoHubEvent,
  ScopeRef,
  SourceDescriptor,
  validateCanonicalMemoryEvent,
  validateMemoryObject,
} from "@memohub/protocol";
import { IntegrationHubError } from "@memohub/protocol";

export type NormalizationInput = MemoHubEvent & {
  source: EventSource | string;
  kind: EventKind | string;
  confidence: EventConfidence | string;
};

export interface NormalizationOptions {
  eventId?: string;
  receivedAt?: string;
  contentHash?: string;
}

export interface NormalizedMemory {
  canonicalEvent: CanonicalMemoryEvent;
  memoryObject: MemoryObject;
}

export function normalizeMemoHubEvent(
  event: NormalizationInput,
  options: NormalizationOptions = {},
): NormalizedMemory {
  if (event.kind !== EventKind.MEMORY && event.kind !== "memory") {
    throw IntegrationHubError.unsupportedKind(String(event.kind), [EventKind.MEMORY]);
  }

  const payload = event.payload as Partial<MemoryEventPayload>;
  if (!payload?.text || typeof payload.text !== "string") {
    throw IntegrationHubError.missingField("payload.text");
  }

  const eventId = options.eventId ?? event.id ?? createStableEventId(event);
  const occurredAt = event.occurredAt ?? new Date().toISOString();
  const receivedAt = options.receivedAt ?? new Date().toISOString();
  const source = createSourceDescriptor(String(event.source), event.channel, payload.metadata);
  const scopes = createScopes(event, source);
  const domains = createDomains(event, payload);
  const content = createContentBlocks(payload, options.contentHash);
  const visibility = getStringMetadata(payload.metadata, "visibility") ?? "shared";

  const canonicalEvent: CanonicalMemoryEvent = {
    id: eventId,
    kind: "memory.ingested",
    source,
    actor: {
      type: source.type === "user" ? "user" : "agent",
      id: getStringMetadata(payload.metadata, "actorId") ?? source.id,
      source,
      metadata: pickMetadata(payload.metadata, ["actorRole", "actorName"]),
    },
    subject: event.repo
      ? { type: "repository", id: event.repo }
      : { type: "project", id: event.projectId },
    scopes,
    visibility,
    domains,
    content,
    occurredAt,
    receivedAt,
    confidence: String(event.confidence),
    tags: payload.tags ?? [],
    metadata: {
      channel: event.channel,
      projectId: event.projectId,
      sessionId: event.sessionId,
      taskId: event.taskId,
      repo: event.repo,
      entityRefs: event.entityRefs,
      sourceMetadata: payload.metadata ?? {},
      filePath: payload.file_path,
      category: payload.category,
    },
    provenance: {
      sourceEventId: eventId,
      observedAt: occurredAt,
      ingestedAt: receivedAt,
      metadata: payload.metadata ?? {},
    },
  };

  const eventValidation = validateCanonicalMemoryEvent(canonicalEvent);
  if (!eventValidation.success) {
    throw IntegrationHubError.invalidEvent([eventValidation.error ?? "Invalid canonical event"]);
  }

  const memoryObject = buildMemoryObjectFromEvent(canonicalEvent, {
    state: "raw",
    contentHash: options.contentHash,
  });

  return { canonicalEvent, memoryObject };
}

export function buildMemoryObjectFromEvent(
  event: CanonicalMemoryEvent,
  options: { state?: string; contentHash?: string } = {},
): MemoryObject {
  const now = event.receivedAt;
  const memoryObject: MemoryObject = {
    id: `mem_${event.id}`,
    kind: "evidence",
    source: event.source,
    actor: event.actor,
    subject: event.subject,
    scopes: event.scopes,
    visibility: event.visibility,
    domains: event.domains,
    state: options.state ?? "raw",
    content: event.content.map((block, index) => ({
      ...block,
      ...(index === 0 && options.contentHash ? { hash: options.contentHash } : {}),
    })),
    provenance: {
      ingestedAt: event.provenance?.ingestedAt ?? event.receivedAt,
      observedAt: event.provenance?.observedAt ?? event.occurredAt,
      sourceEventId: event.id,
      metadata: event.provenance?.metadata ?? {},
    },
    tags: event.tags,
    metadata: event.metadata,
    createdAt: now,
    updatedAt: now,
  };

  const validation = validateMemoryObject(memoryObject);
  if (!validation.success) {
    throw IntegrationHubError.invalidEvent([validation.error ?? "Invalid memory object"]);
  }

  return memoryObject;
}

export function createSourceDescriptor(
  rawSource: string,
  channel?: string,
  metadata?: Record<string, unknown>,
): SourceDescriptor {
  const normalized = rawSource.toLowerCase();
  const knownTypeBySource: Record<string, SourceDescriptor["type"]> = {
    [EventSource.HERMES]: "agent",
    [EventSource.CLI]: "cli",
    [EventSource.MCP]: "mcp",
    [EventSource.IDE]: "ide",
    [EventSource.EXTERNAL]: "external",
    gemini: "agent",
    codex: "agent",
    scanner: "scanner",
  };

  return {
    type: knownTypeBySource[normalized] ?? normalized,
    id: normalized,
    vendor: normalized === "gemini" ? "google" : getStringMetadata(metadata, "vendor"),
    name: getStringMetadata(metadata, "sourceName") ?? channel,
    metadata: {
      channel,
      rawSource,
      ...(metadata ?? {}),
    },
  };
}

function createScopes(event: NormalizationInput, source: SourceDescriptor): ScopeRef[] {
  const scopes: ScopeRef[] = [{ type: "project", id: event.projectId }];
  if (source.type === "agent" || source.type === "cli" || source.type === "mcp" || source.type === "ide") {
    scopes.unshift({ type: "agent", id: source.id });
  }
  if (event.sessionId) scopes.push({ type: "session", id: event.sessionId });
  if (event.taskId) scopes.push({ type: "task", id: event.taskId });
  if (event.repo) scopes.push({ type: "workspace", id: event.repo });
  return dedupeScopes(scopes);
}

function createDomains(event: NormalizationInput, payload: Partial<MemoryEventPayload>): DomainRef[] {
  const domains: DomainRef[] = [];

  if (payload.file_path) {
    domains.push({ type: "code-intelligence", subtype: "file" });
  }

  if (event.sessionId || event.taskId) {
    domains.push({ type: "task-session" });
  }

  if (payload.category?.includes("preference") || payload.category?.includes("habit")) {
    domains.push({ type: "habit-convention", subtype: payload.category });
  }

  domains.push({ type: "project-knowledge", subtype: payload.category });
  return dedupeDomains(domains);
}

function createContentBlocks(payload: Partial<MemoryEventPayload>, contentHash?: string): ContentBlock[] {
  return [
    {
      type: payload.file_path ? "code" : "text",
      text: payload.text,
      hash: contentHash,
      metadata: {
        filePath: payload.file_path,
        category: payload.category,
      },
    },
  ];
}

function createStableEventId(event: NormalizationInput): string {
  return `evt_${event.source}_${event.channel}_${Date.now()}`;
}

function getStringMetadata(metadata: Record<string, unknown> | undefined, key: string): string | undefined {
  const value = metadata?.[key];
  return typeof value === "string" ? value : undefined;
}

function pickMetadata(metadata: Record<string, unknown> | undefined, keys: string[]): Record<string, unknown> | undefined {
  if (!metadata) return undefined;
  const picked: Record<string, unknown> = {};
  for (const key of keys) {
    if (metadata[key] !== undefined) picked[key] = metadata[key];
  }
  return Object.keys(picked).length > 0 ? picked : undefined;
}

function dedupeScopes(scopes: ScopeRef[]): ScopeRef[] {
  const seen = new Set<string>();
  return scopes.filter((scope) => {
    const key = `${scope.type}:${scope.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function dedupeDomains(domains: DomainRef[]): DomainRef[] {
  const seen = new Set<string>();
  return domains.filter((domain) => {
    const key = `${domain.type}:${domain.subtype ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
