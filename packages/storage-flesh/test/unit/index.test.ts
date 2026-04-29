import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { ContentAddressableStorage } from "../../src/index.js";

const tmpDir = path.join(os.tmpdir(), `cas-test-${Date.now()}`);
let cas: ContentAddressableStorage;

beforeEach(() => {
  cas = new ContentAddressableStorage(tmpDir);
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
});

describe("ContentAddressableStorage", () => {
  it("computes deterministic SHA-256 hash", () => {
    const h1 = cas.computeHash("hello");
    const h2 = cas.computeHash("hello");
    expect(h1).toBe(h2);
    expect(h1).toHaveLength(64);
  });

  it("writes and reads content", async () => {
    const hash = await cas.write("Hello, World!");
    const content = await cas.read(hash);
    expect(content).toBe("Hello, World!");
  });

  it("deduplicates identical content", async () => {
    const h1 = await cas.write("same content");
    const h2 = await cas.write("same content");
    expect(h1).toBe(h2);
  });

  it("checks blob existence", async () => {
    const hash = await cas.write("exists test");
    expect(await cas.has(hash)).toBe(true);
    expect(
      await cas.has(
        "0000000000000000000000000000000000000000000000000000000000000000",
      ),
    ).toBe(false);
  });

  it("deletes existing blob", async () => {
    const hash = await cas.write("to be deleted");
    await cas.delete(hash);
    expect(await cas.has(hash)).toBe(false);
  });

  it("delete is idempotent for non-existent blob", async () => {
    await expect(
      cas.delete(
        "0000000000000000000000000000000000000000000000000000000000000000",
      ),
    ).resolves.toBeUndefined();
  });

  it("throws on reading non-existent blob", async () => {
    expect(
      cas.read(
        "0000000000000000000000000000000000000000000000000000000000000000",
      ),
    ).rejects.toThrow("Blob not found");
  });

  it("creates directory structure on first write", async () => {
    const freshDir = path.join(os.tmpdir(), `cas-fresh-${Date.now()}`);
    const freshCas = new ContentAddressableStorage(freshDir);
    await freshCas.write("first write");
    await fs.rm(freshDir, { recursive: true, force: true });
  });
});
