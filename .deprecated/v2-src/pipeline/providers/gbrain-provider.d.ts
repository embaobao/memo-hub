import type { GBrainRecord, MemoIngestRequest, MemoRecord, MemoRetrieveRequest, TrackProvider } from "../../types/index.js";
export interface GBrainLike {
    initialize: () => Promise<void>;
    addKnowledge: (params: {
        text: string;
        category?: string;
        importance?: number;
        tags?: string[];
        entities?: string[];
        content_ref?: string;
    }) => Promise<string>;
    searchKnowledge: (query: string, options?: {
        limit?: number;
        category?: string;
    }) => Promise<GBrainRecord[]>;
    /**
     * 可选：FTS（全文检索）召回
     *
     * 说明：
     * - 并非所有存储实现都支持 FTS；因此这里用可选方法表达“能力插槽”
     * - 当实现不存在或运行时报错（例如未建 FTS 索引）时，上层会自动退化为仅 Vector 召回
     */
    searchKnowledgeFTS?: (query: string, options?: {
        limit?: number;
        category?: string;
    }) => Promise<GBrainRecord[]>;
}
/**
 * GBrainTrackProvider：把现有 GBrain 适配为 TrackProvider
 *
 * 关键点：
 * - 不改变既有 GBrain 的 schema 与对外行为
 * - 在“新管道契约”层面补齐 track/contentHash/metadata 等字段，便于后续演进
 */
export declare class GBrainTrackProvider implements TrackProvider {
    readonly track = "gbrain";
    private gbrain;
    constructor(gbrain: GBrainLike);
    initialize(): Promise<void>;
    ingest(request: MemoIngestRequest): Promise<MemoRecord>;
    retrieve(request: MemoRetrieveRequest): Promise<MemoRecord[]>;
    retrieveFTS(request: MemoRetrieveRequest): Promise<MemoRecord[]>;
}
//# sourceMappingURL=gbrain-provider.d.ts.map