// GBrain - 通用知识记忆系统

import * as lancedb from "@lancedb/lancedb";
import * as path from "node:path";
import * as os from "node:os";
import type {
  GBrainRecord,
  GBrainConfig,
  AddKnowledgeParams,
} from "../types/index.js";
import { Embedder } from "../core/embedder.js";
import { computeHash } from "./utils.js";

export class GBrain {
  private db: any;
  private table: any;
  private config: GBrainConfig;
  private embedder: Embedder;

  constructor(config: GBrainConfig, embedder: Embedder) {
    this.config = config;
    this.embedder = embedder;
  }

  /**
   * 初始化数据库连接
   */
  async initialize(): Promise<void> {
    const dbPath = this.config.db_path.replace(/^~/, os.homedir());
    const absolutePath = path.resolve(dbPath);

    this.db = await lancedb.connect(absolutePath);

    // 检查表是否存在
    const tableNames = await this.db.tableNames();
    if (tableNames.includes(this.config.table_name)) {
      this.table = await this.db.openTable(this.config.table_name);
    } else {
      // 创建新表
      await this.createTable();
    }
  }

  /**
   * 创建新表
   */
  private async createTable(): Promise<void> {
    const seed = {
      id: "__schema__",
      text: "",
      vector: new Array(this.embedder["config"].dimensions).fill(0),
      category: "other",
      scope: "global",
      importance: 0,
      timestamp: new Date().toISOString(),
      tags: ["seed"], // 使用非空数组让 LanceDB 正确推断类型
      source: "seed",
      access_count: 0,
      last_accessed: new Date().toISOString(), // 使用实际值而不是 null
      entities: ["seed"], // 非空数组
      hash: "seed", // 非空字符串
    };

    this.table = await this.db.createTable(this.config.table_name, [seed]);
    await this.table.delete('id = "__schema__"');
  }

  /**
   * 添加知识记录
   */
  async addKnowledge(params: AddKnowledgeParams): Promise<string> {
    const {
      text,
      category = this.config.default_category,
      importance = this.config.default_importance,
      tags = [],
    } = params;

    const vector = await this.embedder.embed(text);
    const hash = computeHash(text);
    const id = `gbrain-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    await this.table.add([
      {
        id,
        text,
        vector,
        category,
        scope: "global",
        importance,
        timestamp: new Date().toISOString(),
        tags,
        source: "cli",
        access_count: 0,
        last_accessed: null,
        entities: [], // GBrain 实体暂时为空，后续可以从文本中提取
        hash,
      },
    ]);

    return id;
  }

  /**
   * 搜索知识
   */
  async searchKnowledge(
    query: string,
    options: {
      limit?: number;
      category?: string;
    } = {}
  ): Promise<GBrainRecord[]> {
    const { limit = 5, category } = options;

    const vector = await this.embedder.embed(query);
    let search = this.table
      .vectorSearch(vector)
      .distanceType("cosine")
      .limit(limit);

    if (category) {
      search = search.where(`category = '${category.replace(/'/g, "\\'")}'`);
    }

    const results = await search.toArray();
    return results as GBrainRecord[];
  }

  /**
   * 获取统计数据
   */
  async getStats(): Promise<{
    total_records: number;
    db_path: string;
    embedding_model: string;
    vector_dim: number;
  }> {
    const count = await this.table.countRows();

    return {
      total_records: count,
      db_path: this.config.db_path,
      embedding_model: this.embedder["config"].model,
      vector_dim: this.embedder["config"].dimensions,
    };
  }

  /**
   * 列出所有分类
   */
  async listCategories(): Promise<Record<string, number>> {
    const all = await this.table.query().limit(10000).toArray();
    const counts: Record<string, number> = {};

    for (const r of all) {
      const c = String((r as any).category ?? "unknown");
      counts[c] = (counts[c] || 0) + 1;
    }

    return counts;
  }

  /**
   * 获取所有记录
   */
  async getAllRecords(): Promise<GBrainRecord[]> {
    const all = await this.table.query().limit(10000).toArray();
    return all as GBrainRecord[];
  }

  /**
   * 删除知识记录
   */
  async deleteKnowledge(ids: string[]): Promise<number> {
    if (ids.length === 0) {
      return 0;
    }

    // 构建 WHERE 条件
    const conditions = ids.map(
      (id) => `id = '${id.replace(/'/g, "\\'")}'`
    ).join(" OR ");

    await this.table.delete(conditions);
    return ids.length;
  }

  /**
   * 按分类删除
   */
  async deleteByCategory(category: string): Promise<number> {
    await this.table.delete(`category = '${category.replace(/'/g, "\\'")}'`);

    // 返回删除的记录数
    const all = await this.table.query().limit(10000).toArray();
    const deleted = all.filter((r: any) => r.category === category).length;
    return deleted;
  }
}
