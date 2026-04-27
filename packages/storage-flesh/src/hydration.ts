import type { ICAS } from "@memohub/protocol";
import type { VectorRecord } from "@memohub/storage-soul";

export interface HydrationOptions {
  enabled?: boolean;
  onError?: "keep_empty" | "fallback_to_index";
}

export class Hydrator {
  private cas: ICAS;

  constructor(cas: ICAS) {
    this.cas = cas;
  }

  async hydrateRecord(
    record: VectorRecord & { text?: string },
    options: HydrationOptions = {},
  ): Promise<VectorRecord & { text?: string }> {
    const { enabled = true, onError = "fallback_to_index" } = options;
    const { text, hash } = record as any;

    if (!enabled) return record;
    if (String(text ?? "").trim() !== "") return record;
    if (!hash) return record;

    try {
      const hydratedText = await this.cas.read(hash);
      if (hydratedText == null) return record;
      return { ...record, text: hydratedText } as VectorRecord & {
        text?: string;
      };
    } catch {
      if (onError === "keep_empty") return record;
      return record;
    }
  }

  async hydrateRecords(
    records: (VectorRecord & { text?: string })[],
    options: HydrationOptions = {},
  ): Promise<(VectorRecord & { text?: string })[]> {
    const list = Array.isArray(records) ? records : [];
    return Promise.all(list.map((r) => this.hydrateRecord(r, options)));
  }
}
