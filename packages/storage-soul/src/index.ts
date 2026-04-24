import * as lancedb from '@lancedb/lancedb';
import * as path from 'node:path';
import * as os from 'node:os';
import type { VectorRecord, SearchOptions, VectorStorageConfig } from './types.js';

export type { VectorRecord, SearchOptions, VectorStorageConfig };

export class VectorStorage {
  private db: lancedb.Connection | null = null;
  private table: lancedb.Table | null = null;
  private config: VectorStorageConfig;

  constructor(config: VectorStorageConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
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
   * 验证数据库 schema 是否包含必需的字段
   */
  private async validateSchema(): Promise<void> {
    try {
      const sample = await this.table!.query().limit(1).toArray();
      if (sample.length > 0) {
        const record = sample[0] as Record<string, unknown>;
        const requiredFields = ['id', 'vector', 'hash', 'track_id', 'entities', 'timestamp'];
        const missingFields = requiredFields.filter(field => !(field in record));

        if (missingFields.length > 0) {
          throw new Error(
            `Database schema validation failed: Missing required fields: ${missingFields.join(', ')}.`
          );
        }
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('Missing required fields')) {
        throw error;
      }
    }
  }

  private async createTable(): Promise<void> {
    const seed = {
      id: '__schema_seed__',
      vector: new Array(this.config.dimensions).fill(0),
      hash: 'seed',
      track_id: 'seed',
      entities: ['seed'],
      timestamp: new Date().toISOString(),
      access_count: 0,
      last_accessed: new Date().toISOString(),
      category: 'seed',
      importance: 0.5,
      tags: ['seed'],
      source: 'system',
      language: 'typescript',
      ast_type: 'unknown',
      symbol_name: 'seed',
      file_path: '',
    };

    this.table = await this.db!.createTable(this.config.tableName, [seed]);
    await this.table!.delete('id = \'__schema_seed__\'');
  }

  async add(records: VectorRecord | VectorRecord[]): Promise<void> {
    this.ensureReady();
    const items = Array.isArray(records) ? records : [records];
    await this.table!.add(items);
  }

  async search(queryVector: number[], options?: SearchOptions): Promise<(VectorRecord & { _distance?: number })[]> {
    this.ensureReady();
    const limit = options?.limit ?? 5;
    let query = this.table!.vectorSearch(queryVector).limit(limit).distanceType('cosine');

    if (options?.filter) {
      query = query.where(options.filter);
    }

    const results = await query.toArray();
    return results as (VectorRecord & { _distance?: number })[];
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
    return results as VectorRecord[];
  }

  async update(id: string, changes: Partial<Omit<VectorRecord, 'id' | 'vector'>>): Promise<void> {
    this.ensureReady();
    const existing = await this.table!.query().where(`id = '${id}'`).limit(1).toArray();
    if (existing.length === 0) {
      throw new Error(`Record not found: ${id}`);
    }
    await this.table!.delete(`id = '${id}'`);
    const updated = { ...existing[0], ...changes, id };
    await this.table!.add([updated]);
  }

  private ensureReady(): void {
    if (!this.table) {
      throw new Error('VectorStorage not initialized. Call initialize() first.');
    }
  }
}
