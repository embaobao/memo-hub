import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

export const CHANNEL_PURPOSES = ["primary", "session", "test", "adapter", "import"] as const;
export type ChannelPurpose = typeof CHANNEL_PURPOSES[number];

export const CHANNEL_STATUSES = ["active", "idle", "closed", "archived"] as const;
export type ChannelStatus = typeof CHANNEL_STATUSES[number];

export interface ChannelRegistryEntry {
  channelId: string;
  ownerActorId: string;
  source: string;
  purpose: ChannelPurpose;
  projectId: string;
  workspaceId?: string;
  sessionId?: string;
  taskId?: string;
  status: ChannelStatus;
  isPrimary: boolean;
  createdAt: string;
  lastSeenAt: string;
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface ChannelOpenRequest {
  channelId?: string;
  ownerActorId: string;
  source: string;
  purpose: ChannelPurpose;
  projectId: string;
  workspaceId?: string;
  sessionId?: string;
  taskId?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  isPrimary?: boolean;
}

export interface ChannelListFilters {
  ownerActorId?: string;
  source?: string;
  projectId?: string;
  workspaceId?: string;
  purpose?: ChannelPurpose;
  status?: ChannelStatus;
}

type ChannelRegistryState = {
  version: 1;
  entries: ChannelRegistryEntry[];
};

const DEFAULT_STATE: ChannelRegistryState = {
  version: 1,
  entries: [],
};

/**
 * 渠道注册表是接入治理状态，不和自由记忆正文混存。
 */
export class ChannelRegistry {
  constructor(private readonly registryPath: string) {}

  initialize(): void {
    const root = dirname(this.registryPath);
    mkdirSync(root, { recursive: true });
    if (!existsSync(this.registryPath)) {
      writeFileSync(this.registryPath, JSON.stringify(DEFAULT_STATE, null, 2), "utf8");
    }
  }

  get path(): string {
    return this.registryPath;
  }

  list(filters: ChannelListFilters = {}): ChannelRegistryEntry[] {
    return this.readState().entries
      .filter((entry) => {
        if (filters.ownerActorId && entry.ownerActorId !== filters.ownerActorId) return false;
        if (filters.source && entry.source !== filters.source) return false;
        if (filters.projectId && entry.projectId !== filters.projectId) return false;
        if (filters.workspaceId && entry.workspaceId !== filters.workspaceId) return false;
        if (filters.purpose && entry.purpose !== filters.purpose) return false;
        if (filters.status && entry.status !== filters.status) return false;
        return true;
      })
      .sort((left, right) => right.lastSeenAt.localeCompare(left.lastSeenAt));
  }

  get(channelId: string): ChannelRegistryEntry | undefined {
    return this.readState().entries.find((entry) => entry.channelId === channelId);
  }

  has(channelId: string): boolean {
    return Boolean(this.get(channelId));
  }

  open(request: ChannelOpenRequest): { reused: boolean; entry: ChannelRegistryEntry } {
    this.assertOpenRequest(request);
    const state = this.readState();
    const now = new Date().toISOString();
    const isPrimary = request.isPrimary ?? request.purpose === "primary";
    const existingPrimary = isPrimary
      ? state.entries.find((entry) =>
        entry.ownerActorId === request.ownerActorId &&
        entry.projectId === request.projectId &&
        (entry.workspaceId ?? "") === (request.workspaceId ?? "") &&
        entry.purpose === "primary" &&
        entry.status === "active")
      : undefined;

    if (existingPrimary) {
      existingPrimary.lastSeenAt = now;
      if (request.sessionId) existingPrimary.sessionId = request.sessionId;
      if (request.taskId) existingPrimary.taskId = request.taskId;
      existingPrimary.metadata = {
        ...existingPrimary.metadata,
        ...request.metadata,
      };
      this.writeState(state);
      return { reused: true, entry: existingPrimary };
    }

    const channelId = request.channelId ?? createChannelId(request);
    const existing = state.entries.find((entry) => entry.channelId === channelId);
    if (existing) {
      existing.status = "active";
      existing.lastSeenAt = now;
      existing.metadata = {
        ...existing.metadata,
        ...request.metadata,
      };
      this.writeState(state);
      return { reused: true, entry: existing };
    }

    const entry: ChannelRegistryEntry = {
      channelId,
      ownerActorId: request.ownerActorId,
      source: request.source,
      purpose: request.purpose,
      projectId: request.projectId,
      workspaceId: request.workspaceId,
      sessionId: request.sessionId,
      taskId: request.taskId,
      status: "active",
      isPrimary,
      createdAt: now,
      lastSeenAt: now,
      tags: request.tags ?? [],
      metadata: request.metadata ?? {},
    };
    state.entries.push(entry);
    this.writeState(state);
    return { reused: false, entry };
  }

