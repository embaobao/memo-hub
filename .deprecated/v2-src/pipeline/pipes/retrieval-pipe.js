import { BasePipe } from "../base-pipe.js";
function toStringArray(value) {
    if (Array.isArray(value)) {
        return value.map((v) => String(v)).filter((v) => v.trim() !== "");
    }
    if (typeof value === "string") {
        const trimmed = value.trim();
        if (!trimmed) {
            return [];
        }
        return trimmed
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);
    }
    return [];
}
function resolveTracks(input, registry) {
    const { tracks, filters = {} } = input ?? {};
    if (Array.isArray(tracks) && tracks.length > 0) {
        return tracks.map((t) => String(t)).filter((t) => t.trim() !== "");
    }
    const filtersTrack = filters["track"];
    const filtersTracks = filters["tracks"];
    const fromFilters = [
        ...toStringArray(filtersTrack),
        ...toStringArray(filtersTracks),
    ].filter(Boolean);
    if (fromFilters.length > 0) {
        return fromFilters;
    }
    return registry.listTracks();
}
function normalizeFtsEnabled(input) {
    const { fts, filters = {} } = input ?? {};
    if (fts && typeof fts === "object" && typeof fts.enabled === "boolean") {
        return Boolean(fts.enabled);
    }
    /**
     * 兼容性兜底：允许通过 filters 透传开关（避免顶层参数继续膨胀）
     *
     * 支持形式：
     * - filters.fts_enabled = true/false
     * - filters.ftsEnabled = true/false
     */
    const ftsEnabledFromFilters = typeof filters["fts_enabled"] === "boolean"
        ? filters["fts_enabled"]
        : typeof filters["ftsEnabled"] === "boolean"
            ? filters["ftsEnabled"]
            : undefined;
    /**
     * 兼容性优先：默认关闭 FTS，避免在底层索引/依赖可用时“悄悄改变召回集合”。
     *
     * 说明：
     * - 当未来对外接口（CLI/MCP）显式暴露开关后，可把默认策略升级为“可用则开启”
     */
    return typeof ftsEnabledFromFilters === "boolean" ? ftsEnabledFromFilters : false;
}
function recordKey(record) {
    const { id, track, contentHash, text } = record ?? {};
    return ((id && `${track}:id:${id}`) ||
        (contentHash && `${track}:hash:${contentHash}`) ||
        `${track}:text:${String(text ?? "")}`);
}
function mergeRecord(a, b) {
    /**
     * 多路合并策略（去重 + 补全）：
     * - score：取更高者（排序以更可信的评分为准）
     * - text：优先选择非空（便于后续 Hydration 减少 I/O）
     * - contentHash/contentRef/entities：优先保留已存在值，缺失则用另一侧补齐
     * - metadata：浅合并；当 key 冲突时优先保留“评分更高的一侧”
     */
    const aScore = typeof a.score === "number" ? a.score : -Infinity;
    const bScore = typeof b.score === "number" ? b.score : -Infinity;
    const preferB = bScore > aScore;
    const primary = preferB ? b : a;
    const secondary = preferB ? a : b;
    const primaryText = String(primary.text ?? "");
    const secondaryText = String(secondary.text ?? "");
    const mergedMetadata = primary.metadata && typeof primary.metadata === "object"
        ? {
            ...(secondary.metadata && typeof secondary.metadata === "object" ? secondary.metadata : {}),
            ...primary.metadata,
        }
        : secondary.metadata;
    return {
        ...primary,
        score: Number.isFinite(primary.score)
            ? primary.score
            : Number.isFinite(secondary.score)
                ? secondary.score
                : undefined,
        text: primaryText.trim() !== "" ? primaryText : secondaryText,
        contentHash: primary.contentHash ?? secondary.contentHash,
        contentRef: primary.contentRef ?? secondary.contentRef,
        entities: Array.isArray(primary.entities) && primary.entities.length > 0
            ? primary.entities
            : secondary.entities,
        metadata: mergedMetadata,
    };
}
function mergeAndDedupeRecords(records) {
    const map = new Map();
    for (const record of records) {
        const key = recordKey(record);
        const existing = map.get(key);
        if (!existing) {
            map.set(key, record);
            continue;
        }
        map.set(key, mergeRecord(existing, record));
    }
    return Array.from(map.values());
}
function compareRecords(a, b) {
    const aScore = typeof a.score === "number" ? a.score : 0;
    const bScore = typeof b.score === "number" ? b.score : 0;
    if (aScore !== bScore) {
        return bScore - aScore;
    }
    const aTrack = String(a.track ?? "");
    const bTrack = String(b.track ?? "");
    if (aTrack !== bTrack) {
        return aTrack.localeCompare(bTrack);
    }
    const aId = String(a.id ?? a.contentHash ?? a.text ?? "");
    const bId = String(b.id ?? b.contentHash ?? b.text ?? "");
    return aId.localeCompare(bId);
}
/**
 * RetrievalPipe：检索管骨架
 *
 * 本期目标：
 * - 保留“统一请求 → 多 Provider 调用 → 合并装配”的结构
 * - Vector 召回为必选；FTS 召回为可选插槽（依赖不可用时默认关闭但结构完备）
 * - 产出阶段级事件流：Vector/FTS/装配/Hydration 都可观测、可回放
 */
