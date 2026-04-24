import { BasePipe } from "../base-pipe.js";
import { createRoutingEngine } from "../router.js";
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
export class IngestionPipe {
    pipe;
    constructor(options) {
        const { registry, eventBus, cas, routing } = options;
        /**
         * 路由规则引擎（责任链）
         *
         * 说明：
         * - 该引擎只依赖“最终配置对象”，不负责读取配置文件
         * - 配置读取由上层（ConfigManager）完成，以保持管道基础设施的可测试性与可移植性
         */
        const routingEngine = createRoutingEngine(routing);
        this.pipe = new BasePipe({
            name: "ingestion",
            eventBus,
        });
        const normalizeStage = {
            name: "normalize_request",
            run: async (input, context) => {
                const { text = "", track, metadata = {}, context: requestContext, } = input ?? {};
                const mergedContext = requestContext ?? context;
                const normalizedTrack = typeof track === "string" && String(track ?? "").trim() !== "" ? String(track).trim() : undefined;
                return {
                    text,
                    track: normalizedTrack,
                    context: mergedContext,
                    metadata,
                };
            },
        };
        const routeStage = {
            name: "route_track",
            run: async (input, context) => {
                const { track, metadata = {}, context: requestContext } = input ?? {};
                const mergedContext = requestContext ?? context;
                /**
                 * 兼容性优先：
                 * - 如果上层显式指定了 track，则不做路由推断（避免破坏既有调用方行为）
                 * - 但依然产出可观测信息，便于排查“为什么写入到该轨道”
                 */
                if (typeof track === "string" && String(track ?? "").trim() !== "") {
                    const decidedTrack = String(track).trim();
                    const existingPipeline = metadata && typeof metadata === "object" ? metadata["__pipeline"] : undefined;
                    const pipelineMeta = (existingPipeline && typeof existingPipeline === "object"
                        ? existingPipeline
                        : {});
                    return {
                        ...(input ?? { text: "" }),
                        track: decidedTrack,
                        context: mergedContext,
                        metadata: {
                            ...(metadata ?? {}),
                            __pipeline: {
                                ...pipelineMeta,
                                routing: {
                                    track: decidedTrack,
                                    rule: "explicit_track",
                                    reason: "请求显式指定 track，跳过路由规则推断",
                                },
                            },
                        },
                    };
                }
                const decision = routingEngine.route(input ?? { text: "" }, mergedContext);
                const existingPipeline = metadata && typeof metadata === "object" ? metadata["__pipeline"] : undefined;
                const pipelineMeta = (existingPipeline && typeof existingPipeline === "object"
                    ? existingPipeline
                    : {});
                return {
                    ...(input ?? { text: "" }),
                    track: decision.track,
                    context: mergedContext,
                    metadata: {
                        ...(metadata ?? {}),
                        __pipeline: {
                            ...pipelineMeta,
                            routing: decision,
                        },
                    },
                };
            },
        };
        const casStage = {
            name: "persist_cas",
            run: async (input) => {
                const { text = "", metadata = {} } = input ?? {};
                if (!cas) {
                    return input;
                }
                /**
                 * CAS 写入是“增强能力”：
                 * - 成功：把 contentRef/contentHash 注入到 metadata，供后续 provider 写入索引字段
                 * - 失败：不抛错（避免破坏现有 CLI/MCP 行为）
                 */
                try {
                    const { contentHash, contentRef } = await cas.putText(text);
                    return {
                        ...(input ?? { text: "" }),
                        metadata: {
                            ...(metadata ?? {}),
                            contentHash,
                            contentRef,
                        },
                    };
                }
                catch {
                    return input;
                }
            },
        };
        const providerIngestStage = {
            name: "provider_ingest",
            run: async (input) => {
                const { track = "gbrain" } = input ?? {};
                const provider = registry.get(track);
                return provider.ingest({ ...(input ?? {}), track });
            },
        };
        this.pipe.use(normalizeStage).use(routeStage).use(casStage).use(providerIngestStage);
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
//# sourceMappingURL=ingestion-pipe.js.map