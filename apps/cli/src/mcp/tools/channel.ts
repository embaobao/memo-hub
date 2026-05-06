import { z } from "zod";
import { CHANNEL_PURPOSES, CHANNEL_STATUSES, type ChannelPurpose, type ChannelStatus } from "@memohub/channel";
import type { UnifiedMemoryRuntime } from "../../unified-memory-runtime.js";

export const ChannelOpenInputSchema = z.object({
  actorId: z.string().min(1).describe("渠道归属 Actor，例如 hermes"),
  source: z.string().min(1).describe("来源，例如 hermes 或 vscode"),
  projectId: z.string().min(1).describe("项目 ID"),
  purpose: z.enum(CHANNEL_PURPOSES).default("primary").describe("渠道用途"),
  workspaceId: z.string().optional().describe("工作区 ID"),
  sessionId: z.string().optional().describe("会话 ID"),
  taskId: z.string().optional().describe("任务 ID"),
  channelId: z.string().optional().describe("显式渠道 ID"),
});

export const ChannelListInputSchema = z.object({
  actorId: z.string().optional(),
  source: z.string().optional(),
  projectId: z.string().optional(),
  workspaceId: z.string().optional(),
  purpose: z.enum(CHANNEL_PURPOSES).optional(),
  status: z.enum(CHANNEL_STATUSES).optional(),
});

export const ChannelStatusInputSchema = z.object({
  channelId: z.string().min(1),
});

type ChannelOpenInput = z.infer<typeof ChannelOpenInputSchema>;
type ChannelListInput = z.infer<typeof ChannelListInputSchema>;
type ChannelStatusInput = z.infer<typeof ChannelStatusInputSchema>;

export function createChannelOpenHandler(runtime: UnifiedMemoryRuntime) {
  return async (params: ChannelOpenInput) => {
    const parsed = ChannelOpenInputSchema.safeParse(params);
    if (!parsed.success) return { success: false, error: "Invalid input schema", details: parsed.error.errors };
    try {
      const result = runtime.openChannel({
        ...parsed.data,
        purpose: parsed.data.purpose as ChannelPurpose,
        isPrimary: parsed.data.purpose === "primary",
      });
      return { success: true, reused: result.reused, entry: result.entry };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  };
}

export function createChannelListHandler(runtime: UnifiedMemoryRuntime) {
  return async (params: ChannelListInput = {}) => {
    const parsed = ChannelListInputSchema.safeParse(params);
    if (!parsed.success) return { success: false, error: "Invalid input schema", details: parsed.error.errors };
    return { success: true, entries: runtime.listChannels(parsed.data as { actorId?: string; source?: string; projectId?: string; workspaceId?: string; purpose?: ChannelPurpose; status?: ChannelStatus }) };
  };
}

export function createChannelStatusHandler(runtime: UnifiedMemoryRuntime) {
  return async (params: ChannelStatusInput) => {
    const parsed = ChannelStatusInputSchema.safeParse(params);
    if (!parsed.success) return { success: false, error: "Invalid input schema", details: parsed.error.errors };
    const entry = runtime.getChannel(parsed.data.channelId);
    if (!entry) return { success: false, error: `Unknown channel: ${parsed.data.channelId}` };
    return { success: true, entry };
  };
}

export function createChannelCloseHandler(runtime: UnifiedMemoryRuntime) {
  return async (params: ChannelStatusInput) => {
    const parsed = ChannelStatusInputSchema.safeParse(params);
    if (!parsed.success) return { success: false, error: "Invalid input schema", details: parsed.error.errors };
    try {
      const entry = runtime.closeChannel(parsed.data.channelId);
      return { success: true, entry };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  };
}

export function createChannelUseHandler(runtime: UnifiedMemoryRuntime) {
  return async (params: ChannelStatusInput) => {
    const parsed = ChannelStatusInputSchema.safeParse(params);
    if (!parsed.success) return { success: false, error: "Invalid input schema", details: parsed.error.errors };
    try {
      const entry = runtime.useChannel(parsed.data.channelId);
      return { success: true, entry };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  };
}
