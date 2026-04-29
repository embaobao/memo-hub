import { z } from "zod";

export type MemoryKind = "evidence" | "memory" | "artifact" | string;
export type MemoryVisibility = "private" | "shared" | "global" | string;
export type MemoryState = "raw" | "curated" | "conflicted" | "archived" | string;

export interface SourceDescriptor {
  type: "agent" | "ide" | "cli" | "mcp" | "scanner" | "document" | "user" | "external" | string;
  id: string;
  name?: string;
  vendor?: string;
  metadata?: Record<string, unknown>;
}

export interface ActorDescriptor {
  type: "agent" | "user" | "service" | string;
  id: string;
  name?: string;
  source?: SourceDescriptor;
  metadata?: Record<string, unknown>;
}

export interface SubjectDescriptor {
  type: "project" | "repository" | "file" | "symbol" | "task" | "session" | "agent" | "user" | string;
  id: string;
  name?: string;
  metadata?: Record<string, unknown>;
}

export interface ScopeRef {
  type: "agent" | "session" | "task" | "project" | "workspace" | "global" | string;
  id: string;
  metadata?: Record<string, unknown>;
}

export interface DomainRef {
  type: string;
  subtype?: string;
  metadata?: Record<string, unknown>;
}

export interface ContentBlock {
  type: "text" | "json" | "markdown" | "code" | "binary_ref" | string;
  text?: string;
  data?: unknown;
  uri?: string;
  mimeType?: string;
  hash?: string;
  metadata?: Record<string, unknown>;
}

export interface LinkRef {
  type: "relates_to" | "derived_from" | "supersedes" | "conflicts_with" | "supports" | string;
  targetId: string;
  targetKind?: string;
  metadata?: Record<string, unknown>;
}

export interface ClaimRef {
  id?: string;
  text: string;
  subject?: SubjectDescriptor;
  confidence?: number;
  metadata?: Record<string, unknown>;
}

export interface EmbeddingRef {
  id?: string;
  contentIndex?: number;
  model?: string;
  dimensions?: number;
  vectorRef?: string;
  metadata?: Record<string, unknown>;
}

export interface Provenance {
  ingestedAt: string;
  observedAt?: string;
  sourceEventId?: string;
  traceId?: string;
  operationId?: string;
  parentIds?: string[];
  metadata?: Record<string, unknown>;
}

