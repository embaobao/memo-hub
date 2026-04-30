import { MemoryObject, getDomainPolicy, isDefaultVisibleMemory } from "@memohub/protocol";

export interface MemoryVectorRecord {
  id: string;
  vector: number[];
  hash: string;
  track_id: string;
  entities: string[];
  timestamp: string;
  memory_id: string;
  content_index: number;
  scope_types: string[];
  scope_ids: string[];
  visibility: string;
  domain_types: string[];
  state: string;
  source_type: string;
  source_id: string;
  channel?: string;
  actor_id?: string;
  subject_id?: string;
  text?: string;
  tags?: string[];
  [key: string]: unknown;
}

export interface StructuredIndexEntry {
  sourceId: string;
  relation: string;
  targetId: string;
  metadata?: Record<string, unknown>;
}

export class InMemoryStructuredIndex {
  private entries: StructuredIndexEntry[] = [];

  add(entry: StructuredIndexEntry): void {
    this.entries.push(entry);
  }

  addMemoryObject(memory: MemoryObject): void {
    for (const link of memory.links ?? []) {
      this.add({
        sourceId: memory.id,
        relation: link.type,
        targetId: link.targetId,
        metadata: link.metadata,
      });
    }

    for (const scope of memory.scopes) {
      this.add({
        sourceId: memory.id,
        relation: `scope:${scope.type}`,
        targetId: scope.id,
        metadata: scope.metadata,
      });
    }
  }

  queryBySource(sourceId: string): StructuredIndexEntry[] {
    return this.entries.filter((entry) => entry.sourceId === sourceId);
  }

  queryByTarget(targetId: string): StructuredIndexEntry[] {
    return this.entries.filter((entry) => entry.targetId === targetId);
  }

  list(): StructuredIndexEntry[] {
    return [...this.entries];
  }
}

export async function createVectorRecordsFromMemoryObject(
  memory: MemoryObject,
  embed: (text: string) => Promise<number[]>,
): Promise<MemoryVectorRecord[]> {
  if (!isDefaultVisibleMemory(memory)) return [];

  const textBlocks = memory.content
    .map((block, index) => ({ block, index }))
    .filter(({ block }) => block.type === "text" || block.type === "markdown" || block.type === "code");

  const records: MemoryVectorRecord[] = [];
  for (const { block, index } of textBlocks) {
    const text = block.text ?? JSON.stringify(block.data ?? "");
    const vector = await embed(text);
    records.push({
      id: `${memory.id}:content:${index}`,
      vector,
      hash: block.hash ?? memory.provenance.sourceEventId ?? memory.id,
      track_id: domainToTransitionTrack(memory.domains[0]?.type),
      entities: [],
      timestamp: memory.createdAt,
      memory_id: memory.id,
      content_index: index,
      scope_types: memory.scopes.map((scope) => scope.type),
      scope_ids: memory.scopes.map((scope) => scope.id),
      visibility: memory.visibility,
      domain_types: memory.domains.map((domain) => domain.type),
      state: memory.state,
      source_type: memory.source.type,
      source_id: memory.source.id,
      channel: typeof memory.metadata?.channel === "string"
        ? memory.metadata.channel
        : typeof memory.source.metadata?.channel === "string"
          ? memory.source.metadata.channel
          : undefined,
      actor_id: memory.actor?.id,
      subject_id: memory.subject?.id,
      text,
      tags: memory.tags,
      category: memory.domains[0]?.subtype,
      operation_type: memory.metadata?.operationType,
      clarification_id: memory.metadata?.clarificationId,
      review_state: memory.metadata?.reviewState,
    });
  }

  return records;
}

export function domainToTransitionTrack(domain?: string): string {
  return getDomainPolicy(domain ?? "project-knowledge").transitionTrack;
}
