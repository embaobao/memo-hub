import type { MemoRetrieveRequest, MemoRecord, PipelineStage } from "../../types/index.js";
import type { PipelineEventBus } from "../event-bus.js";
import type { TrackRegistry } from "../track-registry.js";
import type { Hydrator } from "../../core/hydration.js";
export interface RetrievalPipeOptions {
    registry: TrackRegistry;
    eventBus?: PipelineEventBus;
    hydrator?: Hydrator;
}
/**
 * RetrievalPipe：检索管骨架
 *
 * 本期目标：
 * - 保留“统一请求 → 多 Provider 调用 → 合并装配”的结构
 * - Vector 召回为必选；FTS 召回为可选插槽（依赖不可用时默认关闭但结构完备）
 * - 产出阶段级事件流：Vector/FTS/装配/Hydration 都可观测、可回放
 */
export declare class RetrievalPipe {
    private pipe;
    constructor(options: RetrievalPipeOptions);
    get events(): PipelineEventBus;
    use<TInput, TOutput>(stage: PipelineStage<TInput, TOutput>): this;
    run(request: MemoRetrieveRequest): Promise<MemoRecord[]>;
}
//# sourceMappingURL=retrieval-pipe.d.ts.map