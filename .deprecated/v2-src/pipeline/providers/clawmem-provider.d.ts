import type { ClawMemRecord, MemoIngestRequest, MemoRecord, MemoRetrieveRequest, TrackProvider } from "../../types/index.js";
export interface ClawMemLike {
    initialize: () => Promise<void>;
    addCode: (params: {
        text: string;
        language?: string;
        ast_type?: string;
        symbol_name?: string;
        file_path?: string;
        importance?: number;
        tags?: string[];
        content_ref?: string;
    }) => Promise<string>;
    searchCode: (query: string, options?: {
        limit?: number;
        language?: string;
        ast_type?: string;
    }) => Promise<ClawMemRecord[]>;
    /**
     * 可选：FTS（全文检索）召回
     *
     * 说明：
     * - 并非所有存储实现都具备全文索引；因此该能力以可选方法形式存在
     * - 上层检索管会在 enabled=true 时尝试调用；失败/缺失则自动退化为仅 Vector 召回
     */
    searchCodeFTS?: (query: string, options?: {
        limit?: number;
        language?: string;
        ast_type?: string;
    }) => Promise<ClawMemRecord[]>;
}
/**
 * ClawMemTrackProvider：把现有 ClawMem 适配为 TrackProvider
 *
 * 关键点：
 * - 不改变既有 ClawMem 的 schema 与行为
 * - 统一输出 MemoRecord，便于后续在检索管做跨轨合并与回填
 */
export declare class ClawMemTrackProvider implements TrackProvider {
    readonly track = "clawmem";
    private clawmem;
    constructor(clawmem: ClawMemLike);
    initialize(): Promise<void>;
    ingest(request: MemoIngestRequest): Promise<MemoRecord>;
    retrieve(request: MemoRetrieveRequest): Promise<MemoRecord[]>;
    retrieveFTS(request: MemoRetrieveRequest): Promise<MemoRecord[]>;
}
//# sourceMappingURL=clawmem-provider.d.ts.map