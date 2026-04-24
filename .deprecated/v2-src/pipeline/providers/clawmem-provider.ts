import { createHash } from "node:crypto";
import type {
  ClawMemRecord,
  MemoIngestRequest,
  MemoRecord,
  MemoRetrieveRequest,
  TrackProvider,
} from "../../types/index.js";
import { extractCodeEntitiesAndMetadata } from "../../lib/utils.js";

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
  searchCode: (
    query: string,
    options?: { limit?: number; language?: string; ast_type?: string }
  ) => Promise<ClawMemRecord[]>;
  /**
   * 可选：FTS（全文检索）召回
   *
   * 说明：
   * - 并非所有存储实现都具备全文索引；因此该能力以可选方法形式存在
   * - 上层检索管会在 enabled=true 时尝试调用；失败/缺失则自动退化为仅 Vector 召回
   */
  searchCodeFTS?: (
    query: string,
    options?: { limit?: number; language?: string; ast_type?: string }
  ) => Promise<ClawMemRecord[]>;
}

function computeSha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((v) => String(v)).filter((v) => v.trim() !== "");
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return [];
    }
    return trimmed.split(",").map((t) => t.trim()).filter(Boolean);
  }
  return [];
}

function toNumber(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
}

function inferLanguageFromFilePath(filePath: string | undefined): string | undefined {
  const normalized = String(filePath ?? "").toLowerCase();
  if (!normalized) {
    return undefined;
  }
  if (normalized.endsWith(".ts") || normalized.endsWith(".tsx")) {
    return normalized.endsWith(".tsx") ? "tsx" : "typescript";
  }
  if (normalized.endsWith(".js") || normalized.endsWith(".jsx")) {
    return normalized.endsWith(".jsx") ? "jsx" : "javascript";
  }
  return undefined;
}

/**
 * ClawMemTrackProvider：把现有 ClawMem 适配为 TrackProvider
 *
 * 关键点：
 * - 不改变既有 ClawMem 的 schema 与行为
 * - 统一输出 MemoRecord，便于后续在检索管做跨轨合并与回填
 */
export class ClawMemTrackProvider implements TrackProvider {
  readonly track = "clawmem";
  private clawmem: ClawMemLike;

  constructor(clawmem: ClawMemLike) {
    this.clawmem = clawmem;
  }

  async initialize() {
    await this.clawmem.initialize();
  }

  async ingest(request: MemoIngestRequest): Promise<MemoRecord> {
    const { text = "", metadata = {}, context } = request ?? {};

    const language =
      typeof metadata["language"] === "string"
        ? (metadata["language"] as string)
        : inferLanguageFromFilePath(
            typeof context?.filePath === "string" ? context.filePath : undefined
          );
    const ast_type = typeof metadata["ast_type"] === "string" ? (metadata["ast_type"] as string) : undefined;
    const symbol_name =
      typeof metadata["symbol_name"] === "string" ? (metadata["symbol_name"] as string) : undefined;
    const file_path =
      typeof metadata["file_path"] === "string"
        ? (metadata["file_path"] as string)
        : typeof context?.filePath === "string"
          ? context.filePath
          : undefined;
    const importance = toNumber(metadata["importance"], 0.5);
    const tags = toStringArray(metadata["tags"]);

    /**
     * 在“新管道契约（MemoRecord）”层补齐 entities/metadata（结构化符号）
     *
     * 说明：
     * - 底层 ClawMem.addCode 仍会做一层实体抽取并落库（不破坏既有行为）
     * - 这里提前抽取的目的，是让写入管的返回值就能携带 symbols/range 等信息，
     *   便于后续在管道层做更细粒度的治理、过滤与展示（不必依赖存储层 schema 变更）
     */
    const extracted = await extractCodeEntitiesAndMetadata(text, language ?? "typescript");
    const inferredAstType =
      ast_type && String(ast_type).trim() !== "" && ast_type !== "unknown"
        ? ast_type
        : (extracted.metadata.primarySymbol?.kind ?? "unknown");
    const inferredSymbolName =
      symbol_name && String(symbol_name).trim() !== ""
        ? symbol_name
        : (extracted.metadata.primarySymbol?.name ?? (extracted.entities[0] ?? ""));

    const hash = computeSha256(text);
    const contentRefFromMetadata =
      typeof metadata["contentRef"] === "string" ? (metadata["contentRef"] as string) : undefined;
    const inferredContentRef = contentRefFromMetadata ?? `sha256:${hash}`;

    const id = await this.clawmem.addCode({
      text,
      language,
      ast_type: inferredAstType,
      symbol_name: inferredSymbolName,
      file_path,
      importance,
      tags,
      content_ref: inferredContentRef,
    });

    return {
      id,
      track: this.track,
      text,
      contentHash: hash,
      contentRef: inferredContentRef,
      entities: extracted.entities,
      metadata: {
        language,
        ast_type: inferredAstType,
        symbol_name: inferredSymbolName,
        file_path,
        importance,
        tags,
        parse_engine: extracted.metadata.parseEngine,
        symbols: extracted.metadata.symbols,
        primary_symbol: extracted.metadata.primarySymbol,
      },
    };
  }

