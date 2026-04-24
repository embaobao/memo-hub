import { EventEmitter } from "node:events";
/**
 * PipelineEventBus：统一事件流出口
 *
 * 设计目标：
 * - 管道执行过程中，每个阶段的开始/成功/失败都会在这里发出事件
 * - 上层（CLI/MCP/后台任务）可订阅这些事件做观测、调试与回放
 * - 本期仅提供内存级事件流；持久化队列在后续任务接入
 */
export class PipelineEventBus {
    emitter = new EventEmitter();
    on(eventName, handler) {
        this.emitter.on(eventName, handler);
        return () => this.emitter.off(eventName, handler);
    }
    emit(payload) {
        this.emitter.emit(payload.name, payload);
    }
}
//# sourceMappingURL=event-bus.js.map