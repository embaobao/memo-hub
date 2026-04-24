import { EventEmitter } from "node:events";
import type { MemoContext } from "../types/index.js";
export type PipelineEventName = "pipe_start" | "pipe_success" | "pipe_error" | "stage_start" | "stage_success" | "stage_error"
/**
 * 治理管域事件：发现候选冲突，等待裁决
 *
 * 说明：
 * - 这类事件不属于“阶段执行生命周期事件”，但复用同一事件总线便于上层统一订阅
 * - payload.output 通常会承载 MemoConflictPendingEvent
 */
 | "CONFLICT_PENDING";
export interface PipelineEventPayload {
    name: PipelineEventName;
    pipe: string;
    stage?: string;
    timestamp: string;
    context?: MemoContext;
    input?: unknown;
    output?: unknown;
    error?: unknown;
}
/**
 * PipelineEventBus：统一事件流出口
 *
 * 设计目标：
 * - 管道执行过程中，每个阶段的开始/成功/失败都会在这里发出事件
 * - 上层（CLI/MCP/后台任务）可订阅这些事件做观测、调试与回放
 * - 本期仅提供内存级事件流；持久化队列在后续任务接入
 */
export declare class PipelineEventBus {
    private emitter;
    on(eventName: PipelineEventName, handler: (payload: PipelineEventPayload) => void): () => EventEmitter<[never]>;
    emit(payload: PipelineEventPayload): void;
}
//# sourceMappingURL=event-bus.d.ts.map