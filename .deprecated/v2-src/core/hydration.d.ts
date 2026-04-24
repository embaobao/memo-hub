import type { MemoRecord } from "../types/index.js";
import type { ContentAddressableStorage } from "./cas.js";
export interface HydrationOptions {
    /**
     * 是否启用回填（默认启用）
     *
     * 兼容性说明：
     * - 现有系统的索引里仍存有 text，因此默认开启回填不会引入额外 I/O
     * - 只有当索引 text 缺失/为空时才会尝试从 CAS 读取
     */
    enabled?: boolean;
    /**
     * 当回填失败时的兜底策略
     *
     * - keep_empty：保持 text 为空（最保守，不伪造内容）
     * - fallback_to_index：如果 record.text 有值则保留（默认策略）
     */
    onError?: "keep_empty" | "fallback_to_index";
}
/**
 * Hydrator：原文回填模块
 *
 * 目标：
 * - 根据 contentRef（可选 contentHash 校验）从 CAS 取回原文
 * - 在“灵肉分离”逐步落地过程中，保证旧数据/旧行为依然可用
 */
export declare class Hydrator {
    private cas;
    constructor(cas: ContentAddressableStorage);
    /**
     * 回填单条记录
     */
    hydrateRecord(record: MemoRecord, options?: HydrationOptions): Promise<MemoRecord>;
    /**
     * 回填多条记录（保持输入顺序）
     */
    hydrateRecords(records: MemoRecord[], options?: HydrationOptions): Promise<MemoRecord[]>;
}
//# sourceMappingURL=hydration.d.ts.map