import type { ConflictDetectionConfig, MemoGovernanceRequest, MemoGovernanceResult, PipelineStage } from "../../types/index.js";
import type { PipelineEventBus } from "../event-bus.js";
import type { GovernanceEventQueue } from "../governance/file-event-queue.js";
/**
 * GovernancePipe：治理管（冲突检测 + 澄清闸门骨架）
 *
 * 本期（Task8）目标：
 * - 定义冲突事件 CONFLICT_PENDING，并在检测到候选冲突时发出事件
 * - 实现最小冲突检测规则（阈值/策略可配置）
 * - 将冲突事件写入可持久化存储/队列（本地文件 NDJSON）
 *
 * 兼容性说明：
 * - 治理管目前不强制接入写入链路，避免改变 CLI/MCP 的既有行为
 * - 队列写入失败不会抛错中断管道（治理是增强能力，优先保证主流程可用）
 */
export declare class GovernancePipe {
    private pipe;
    constructor(options?: {
        eventBus?: PipelineEventBus;
        conflict?: Partial<ConflictDetectionConfig>;
        queue?: GovernanceEventQueue;
    });
    get events(): PipelineEventBus;
    use<TInput, TOutput>(stage: PipelineStage<TInput, TOutput>): this;
    run(request: MemoGovernanceRequest): Promise<MemoGovernanceResult>;
}
//# sourceMappingURL=governance-pipe.d.ts.map