  async retrieve(request: MemoRetrieveRequest): Promise<MemoRecord[]> {
    const { query = "", limit = 5, filters = {} } = request ?? {};
    const language =
      typeof filters["language"] === "string" ? (filters["language"] as string) : undefined;
    const ast_type =
      typeof filters["ast_type"] === "string" ? (filters["ast_type"] as string) : undefined;

    const results = await this.clawmem.searchCode(query, {
      limit,
      language,
      ast_type,
    });

    return results.map((record) => {
      const distance = typeof record._distance === "number" ? record._distance : undefined;
      const score = typeof distance === "number" ? 1 - distance : undefined;

      return {
        id: record.id,
        track: this.track,
        text: record.text,
        contentHash: record.hash,
        contentRef:
          typeof record.content_ref === "string" && String(record.content_ref ?? "").trim() !== ""
            ? record.content_ref
            : `sha256:${record.hash}`,
        entities: record.entities ?? [],
        score,
        metadata: {
          language: record.language,
          ast_type: record.ast_type,
          symbol_name: record.symbol_name,
          parent_symbol: record.parent_symbol,
          file_path: record.file_path,
          importance: record.importance,
          tags: record.tags,
          timestamp: record.timestamp,
          source: record.source,
        },
      };
    });
  }

  async retrieveFTS(request: MemoRetrieveRequest): Promise<MemoRecord[]> {
    const { query = "", limit = 5, filters = {} } = request ?? {};
    const language =
      typeof filters["language"] === "string" ? (filters["language"] as string) : undefined;
    const ast_type =
      typeof filters["ast_type"] === "string" ? (filters["ast_type"] as string) : undefined;

    if (!this.clawmem.searchCodeFTS) {
      return [];
    }

    /**
     * FTS 召回属于增强能力：必须保证“失败不影响主流程”
     */
    let results: ClawMemRecord[] = [];
    try {
      results = await this.clawmem.searchCodeFTS(query, { limit, language, ast_type });
    } catch {
      return [];
    }

    return results.map((record) => {
      const distance = typeof record._distance === "number" ? record._distance : undefined;
      const vectorScore = typeof distance === "number" ? 1 - distance : undefined;
      const rawFtsScore = typeof (record as any)._score === "number" ? (record as any)._score : undefined;
      const normalizedFtsScore =
        typeof rawFtsScore === "number"
          ? rawFtsScore >= 0 && rawFtsScore <= 1
            ? rawFtsScore
            : 1 - 1 / (1 + Math.max(rawFtsScore, 0))
          : undefined;

      const score = normalizedFtsScore ?? vectorScore;

      return {
        id: record.id,
        track: this.track,
        text: record.text,
        contentHash: record.hash,
        contentRef:
          typeof record.content_ref === "string" && String(record.content_ref ?? "").trim() !== ""
            ? record.content_ref
            : `sha256:${record.hash}`,
        entities: record.entities ?? [],
        score,
        metadata: {
          language: record.language,
          ast_type: record.ast_type,
          symbol_name: record.symbol_name,
          parent_symbol: record.parent_symbol,
          file_path: record.file_path,
          importance: record.importance,
          tags: record.tags,
          timestamp: record.timestamp,
          source: record.source,
        },
      };
    });
  }
}
