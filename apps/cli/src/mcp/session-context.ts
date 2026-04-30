import type { ChannelRegistryEntry } from "../channel-registry.js";

export interface McpBoundChannelContext {
  channelId: string;
  ownerActorId: string;
  source: string;
  projectId: string;
  workspaceId?: string;
  sessionId?: string;
  taskId?: string;
  purpose: string;
}

/**
 * 当前实现先使用进程内最近绑定上下文，满足 Hermes 连续调用链路。
 * 后续如果需要连接级隔离，再把它升级到 transport/session 维度。
 */
export class McpSessionContextStore {
  private activeContext: McpBoundChannelContext | null = null;

  setFromEntry(entry: ChannelRegistryEntry): McpBoundChannelContext {
    this.activeContext = {
      channelId: entry.channelId,
      ownerActorId: entry.ownerActorId,
      source: entry.source,
      projectId: entry.projectId,
      workspaceId: entry.workspaceId,
      sessionId: entry.sessionId,
      taskId: entry.taskId,
      purpose: entry.purpose,
    };
    return this.activeContext;
  }

  get(): McpBoundChannelContext | null {
    return this.activeContext;
  }

  clear(channelId?: string): void {
    if (!channelId || this.activeContext?.channelId === channelId) {
      this.activeContext = null;
    }
  }
}
