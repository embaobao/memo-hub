import type { ConflictDetectionConfig, MemoConflictPendingEvent, MemoContext, MemoRecord } from "../../types/index.js";
/**
 * 最小冲突检测器（纯函数）
 *
 * 输入约定：
 * - anchor：触发检测的锚点记录（通常是待写入的新内容）
 * - candidates：可能与之冲突的候选记录（通常来自检索/已有库）
 *
 * 输出约定：
 * - 无冲突：返回 null
 * - 有冲突：返回 CONFLICT_PENDING 事件（包含候选与解释信息）
 */
export declare function detectConflicts(options: {
    anchor: MemoRecord;
    candidates: MemoRecord[];
    context?: MemoContext;
    config: ConflictDetectionConfig;
}): MemoConflictPendingEvent | null;
//# sourceMappingURL=conflict-detector.d.ts.map