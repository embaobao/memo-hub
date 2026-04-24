import type { MemoConflictResolution, MemoGovernanceRequest, MemoGovernanceResult, MemoIngestRequest, MemoRecord, MemoRetrieveRequest, RoutingConfig, TrackProvider } from "../types/index.js";
import type { ContentAddressableStorage } from "../core/cas.js";
import { PipelineEventBus } from "./event-bus.js";
import { TrackRegistry } from "./track-registry.js";
import { GovernancePipe } from "./pipes/governance-pipe.js";
import { IngestionPipe } from "./pipes/ingestion-pipe.js";
import { RetrievalPipe } from "./pipes/retrieval-pipe.js";
export interface MemoEngineOptions {
    providers: TrackProvider[];
    cas?: ContentAddressableStorage;
    /**
     * 路由配置（可选）
     *
     * 说明：
     * - 由上层（CLI/MCP/后台任务）通过 ConfigManager 读取并传入
     * - 不传则使用写入管内置默认路由规则（保持兼容）
     */
    routing?: RoutingConfig;
}
/**
 * MemoEngine：反应式管道引擎（骨架）
 *
 * 设计目标：
 * - 三条管道并列存在：Ingestion / Retrieval / Governance
 * - 统一事件流出口：events（便于观测、调试、回放）
 * - 通过 TrackProvider 适配器接入现有轨道实现，避免一次性推倒重写
 */
export declare class MemoEngine {
    readonly events: PipelineEventBus;
    readonly registry: TrackRegistry;
    readonly ingestion: IngestionPipe;
    readonly retrieval: RetrievalPipe;
    readonly governance: GovernancePipe;
    constructor(options: MemoEngineOptions);
    initialize(): Promise<void>;
    ingest(request: MemoIngestRequest): Promise<MemoRecord>;
    retrieve(request: MemoRetrieveRequest): Promise<MemoRecord[]>;
    govern(request: MemoGovernanceRequest): Promise<MemoGovernanceResult>;
    /**
     * 冲突裁决回流入口（最小闭环）
     *
     * 设计目标：
     * - 把“人类/Agent 的裁决结果”重新送入写入管，形成闭环修正
     * - 该入口不影响现有 CLI/MCP：只有主动调用时才会发生回流写入
     *
     * 行为约定：
     * - action=reject_all：不回流写入，返回 null
     * - 其余 action：需要 final_text，否则抛错（避免写入空内容）
     * - 写入时会把 conflict_id/action 等信息注入 metadata.__governance，便于后续追溯
     */
    resolveConflict(resolution: MemoConflictResolution): Promise<MemoRecord | null>;
}
//# sourceMappingURL=engine.d.ts.map