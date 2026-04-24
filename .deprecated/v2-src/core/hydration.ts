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
export class Hydrator {
  private cas: ContentAddressableStorage;

  constructor(cas: ContentAddressableStorage) {
    this.cas = cas;
  }

  /**
   * 回填单条记录
   */
  async hydrateRecord(record: MemoRecord, options: HydrationOptions = {}): Promise<MemoRecord> {
    const { enabled = true, onError = "fallback_to_index" } = options ?? {};

    const {
      text = "",
      contentRef,
      contentHash,
    } = record ?? { text: "" };

    if (!enabled) {
      return record;
    }

    /**
     * 兼容性策略：
     * - 只在 text 为空时尝试回填（避免对现有行为产生性能/内容影响）
     * - 后续如果要做到“索引不再存 text”，只需要在写入侧停止存 text 即可
     */
    if (String(text ?? "").trim() !== "") {
      return record;
    }

    if (!contentRef) {
      return record;
    }

    try {
      const hydratedText = await this.cas.getTextVerified({
        contentRef,
        contentHash,
      });

      if (hydratedText == null) {
        return record;
      }

      return {
        ...(record ?? { track: "unknown", text: "" }),
        text: hydratedText,
      };
    } catch {
      if (onError === "keep_empty") {
        return record;
      }
      return record;
    }
  }

  /**
   * 回填多条记录（保持输入顺序）
   */
  async hydrateRecords(records: MemoRecord[], options: HydrationOptions = {}): Promise<MemoRecord[]> {
    const list = Array.isArray(records) ? records : [];
    const hydrated = await Promise.all(list.map((r) => this.hydrateRecord(r, options)));
    return hydrated;
  }
}

