export const CHANNEL_PURPOSES = ["primary", "session", "test", "connector", "import"] as const;
export type ChannelPurpose = typeof CHANNEL_PURPOSES[number];

export const CHANNEL_STATUSES = ["active", "idle", "closed", "archived"] as const;
export type ChannelStatus = typeof CHANNEL_STATUSES[number];

export interface ChannelRegistryEntry {
  channelId: string;
  actorId: string;
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
  actorId: string;
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
  actorId?: string;
  source?: string;
  projectId?: string;
  workspaceId?: string;
  purpose?: ChannelPurpose;
  status?: ChannelStatus;
}

export interface WorkspaceChannelBindingInput {
  source: string;
  actorId?: string;
  projectId: string;
  workspaceId: string;
  sessionId?: string;
  taskId?: string;
}
