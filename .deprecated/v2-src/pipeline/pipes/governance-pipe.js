import { BasePipe } from "../base-pipe.js";
import { detectConflicts } from "../governance/conflict-detector.js";
import { FileGovernanceEventQueue } from "../governance/file-event-queue.js";
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
export class GovernancePipe {
    pipe;
    constructor(options = {}) {
        const { eventBus, conflict, queue } = options ?? {};
        this.pipe = new BasePipe({
            name: "governance",
            eventBus,
        });
        const conflictConfig = resolveConflictDetectionConfig(conflict);
        const eventQueue = queue ??
            new FileGovernanceEventQueue({
                filePath: conflictConfig.queue_path,
            });
        const conflictDetectorStage = {
            name: "conflict_detector",
            run: async (input, context) => {
                const { records = [], context: requestContext } = input ?? {};
                const mergedContext = requestContext ?? context;
                const [anchor, ...candidates] = records ?? [];
                if (!anchor) {
                    return { conflicts: [] };
                }
                const pending = detectConflicts({
                    anchor,
                    candidates,
                    context: mergedContext,
                    config: conflictConfig,
                });
                if (!pending) {
                    return { conflicts: [] };
                }
                /**
                 * 事件发出两次：
                 * 1) 事件总线：便于运行态订阅（UI/日志/Agent）
                 * 2) 文件队列：便于后续异步消费（回放/离线裁决）
                 */
                this.pipe.events.emit({
                    name: "CONFLICT_PENDING",
                    pipe: "governance",
                    stage: "conflict_detector",
                    timestamp: new Date().toISOString(),
                    context: mergedContext,
                    output: pending,
                });
                try {
                    await eventQueue.append({
                        id: pending.id,
                        type: pending.name,
                        timestamp: pending.timestamp,
                        payload: pending,
                    });
                }
                catch {
                    // 队列写入失败不阻塞治理管（兼容性优先）
                }
                return { conflicts: [pending] };
            },
        };
        this.pipe.use(conflictDetectorStage);
    }
    get events() {
        return this.pipe.events;
    }
    use(stage) {
        this.pipe.use(stage);
        return this;
    }
    async run(request) {
        const { context } = request ?? {};
        return this.pipe.run(request, context);
    }
}
function resolveConflictDetectionConfig(override) {
    /**
     * 默认队列路径：
     * - 与项目其它数据文件保持同一目录层级（~/.hermes/data）
     * - 文件格式为 NDJSON，便于 tail/grep/流式消费
     */
    const defaultQueuePath = "~/.hermes/data/memohub-conflicts.ndjson";
    const resolved = {
        enabled: true,
        threshold: 0.9,
        strategy: "jaccard",
        min_text_length: 12,
        max_candidates: 5,
        queue_path: defaultQueuePath,
        ...(override ?? {}),
    };
    /**
     * 环境变量覆盖（优先级最高）：
     * - MEMOHUB_CONFLICT_ENABLED：true/false（或 1/0）
     * - MEMOHUB_CONFLICT_THRESHOLD：0~1
     * - MEMOHUB_CONFLICT_STRATEGY：jaccard/contains
     * - MEMOHUB_CONFLICT_QUEUE_PATH：NDJSON 文件路径
     */
    const enabledRaw = String(process.env.MEMOHUB_CONFLICT_ENABLED ?? "").trim().toLowerCase();
    if (enabledRaw) {
        const truthy = enabledRaw === "1" || enabledRaw === "true" || enabledRaw === "yes" || enabledRaw === "on";
        const falsy = enabledRaw === "0" || enabledRaw === "false" || enabledRaw === "no" || enabledRaw === "off";
        if (truthy) {
            resolved.enabled = true;
        }
        else if (falsy) {
            resolved.enabled = false;
        }
    }
    const thresholdRaw = String(process.env.MEMOHUB_CONFLICT_THRESHOLD ?? "").trim();
    if (thresholdRaw) {
        const v = Number(thresholdRaw);
        if (Number.isFinite(v)) {
            resolved.threshold = Math.max(0, Math.min(1, v));
        }
    }
    const strategyRaw = String(process.env.MEMOHUB_CONFLICT_STRATEGY ?? "").trim().toLowerCase();
    if (strategyRaw === "jaccard" || strategyRaw === "contains") {
        resolved.strategy = strategyRaw;
    }
    const queuePathRaw = String(process.env.MEMOHUB_CONFLICT_QUEUE_PATH ?? "").trim();
    if (queuePathRaw) {
        resolved.queue_path = queuePathRaw;
    }
    const minLenRaw = String(process.env.MEMOHUB_CONFLICT_MIN_TEXT_LENGTH ?? "").trim();
    if (minLenRaw) {
        const v = Number(minLenRaw);
        if (Number.isFinite(v) && v >= 0) {
            resolved.min_text_length = Math.floor(v);
        }
    }
    const maxCandidatesRaw = String(process.env.MEMOHUB_CONFLICT_MAX_CANDIDATES ?? "").trim();
    if (maxCandidatesRaw) {
        const v = Number(maxCandidatesRaw);
        if (Number.isFinite(v) && v >= 1) {
            resolved.max_candidates = Math.floor(v);
        }
    }
    return resolved;
}
//# sourceMappingURL=governance-pipe.js.map