export interface MemoryObject {
  id: string;
  kind: MemoryKind;
  source: SourceDescriptor;
  actor?: ActorDescriptor;
  subject?: SubjectDescriptor;
  scopes: ScopeRef[];
  visibility: MemoryVisibility;
  domains: DomainRef[];
  state: MemoryState;
  content: ContentBlock[];
  links?: LinkRef[];
  claims?: ClaimRef[];
  embeddings?: EmbeddingRef[];
  provenance: Provenance;
  tags?: string[];
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CanonicalMemoryEvent {
  id: string;
  kind: string;
  source: SourceDescriptor;
  actor?: ActorDescriptor;
  subject?: SubjectDescriptor;
  scopes: ScopeRef[];
  visibility: MemoryVisibility;
  domains: DomainRef[];
  content: ContentBlock[];
  occurredAt: string;
  receivedAt: string;
  confidence?: "reported" | "observed" | "inferred" | "provisional" | "verified" | string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  provenance?: Partial<Provenance>;
}

const MetadataSchema = z.record(z.any());

export const SourceDescriptorSchema = z.object({
  type: z.string().min(1),
  id: z.string().min(1),
  name: z.string().optional(),
  vendor: z.string().optional(),
  metadata: MetadataSchema.optional(),
});

export const ActorDescriptorSchema = z.object({
  type: z.string().min(1),
  id: z.string().min(1),
  name: z.string().optional(),
  source: SourceDescriptorSchema.optional(),
  metadata: MetadataSchema.optional(),
});

export const SubjectDescriptorSchema = z.object({
  type: z.string().min(1),
  id: z.string().min(1),
  name: z.string().optional(),
  metadata: MetadataSchema.optional(),
});

export const ScopeRefSchema = z.object({
  type: z.string().min(1),
  id: z.string().min(1),
  metadata: MetadataSchema.optional(),
});

export const DomainRefSchema = z.object({
  type: z.string().min(1),
  subtype: z.string().optional(),
  metadata: MetadataSchema.optional(),
});

export const ContentBlockSchema = z.object({
  type: z.string().min(1),
  text: z.string().optional(),
  data: z.unknown().optional(),
  uri: z.string().optional(),
  mimeType: z.string().optional(),
  hash: z.string().optional(),
  metadata: MetadataSchema.optional(),
}).refine((block) => block.text !== undefined || block.data !== undefined || block.uri !== undefined || block.hash !== undefined, {
  message: "content block must include text, data, uri, or hash",
});

export const LinkRefSchema = z.object({
  type: z.string().min(1),
  targetId: z.string().min(1),
  targetKind: z.string().optional(),
  metadata: MetadataSchema.optional(),
});

export const ClaimRefSchema = z.object({
  id: z.string().optional(),
  text: z.string().min(1),
  subject: SubjectDescriptorSchema.optional(),
  confidence: z.number().min(0).max(1).optional(),
  metadata: MetadataSchema.optional(),
});

export const EmbeddingRefSchema = z.object({
  id: z.string().optional(),
  contentIndex: z.number().int().nonnegative().optional(),
  model: z.string().optional(),
  dimensions: z.number().int().positive().optional(),
  vectorRef: z.string().optional(),
  metadata: MetadataSchema.optional(),
});

export const ProvenanceSchema = z.object({
  ingestedAt: z.string().min(1),
  observedAt: z.string().optional(),
  sourceEventId: z.string().optional(),
  traceId: z.string().optional(),
  operationId: z.string().optional(),
  parentIds: z.array(z.string()).optional(),
  metadata: MetadataSchema.optional(),
});

export const MemoryObjectSchema = z.object({
  id: z.string().min(1),
  kind: z.string().min(1),
  source: SourceDescriptorSchema,
  actor: ActorDescriptorSchema.optional(),
  subject: SubjectDescriptorSchema.optional(),
  scopes: z.array(ScopeRefSchema).min(1),
  visibility: z.string().min(1),
  domains: z.array(DomainRefSchema).min(1),
  state: z.string().min(1),
  content: z.array(ContentBlockSchema).min(1),
  links: z.array(LinkRefSchema).optional(),
  claims: z.array(ClaimRefSchema).optional(),
  embeddings: z.array(EmbeddingRefSchema).optional(),
  provenance: ProvenanceSchema,
  tags: z.array(z.string()).optional(),
  metadata: MetadataSchema.optional(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export const CanonicalMemoryEventSchema = z.object({
  id: z.string().min(1),
  kind: z.string().min(1),
  source: SourceDescriptorSchema,
  actor: ActorDescriptorSchema.optional(),
  subject: SubjectDescriptorSchema.optional(),
  scopes: z.array(ScopeRefSchema).min(1),
  visibility: z.string().min(1),
  domains: z.array(DomainRefSchema).min(1),
  content: z.array(ContentBlockSchema).min(1),
  occurredAt: z.string().min(1),
  receivedAt: z.string().min(1),
  confidence: z.string().optional(),
  tags: z.array(z.string()).optional(),
  metadata: MetadataSchema.optional(),
  provenance: ProvenanceSchema.partial().optional(),
});

export function validateMemoryObject(input: unknown): {
  success: boolean;
  data?: MemoryObject;
  error?: string;
} {
  const result = MemoryObjectSchema.safeParse(input);
  if (result.success) return { success: true, data: result.data as MemoryObject };
  return { success: false, error: formatZodIssues(result.error.issues) };
}

export function validateCanonicalMemoryEvent(input: unknown): {
  success: boolean;
  data?: CanonicalMemoryEvent;
  error?: string;
} {
  const result = CanonicalMemoryEventSchema.safeParse(input);
  if (result.success) return { success: true, data: result.data as CanonicalMemoryEvent };
  return { success: false, error: formatZodIssues(result.error.issues) };
}

function formatZodIssues(issues: z.ZodIssue[]): string {
  return issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
}