export class RetrievalPipe {
    pipe;
    constructor(options) {
        const { registry, eventBus, hydrator } = options;
        this.pipe = new BasePipe({
            name: "retrieval",
            eventBus,
        });
        const normalizeStage = {
            name: "normalize_request",
            run: async (input) => {
                const { query = "", limit = 5, filters = {}, context, hydrate, } = input ?? {};
                const normalizedTracks = resolveTracks(input, registry);
                const ftsEnabled = normalizeFtsEnabled(input);
                return {
                    query,
                    tracks: normalizedTracks,
                    limit,
                    filters: (filters && typeof filters === "object" ? filters : {}),
                    context,
                    hydrate,
                    fts: { enabled: ftsEnabled },
                };
            },
        };
        const vectorRecallStage = {
            name: "vector_recall",
            run: async (input) => {
                const request = input;
                const { tracks = [], limit = 5 } = request ?? {};
                /**
                 * Vector 召回是必选能力：
                 * - 每个轨道都必须实现 TrackProvider.retrieve
                 * - 即便未来引入更多召回策略，这条链路也必须保留
                 */
                const results = await Promise.all(tracks.map(async (track) => {
                    const provider = registry.get(track);
                    return provider.retrieve({ ...(request ?? { query: "" }), tracks: [track], limit });
                }));
                return {
                    request,
                    vector: results.flat(),
                    fts: [],
                };
            },
        };
        const ftsRecallStage = {
            name: "fts_recall",
            run: async (input) => {
                const { request, vector = [] } = input ?? {};
                const { tracks = [], limit = 5, fts } = request ?? {};
                const enabled = Boolean(fts?.enabled);
                /**
                 * FTS 召回是可选插槽：
                 * - enabled=false：显式关闭
                 * - enabled=true：仅当 Provider 实现了 retrieveFTS 时才尝试
                 * - 依赖不可用/索引缺失：Provider 内部兜底返回空数组（不抛错，不影响主流程）
                 */
                if (!enabled) {
                    return { request, vector, fts: [] };
                }
                const results = await Promise.all(tracks.map(async (track) => {
                    const provider = registry.get(track);
                    if (!provider.retrieveFTS) {
                        return [];
                    }
                    return provider.retrieveFTS({ ...(request ?? { query: "" }), tracks: [track], limit });
                }));
                return {
                    request,
                    vector,
                    fts: results.flat(),
                };
            },
        };
        const assembleStage = {
            name: "assemble_results",
            run: async (input) => {
                const { request, vector = [], fts = [] } = input ?? {};
                const { limit = 5 } = request ?? {};
                const merged = [...vector, ...fts];
                const deduped = mergeAndDedupeRecords(merged);
                const sorted = deduped.sort(compareRecords);
                const sliced = sorted.slice(0, limit);
                return { request, results: sliced };
            },
        };
        const hydrateStage = {
            name: "hydrate_records",
            run: async (input) => {
                const { request, results } = input ?? {};
                const { hydrate } = request ?? {};
                /**
                 * Hydration（原文回填）：
                 * - 默认不显式触发 I/O：只有当 record.text 为空且携带 contentRef 时才读取 CAS
                 * - hydrate=false：显式关闭回填（即便有 hydrator 也不触发）
                 */
                if (!hydrator) {
                    return results ?? [];
                }
                if (hydrate === false) {
                    return results ?? [];
                }
                return hydrator.hydrateRecords(results ?? [], {
                    enabled: true,
                    onError: "fallback_to_index",
                });
            },
        };
        this.pipe
            .use(normalizeStage)
            .use(vectorRecallStage)
            .use(ftsRecallStage)
            .use(assembleStage)
            .use(hydrateStage);
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
//# sourceMappingURL=retrieval-pipe.js.map