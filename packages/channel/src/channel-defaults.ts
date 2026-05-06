import type { ChannelOpenRequest, ChannelPurpose, WorkspaceChannelBindingInput } from "./channel-types.js";
import { createWorkspaceChannelId } from "./channel-registry.js";

export const HERMES_ACTOR_ID = "hermes";
export const HERMES_SOURCE_ID = "hermes";
export const DEFAULT_CHANNEL_PURPOSE: ChannelPurpose = "primary";

export function createHermesChannelOpenRequest(input: {
  projectId: string;
  purpose?: ChannelPurpose;
  sessionId?: string;
  workspaceId?: string;
  taskId?: string;
  channelId?: string;
  metadata?: Record<string, unknown>;
}): ChannelOpenRequest {
  return {
    actorId: HERMES_ACTOR_ID,
    source: HERMES_SOURCE_ID,
    purpose: input.purpose ?? DEFAULT_CHANNEL_PURPOSE,
    projectId: input.projectId,
    sessionId: input.sessionId,
    workspaceId: input.workspaceId,
    taskId: input.taskId,
    channelId: input.channelId,
    metadata: input.metadata,
    isPrimary: (input.purpose ?? DEFAULT_CHANNEL_PURPOSE) === "primary",
  };
}

export function createWorkspacePrimaryChannelOpenRequest(
  input: WorkspaceChannelBindingInput,
): ChannelOpenRequest {
  return {
    actorId: input.actorId ?? input.source,
    source: input.source,
    purpose: "primary",
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    sessionId: input.sessionId,
    taskId: input.taskId,
    metadata: { autoBound: true, bindingKind: "workspace" },
    channelId: createWorkspaceChannelId(input.source, input.projectId),
    isPrimary: true,
  };
}