  use(channelId: string): ChannelRegistryEntry {
    const state = this.readState();
    const entry = state.entries.find((item) => item.channelId === channelId);
    if (!entry) throw new Error(`Unknown channel: ${channelId}`);
    entry.status = "active";
    entry.lastSeenAt = new Date().toISOString();
    this.writeState(state);
    return entry;
  }

  close(channelId: string): ChannelRegistryEntry {
    const state = this.readState();
    const entry = state.entries.find((item) => item.channelId === channelId);
    if (!entry) throw new Error(`Unknown channel: ${channelId}`);
    entry.status = "closed";
    entry.lastSeenAt = new Date().toISOString();
    this.writeState(state);
    return entry;
  }

  autoBindWorkspaceChannel(input: {
    source: string;
    ownerActorId?: string;
    projectId: string;
    workspaceId: string;
    sessionId?: string;
    taskId?: string;
  }): { reused: boolean; entry: ChannelRegistryEntry } {
    const ownerActorId = input.ownerActorId ?? input.source;
    return this.open({
      ownerActorId,
      source: input.source,
      purpose: "primary",
      projectId: input.projectId,
      workspaceId: input.workspaceId,
      sessionId: input.sessionId,
      taskId: input.taskId,
      metadata: { autoBound: true, bindingKind: "workspace" },
      channelId: createWorkspaceChannelId(input.source, input.projectId),
      isPrimary: true,
    });
  }

  private readState(): ChannelRegistryState {
    this.initialize();
    const raw = readFileSync(this.registryPath, "utf8");
    try {
      return JSON.parse(raw) as ChannelRegistryState;
    } catch {
      return DEFAULT_STATE;
    }
  }

  private writeState(state: ChannelRegistryState): void {
    const root = dirname(this.registryPath);
    mkdirSync(root, { recursive: true });
    writeFileSync(this.registryPath, JSON.stringify(state, null, 2), "utf8");
  }

  private assertOpenRequest(request: ChannelOpenRequest): void {
    if (!request.ownerActorId.trim()) throw new Error("ownerActorId is required.");
    if (!request.source.trim()) throw new Error("source is required.");
    if (!request.projectId.trim()) throw new Error("projectId is required.");
    if (!CHANNEL_PURPOSES.includes(request.purpose)) throw new Error(`Unsupported channel purpose: ${request.purpose}`);
    if (request.channelId && !isValidChannelId(request.channelId)) {
      throw new Error(`Invalid channelId: ${request.channelId}`);
    }
  }
}

export function isValidChannelId(value: string): boolean {
  return /^[a-z0-9_-]+(?::[a-z0-9._-]+){1,5}$/i.test(value.trim());
}

export function createChannelId(request: ChannelOpenRequest): string {
  const segments = [request.source, request.purpose, request.projectId];
  if (request.workspaceId && request.purpose === "primary") {
    segments.push(request.workspaceId);
  } else if (request.sessionId && request.purpose === "session") {
    segments.push(request.sessionId);
  } else if (request.taskId) {
    segments.push(request.taskId);
  } else if (request.purpose === "test") {
    segments.push("manual");
  }
  return segments.map(slugify).filter(Boolean).join(":");
}

export function createWorkspaceChannelId(source: string, projectId: string): string {
  return [source, "workspace", projectId].map(slugify).join(":");
}

function slugify(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
}
