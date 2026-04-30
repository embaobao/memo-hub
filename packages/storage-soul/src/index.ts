import * as path from "node:path";
import * as os from "node:os";
import type {
  VectorRecord,
  SearchOptions,
  VectorStorageConfig,
} from "./types.js";

export type { VectorRecord, SearchOptions, VectorStorageConfig };

const REQUIRED_VECTOR_FIELDS = [
  "id",
  "vector",
  "hash",
  "track_id",
  "entities",
  "timestamp",
  "memory_id",
  "content_index",
  "scope_types",
  "scope_ids",
  "visibility",
  "domain_types",
  "state",
  "source_type",
  "source_id",
  "channel",
  "actor_id",
  "subject_id",
  "text",
] as const;

const DEFAULT_VECTOR_ROW = {
  hash: "",
  track_id: "",
  entities: [] as string[],
  timestamp: "",
  memory_id: "",
  content_index: 0,
  scope_types: [] as string[],
  scope_ids: [] as string[],
  visibility: "shared",
  domain_types: [] as string[],
  state: "raw",
  source_type: "",
  source_id: "",
  channel: "",
  actor_id: "",
  subject_id: "",
  text: "",
  access_count: 0,
  last_accessed: "",
  category: "",
  importance: 0.5,
  tags: [] as string[],
  source: "",
  language: "",
  ast_type: "",
  symbol_name: "",
  parent_symbol: "",
  file_path: "",
  operation_type: "",
  clarification_id: "",
  review_state: "",
};

const ARRAY_VECTOR_FIELDS = [
  "entities",
  "tags",
  "scope_types",
  "scope_ids",
  "domain_types",
] as const;

export class VectorStorage {
  private db: any = null;
  private table: any = null;
  private config: VectorStorageConfig;

  constructor(config: VectorStorageConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    const lancedb = await import("@lancedb/lancedb");
    const dbPath = this.config.dbPath.replace(/^~/, os.homedir());
    const absolutePath = path.resolve(dbPath);

    this.db = await lancedb.connect(absolutePath);

    const tableNames = await this.db.tableNames();
    if (tableNames.includes(this.config.tableName)) {
      this.table = await this.db.openTable(this.config.tableName);
      await this.validateSchema();
    } else {
      await this.createTable();
    }
  }

  /**
   * 验证数据库 schema 是否包含统一记忆投影字段。
   *
   * 旧表即使为空也会保留旧 schema；这里必须直接检查 schema，而不是只看样本行。
   */
  private async validateSchema(): Promise<void> {
    const schemaFields = await this.getTableFieldNames();
    if (schemaFields) {
      const missingFields = REQUIRED_VECTOR_FIELDS.filter(
        (field) => !schemaFields.has(field),
      );
      if (missingFields.length > 0) {
        throw new Error(
          `Database schema validation failed: Missing required fields: ${missingFields.join(", ")}. Run memohub config-init to rebuild the managed data store.`,
        );
      }
      return;
    }

    try {
      const sample = await this.table!.query().limit(1).toArray();
      if (sample.length === 0) return;
      const record = sample[0] as Record<string, unknown>;
      const missingFields = REQUIRED_VECTOR_FIELDS.filter(
        (field) => !(field in record),
      );

      if (missingFields.length > 0) {
        throw new Error(
          `Database schema validation failed: Missing required fields: ${missingFields.join(", ")}. Run memohub config-init to rebuild the managed data store.`,
        );
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes("Missing required fields")) {
        throw error;
      }
    }
  }

  private async createTable(): Promise<void> {
    const seed = {
      ...DEFAULT_VECTOR_ROW,
      id: "__schema_seed__",
      vector: new Array(this.config.dimensions).fill(0),
      hash: "seed",
      track_id: "seed",
      entities: ["seed"],
      timestamp: new Date().toISOString(),
      last_accessed: new Date().toISOString(),
      memory_id: "seed",
      content_index: 0,
      scope_types: ["global"],
      scope_ids: ["global"],
      visibility: "global",
      domain_types: ["project-knowledge"],
      state: "raw",
      source_type: "system",
      source_id: "system",
      channel: "system",
      actor_id: "system",
      subject_id: "",
      text: "schema seed",
      tags: ["seed"],
      source: "system",
      symbol_name: "seed",
    };

    this.table = await this.db!.createTable(this.config.tableName, [seed]);
    await this.table!.delete("id = '__schema_seed__'");
  }

