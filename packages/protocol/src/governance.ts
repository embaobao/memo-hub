import { z } from "zod";
import { LinkRef, LinkRefSchema, MemoryObject, SourceDescriptor, SourceDescriptorSchema } from "./memory-object.js";

export type GovernanceState = "raw" | "curated" | "conflicted" | "archived" | string;
export type ReviewState = "proposed" | "accepted" | "rejected" | "needs_review" | string;
export type ClarificationStatus = "open" | "resolved" | "dismissed" | string;
export type ArtifactKind = "snapshot" | "backup" | "restore" | "wiki_export" | string;

export interface DomainPolicy {
  domain: string;
  transitionTrack: string;
  defaultVisibility: string;
  defaultState: GovernanceState;
  description: string;
}

export interface ClarificationItem {
  id: string;
  status: ClarificationStatus;
  question: string;
  reason: "conflict" | "gap" | string;
  memoryIds: string[];
  links?: LinkRef[];
  source?: SourceDescriptor;
  resolution?: {
    text: string;
    resolvedBy: string;
    resolvedAt: string;
  };
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface MemoryArtifact {
  id: string;
  kind: ArtifactKind;
  source: SourceDescriptor;
  memoryIds: string[];
  uri?: string;
  checksum?: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export const GOVERNANCE_STATES = ["raw", "curated", "conflicted", "archived"] as const;

export const DEFAULT_DOMAIN_POLICIES: Record<string, DomainPolicy> = {
  "code-intelligence": {
    domain: "code-intelligence",
    transitionTrack: "track-source",
    defaultVisibility: "shared",
    defaultState: "raw",
    description: "Code files, symbols, dependencies, APIs, and repository analysis.",
  },
  "project-knowledge": {
    domain: "project-knowledge",
    transitionTrack: "track-insight",
    defaultVisibility: "shared",
    defaultState: "raw",
    description: "Project facts, decisions, component responsibilities, and business context.",
  },
  "task-session": {
    domain: "task-session",
    transitionTrack: "track-stream",
    defaultVisibility: "private",
    defaultState: "raw",
    description: "Sessions, tasks, activities, execution traces, and recent work.",
  },
  "habit-convention": {
    domain: "habit-convention",
    transitionTrack: "track-wiki",
    defaultVisibility: "shared",
    defaultState: "raw",
    description: "Agent preferences, project conventions, team habits, and operating style.",
  },
};

export const DomainPolicySchema = z.object({
  domain: z.string().min(1),
  transitionTrack: z.string().min(1),
  defaultVisibility: z.string().min(1),
  defaultState: z.string().min(1),
  description: z.string().min(1),
});

export const ClarificationItemSchema = z.object({
  id: z.string().min(1),
  status: z.string().min(1),
  question: z.string().min(1),
  reason: z.string().min(1),
  memoryIds: z.array(z.string().min(1)).min(1),
  links: z.array(LinkRefSchema).optional(),
  source: SourceDescriptorSchema.optional(),
  resolution: z.object({
    text: z.string().min(1),
    resolvedBy: z.string().min(1),
    resolvedAt: z.string().min(1),
  }).optional(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export const MemoryArtifactSchema = z.object({
  id: z.string().min(1),
  kind: z.string().min(1),
  source: SourceDescriptorSchema,
  memoryIds: z.array(z.string().min(1)).min(1),
  uri: z.string().optional(),
  checksum: z.string().optional(),
  createdAt: z.string().min(1),
  metadata: z.record(z.any()).optional(),
});

export function getDomainPolicy(domain: string): DomainPolicy {
  return DEFAULT_DOMAIN_POLICIES[domain] ?? {
    domain,
    transitionTrack: "track-insight",
    defaultVisibility: "shared",
    defaultState: "raw",
    description: "Open domain routed through the default transition executor.",
  };
}

export function isDefaultVisibleMemory(memory: MemoryObject): boolean {
  return memory.state !== "archived";
}

export function createClarificationItem(input: {
  id: string;
  question: string;
  reason: "conflict" | "gap" | string;
  memoryIds: string[];
  source?: SourceDescriptor;
  metadata?: Record<string, unknown>;
  now?: string;
}): ClarificationItem {
  const now = input.now ?? new Date().toISOString();
  return {
    id: input.id,
    status: "open",
    question: input.question,
    reason: input.reason,
    memoryIds: input.memoryIds,
    source: input.source,
    metadata: input.metadata,
    createdAt: now,
    updatedAt: now,
  };
}

export function resolveClarificationItem(
  item: ClarificationItem,
  input: {
    text: string;
    resolvedBy: string;
    now?: string;
    metadata?: Record<string, unknown>;
  },
): ClarificationItem {
  const now = input.now ?? new Date().toISOString();
  return {
    ...item,
    status: "resolved",
    resolution: {
      text: input.text,
      resolvedBy: input.resolvedBy,
      resolvedAt: now,
    },
    metadata: {
      ...item.metadata,
      ...input.metadata,
    },
    updatedAt: now,
  };
}

export function createMemoryArtifact(input: {
  id: string;
  kind: ArtifactKind;
  source: SourceDescriptor;
  memoryIds: string[];
  uri?: string;
  checksum?: string;
  metadata?: Record<string, unknown>;
  now?: string;
}): MemoryArtifact {
  return {
    id: input.id,
    kind: input.kind,
    source: input.source,
    memoryIds: input.memoryIds,
    uri: input.uri,
    checksum: input.checksum,
    metadata: input.metadata,
    createdAt: input.now ?? new Date().toISOString(),
  };
}
