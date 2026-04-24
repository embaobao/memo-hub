import type {
  MemoConflictResolution,
  MemoGovernanceRequest,
  MemoGovernanceResult,
  MemoIngestRequest,
  MemoRecord,
  MemoRetrieveRequest,
  RoutingConfig,
  TrackProvider,
} from "../types/index.js";
import type { ContentAddressableStorage } from "../core/cas.js";
import { Hydrator } from "../core/hydration.js";
import { PipelineEventBus } from "./event-bus.js";
import { TrackRegistry } from "./track-registry.js";
import { GovernancePipe } from "./pipes/governance-pipe.js";
import { IngestionPipe } from "./pipes/ingestion-pipe.js";
import { RetrievalPipe } from "./pipes/retrieval-pipe.js";
import { FileGovernanceEventQueue } from "./governance/file-event-queue.js";

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
export class MemoEngine {
  readonly events: PipelineEventBus;
  readonly registry: TrackRegistry;
  readonly ingestion: IngestionPipe;
  readonly retrieval: RetrievalPipe;
  readonly governance: GovernancePipe;

  constructor(options: MemoEngineOptions) {
    const { providers = [], cas, routing } = options ?? {};

    this.events = new PipelineEventBus();
    this.registry = new TrackRegistry(providers);

    const hydrator = cas ? new Hydrator(cas) : undefined;

    this.ingestion = new IngestionPipe({
      registry: this.registry,
      eventBus: this.events,
      cas,
      routing,
    });
    this.retrieval = new RetrievalPipe({ registry: this.registry, eventBus: this.events, hydrator });
    this.governance = new GovernancePipe({ eventBus: this.events });
  }

  async initialize(): Promise<void> {
    await this.registry.initializeAll();
  }

  async ingest(request: MemoIngestRequest): Promise<MemoRecord> {
    return this.ingestion.run(request);
  }

  async retrieve(request: MemoRetrieveRequest): Promise<MemoRecord[]> {
    return this.retrieval.run(request);
  }

  async govern(request: MemoGovernanceRequest): Promise<MemoGovernanceResult> {
    return this.governance.run(request);
  }

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
  async resolveConflict(resolution: MemoConflictResolution): Promise<MemoRecord | null> {
    const {
      conflict_id = "",
      action,
      final_text,
      track,
      context,
      metadata = {},
    } = resolution ?? {};

    const resolvedConflictId = String(conflict_id ?? "").trim();
    const resolvedAction = action;

    const queuePath = String(process.env.MEMOHUB_CONFLICT_QUEUE_PATH ?? "").trim() || "~/.hermes/data/memohub-conflicts.ndjson";
    const queue = new FileGovernanceEventQueue({ filePath: queuePath });

    const resolutionEvent = {
      id: `resolution-${new Date().getTime()}`,
      type: "CONFLICT_RESOLUTION",
      timestamp: new Date().toISOString(),
      payload: {
        ...(resolution ?? {}),
        conflict_id: resolvedConflictId,
        action: resolvedAction,
      },
    };

    if (resolvedAction === "reject_all") {
      try {
        await queue.append(resolutionEvent);
      } catch {
        // 裁决落盘失败不阻塞（兼容性优先）
      }
      return null;
    }

    const text = String(final_text ?? "").trim();
    if (!text) {
      throw new Error("resolveConflict 需要提供 final_text（避免写入空内容）");
    }

    const result = await this.ingestion.run({
      text,
      ...(track ? { track } : {}),
      ...(context ? { context } : {}),
      metadata: {
        ...(metadata ?? {}),
        __governance: {
          conflict_id: resolvedConflictId,
          action: resolvedAction,
        },
      },
    });

    try {
      await queue.append(resolutionEvent);
    } catch {
      // 裁决落盘失败不阻塞（兼容性优先）
    }

    return result;
  }
}