  async add(records: VectorRecord | VectorRecord[]): Promise<void> {
    this.ensureReady();
    const items = Array.isArray(records) ? records : [records];
    // LanceDB 表 schema 固定；统一记忆投影的可选字段也需要补齐，避免首条 Hermes 写入失败。
    await this.table!.add(items.map((item) => this.normalizeRecord(item)));
  }

  async search(
    queryVector: number[],
    options?: SearchOptions,
  ): Promise<(VectorRecord & { _distance?: number })[]> {
    this.ensureReady();
    const limit = options?.limit ?? 5;
    let query = this.table!.vectorSearch(queryVector)
      .limit(limit)
      .distanceType("cosine");

    if (options?.filter) {
      query = query.where(options.filter);
    }

    const results = await query.toArray();
    return results.map((record: Record<string, unknown>) => this.normalizeReadRecord(record)) as (VectorRecord & { _distance?: number })[];
  }

  async delete(filter: string): Promise<void> {
    this.ensureReady();
    await this.table!.delete(filter);
  }

  async list(filter?: string, limit: number = 10000): Promise<VectorRecord[]> {
    this.ensureReady();
    let query = this.table!.query().limit(limit);
    if (filter) {
      query = query.where(filter);
    }
    const results = await query.toArray();
    return results.map((record: Record<string, unknown>) => this.normalizeReadRecord(record)) as VectorRecord[];
  }

  async update(
    id: string,
    changes: Partial<Omit<VectorRecord, "id" | "vector">>,
  ): Promise<void> {
    this.ensureReady();
    const existing = await this.table!.query()
      .where(`id = '${id}'`)
      .limit(1)
      .toArray();
    if (existing.length === 0) {
      throw new Error(`Record not found: ${id}`);
    }
    await this.table!.delete(`id = '${id}'`);
    const updated = { ...existing[0], ...changes, id };
    await this.table!.add([updated]);
  }

  private ensureReady(): void {
    if (!this.table) {
      throw new Error(
        "VectorStorage not initialized. Call initialize() first.",
      );
    }
  }

  private normalizeRecord(record: VectorRecord): Record<string, unknown> {
    return {
      ...DEFAULT_VECTOR_ROW,
      ...record,
      last_accessed: record.last_accessed ?? record.timestamp ?? new Date().toISOString(),
      source: record.source ?? record.source_id ?? record.source_type ?? "",
      actor_id: record.actor_id ?? "",
      subject_id: record.subject_id ?? "",
      tags: record.tags ?? [],
    };
  }

  private normalizeReadRecord(record: Record<string, unknown>): Record<string, unknown> {
    const normalized = { ...record };
    for (const field of ARRAY_VECTOR_FIELDS) {
      normalized[field] = toPlainArray(normalized[field]);
    }
    return normalized;
  }

  private async getTableFieldNames(): Promise<Set<string> | null> {
    const schemaCandidate = this.table?.schema;
    if (!schemaCandidate) return null;

    let schema: any = schemaCandidate;
    try {
      if (typeof schemaCandidate === "function") {
        schema = await schemaCandidate.call(this.table);
      }
    } catch {
      return null;
    }

    const fields: any[] | undefined =
      (schema && Array.isArray(schema.fields) ? schema.fields : undefined) ??
      (schema && Array.isArray(schema.schema?.fields) ? schema.schema.fields : undefined);

    if (!fields?.length) return null;
    const names = new Set<string>();
    for (const field of fields) {
      if (field && typeof field.name === "string") names.add(field.name);
    }
    return names.size > 0 ? names : null;
  }
}

function toPlainArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];
  const vectorLike = value as { length?: unknown; get?: unknown };
  if (typeof vectorLike.length === "number" && typeof vectorLike.get === "function") {
    const result: unknown[] = [];
    for (let index = 0; index < vectorLike.length; index += 1) {
      result.push((vectorLike.get as (index: number) => unknown)(index));
    }
    return result;
  }
  return [];
}
