/**
 * Event Projector
 *
 * 将外部事件投影到 Text2Mem 指令
 */

import { MemoOp } from "@memohub/protocol";
import { MemoHubEvent, EventKind, MemoryEventPayload } from "@memohub/protocol";
import { IntegrationHubError } from "@memohub/protocol";

export interface ProjectionResult {
  instruction: any;
  metadata: {
    eventId: string;
    kind: EventKind;
    contentHash?: string;
  };
}

/**
 * 事件投影器
 *
 * 负责将 MemoHubEvent 转换为 Text2Mem 指令
 */
export class EventProjector {
  /**
   * 投影 memory 事件到 Text2Mem 指令
   */
  async projectMemoryEvent(event: MemoHubEvent, contentHash?: string): Promise<any> {
    // 验证事件类型
    if (event.kind !== EventKind.MEMORY) {
      throw IntegrationHubError.unsupportedKind(
        event.kind,
        [EventKind.MEMORY]
      );
    }

    // 验证 payload
    const payload = event.payload as MemoryEventPayload;
    if (!payload.text) {
      throw IntegrationHubError.missingField("payload.text");
    }

    // 构建内部 Text2Mem 指令。新架构不再允许外部事件通过 metadata.trackId
    // 覆盖投影目标，具体存储投影由 domain policy/QueryPlanner 上层模型决定。
    const instruction = {
      op: MemoOp.ADD,
      payload: {
        text: payload.text,
        // CAS 引用（如果提供）
        ...(contentHash && { contentHash }),
        ...(payload.file_path && { file_path: payload.file_path }),
        ...(payload.category && { category: payload.category }),
        // 事件元数据
        source: event.source,
        channel: event.channel,
        kind: EventKind.MEMORY,
        projectId: event.projectId,
        sessionId: event.sessionId,
        taskId: event.taskId,
        confidence: event.confidence,
        occurredAt: event.occurredAt || new Date().toISOString(),
        tags: payload.tags || [],
        metadata: payload.metadata || {}
      },
      context: {
        source: event.source,
        channel: event.channel,
        sessionId: event.sessionId,
        taskId: event.taskId
      }
    };

    return instruction;
  }

  /**
   * 投影事件（未来扩展）
   */
  async projectEvent(event: MemoHubEvent, contentHash?: string): Promise<any> {
    switch (event.kind) {
      case EventKind.MEMORY:
        return this.projectMemoryEvent(event, contentHash);

      // 未来扩展：
      // case EventKind.REPO_ANALYSIS:
      //   return this.projectRepoAnalysisEvent(event, contentHash);
      // case EventKind.API_CAPABILITY:
      //   return this.projectApiCapabilityEvent(event, contentHash);
      // case EventKind.SESSION_STATE:
      //   return this.projectSessionStateEvent(event, contentHash);
      // case EventKind.BUSINESS_CONTEXT:
      //   return this.projectBusinessContextEvent(event, contentHash);
      // case EventKind.HABIT:
      //   return this.projectHabitEvent(event, contentHash);

      default:
        throw IntegrationHubError.unsupportedKind(
          event.kind,
          [EventKind.MEMORY]
        );
    }
  }
}
