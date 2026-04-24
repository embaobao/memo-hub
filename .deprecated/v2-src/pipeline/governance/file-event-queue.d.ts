/**
 * 持久化事件信封（NDJSON 单行写入）
 *
 * 设计目标：
 * - 事件写入“本地文件队列”，便于后续 Agent/后台任务用 tail/订阅方式消费
 * - 采用 NDJSON：一行一个 JSON 对象，天然支持追加写入与流式读取
 */
export interface PersistedEventEnvelope<TPayload> {
    id: string;
    type: string;
    timestamp: string;
    payload: TPayload;
}
export interface GovernanceEventQueue {
    append<TPayload>(event: PersistedEventEnvelope<TPayload>): Promise<void>;
    getPath(): string;
}
/**
 * FileGovernanceEventQueue：最小可用的“本地文件队列”
 *
 * 说明：
 * - 该实现只负责“追加写”，不负责消费/ACK（后续可演进为真正队列）
 * - 为了兼容现有系统：写入失败不会在治理阶段抛错（由调用方决定是否吞错）
 */
export declare class FileGovernanceEventQueue implements GovernanceEventQueue {
    private filePath;
    private ensureReadyPromise;
    constructor(options: {
        filePath: string;
    });
    getPath(): string;
    append<TPayload>(event: PersistedEventEnvelope<TPayload>): Promise<void>;
    private ensureReady;
}
//# sourceMappingURL=file-event-queue.d.ts.map