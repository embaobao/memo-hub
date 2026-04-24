import { describe, expect, test } from "bun:test";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { randomUUID } from "node:crypto";
import { ContentAddressableStorage } from "./cas.js";

describe("ContentAddressableStorage（CAS 原文存储）", () => {
  test("putText：以 sha256 命名落盘，并可 listAllHashes 找回", async () => {
    const tmpRoot = path.join(os.tmpdir(), `memohub-cas-test-${randomUUID()}`);
    const cas = new ContentAddressableStorage({ root_path: tmpRoot });

    const { contentHash, contentRef } = await cas.putText("hello");

    expect(contentHash).toBe(cas.computeSha256("hello"));
    expect(contentRef).toBe(`sha256:${contentHash}`);

    const filePath = cas.resolvePathByHash(contentHash);
    const stored = await fs.readFile(filePath, "utf8");
    expect(stored).toBe("hello");

    const hashes = await cas.listAllHashes();
    expect(hashes.includes(contentHash)).toBe(true);

    await fs.rm(tmpRoot, { recursive: true, force: true });
  });

  test("putText：幂等写入（同内容多次写入不报错）", async () => {
    const tmpRoot = path.join(os.tmpdir(), `memohub-cas-test-${randomUUID()}`);
    const cas = new ContentAddressableStorage({ root_path: tmpRoot });

    const r1 = await cas.putText("same");
    const r2 = await cas.putText("same");

    expect(r1.contentHash).toBe(r2.contentHash);
    expect(r1.contentRef).toBe(r2.contentRef);

    await fs.rm(tmpRoot, { recursive: true, force: true });
  });
});

