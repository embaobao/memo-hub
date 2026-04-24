import type { MemoIngestRequest, MemoRecord, PipelineStage, RoutingConfig } from "../../types/index.js";
import type { PipelineEventBus } from "../event-bus.js";
import type { TrackRegistry } from "../track-registry.js";
import type { ContentAddressableStorage } from "../../core/cas.js";
export interface IngestionPipeOptions {
    registry: TrackRegistry;
    eventBus?: PipelineEventBus;
    cas?: ContentAddressableStorage;
    routing?: RoutingConfig;
}
/**
 * IngestionPipe：写入管骨架
 *
 * 本期目标：
 * - 搭建“可插拔阶段 + 事件流”的最小闭环
 * - 通过 Provider 适配器接入既有 GBrain/ClawMem，实现不退化写入
 *
 * 注意：
 * - 路由规则/CAS/AST/实体抽取等增强能力在后续任务逐步接入
 */
export declare class IngestionPipe {
    private pipe;
    constructor(options: IngestionPipeOptions);
    get events(): PipelineEventBus;
    use<TInput, TOutput>(stage: PipelineStage<TInput, TOutput>): this;
    run(request: MemoIngestRequest): Promise<MemoRecord>;
}
//# sourceMappingURL=ingestion-pipe.d.ts.map