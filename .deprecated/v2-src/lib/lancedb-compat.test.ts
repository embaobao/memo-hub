import { describe, expect, test } from "bun:test";
import * as os from "node:os";
import * as path from "node:path";
import * as fs from "node:fs/promises";
import { randomUUID } from "node:crypto";
import * as lancedb from "@lancedb/lancedb";
import { addRowsWithSchemaCompatibility } from "./lancedb-compat.js";

describe("LanceDB 写入兼容（老表缺字段时不失败）", () => {
  test("按 schema 过滤：GBrain 老表缺 access_count 等字段仍可写入", async () => {
    const tmpDbPath = path.join(os.tmpdir(), `memohub-lancedb-compat-${randomUUID()}`);

    const db = await lancedb.connect(tmpDbPath);
    const tableName = "gbrain";

    /**
     * 构造“旧 schema”：
     * - 故意不包含 access_count / last_accessed / entities / hash / content_ref
     * - 用 seed 初始化 schema 后立刻删除，确保表空但 schema 固定
     */
    const oldSeed = {
      id: "__schema__",
      text: "",
      vector: [0, 0, 0],
      category: "other",
      scope: "global",
      importance: 0,
      timestamp: new Date().toISOString(),
      tags: ["seed"],
      source: "seed",
    };

    const table = await db.createTable(tableName, [oldSeed]);
    await table.delete('id = "__schema__"');

    const newRow = {
      id: `gbrain-${Date.now()}-compat`,
      text: "hello",
      vector: [1, 2, 3],
      category: "other",
      scope: "global",
      importance: 0.5,
      timestamp: new Date().toISOString(),
      tags: ["compat"],
      source: "test",
      access_count: 0,
      last_accessed: null,
      entities: ["HelloWorld"],
      hash: "sha256:test",
      content_ref: "sha256:test",
    } as Record<string, unknown>;

    await addRowsWithSchemaCompatibility(table as any, [newRow]);

    const count = await table.countRows();
    expect(count).toBe(1);

    const rows = await table.query().limit(10).toArray();
    const row = rows[0] as any;
    expect(row.id).toBe(newRow.id);

    /**
     * 重点验证：
     * - 旧表没有的字段不应该导致写入失败
     * - 写入后结果对象里也不应该凭空出现这些字段
     */
    expect(row.access_count).toBeUndefined();
    expect(row.entities).toBeUndefined();
    expect(row.hash).toBeUndefined();
    expect(row.content_ref).toBeUndefined();

    await (table as any)?.close?.();
    await (db as any)?.close?.();
    await fs.rm(tmpDbPath, { recursive: true, force: true });
  });

  test("按 schema 过滤：ClawMem 老表缺 access_count 等字段仍可写入", async () => {
    const tmpDbPath = path.join(os.tmpdir(), `memohub-lancedb-compat-${randomUUID()}`);

    const db = await lancedb.connect(tmpDbPath);
    const tableName = "clawmem";

    const oldSeed = {
      id: "__schema__",
      text: "",
      vector: [0, 0, 0],
      ast_type: "unknown",
      symbol_name: "",
      parent_symbol: "",
      file_path: "",
      language: "unknown",
      importance: 0,
      timestamp: new Date().toISOString(),
      tags: ["seed"],
      source: "seed",
    };

    const table = await db.createTable(tableName, [oldSeed]);
    await table.delete('id = "__schema__"');

    const newRow = {
      id: `clawmem-${Date.now()}-compat`,
      text: "export function a() { return 1 }",
      vector: [1, 2, 3],
      ast_type: "function",
      symbol_name: "a",
      parent_symbol: "",
      file_path: "src/a.ts",
      language: "typescript",
      importance: 0.5,
      timestamp: new Date().toISOString(),
      tags: ["compat"],
      source: "test",
      access_count: 0,
      last_accessed: null,
      entities: ["a"],
      hash: "sha256:test",
      content_ref: "sha256:test",
    } as Record<string, unknown>;

    await addRowsWithSchemaCompatibility(table as any, [newRow]);

    const count = await table.countRows();
    expect(count).toBe(1);

    const rows = await table.query().limit(10).toArray();
    const row = rows[0] as any;
    expect(row.id).toBe(newRow.id);

    expect(row.access_count).toBeUndefined();
    expect(row.entities).toBeUndefined();
    expect(row.hash).toBeUndefined();
    expect(row.content_ref).toBeUndefined();

    await (table as any)?.close?.();
    await (db as any)?.close?.();
    await fs.rm(tmpDbPath, { recursive: true, force: true });
  });

  test("错误驱动剔除：schema 不可用时按报错字段名重试", async () => {
    const calls: Array<Array<Record<string, unknown>>> = [];

    const mockTable = {
      async add(rows: Array<Record<string, unknown>>) {
        calls.push(rows.map((r) => ({ ...r })));

        if (calls.length === 1) {
          throw new Error("Schema does not contain field 'access_count'");
        }
      },
      schema: undefined,
    };

    await addRowsWithSchemaCompatibility(mockTable, [
      {
        id: "x",
        text: "t",
        access_count: 1,
      },
    ]);

    expect(calls.length).toBe(2);
    expect((calls[1]?.[0] as any)?.access_count).toBeUndefined();
  });
});

