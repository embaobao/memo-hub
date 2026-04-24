import { describe, expect, test } from "bun:test";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { randomUUID } from "node:crypto";
import { FileIdempotencyStore } from "./file-idempotency-store.js";

describe("FileIdempotencyStore", () => {
  test("mark/has 基本幂等行为", async () => {
    const tmpDir = path.join(os.tmpdir(), `memohub-idempotency-${randomUUID()}`);
    const filePath = path.join(tmpDir, "keys.ndjson");

    const store = new FileIdempotencyStore({ filePath });

    expect(await store.has("k1")).toBe(false);

    await store.mark("k1");
    expect(await store.has("k1")).toBe(true);

    await store.mark("k1");
    expect(await store.has("k1")).toBe(true);

    const lines = (await fs.readFile(filePath, "utf-8"))
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    /**
     * 二次 mark 不应重复写入
     */
    expect(lines.length).toBe(1);

    await fs.rm(tmpDir, { recursive: true, force: true });
  });
});

