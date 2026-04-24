import { describe, expect, test } from "bun:test";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { randomUUID } from "node:crypto";
import { ContentAddressableStorage } from "./cas.js";
import { Hydrator } from "./hydration.js";

describe("Hydrator（Hydration 回填）", () => {
  test("当索引 text 为空时，可根据 contentRef/contentHash 回填原文", async () => {
    const tmpRoot = path.join(os.tmpdir(), `memohub-hydration-test-${randomUUID()}`);
    const cas = new ContentAddressableStorage({ root_path: tmpRoot });
    const hydrator = new Hydrator(cas);

    const { contentHash, contentRef } = await cas.putText("payload");

    const hydrated = await hydrator.hydrateRecord({
      track: "gbrain",
      text: "",
      contentHash,
      contentRef,
    });

    expect(hydrated.text).toBe("payload");

    await fs.rm(tmpRoot, { recursive: true, force: true });
  });

  test("当 contentHash 校验失败时，不回填（保持原样）", async () => {
    const tmpRoot = path.join(os.tmpdir(), `memohub-hydration-test-${randomUUID()}`);
    const cas = new ContentAddressableStorage({ root_path: tmpRoot });
    const hydrator = new Hydrator(cas);

    const { contentRef } = await cas.putText("payload");

    const hydrated = await hydrator.hydrateRecord({
      track: "gbrain",
      text: "",
      contentHash: "bad-hash",
      contentRef,
    });

    expect(hydrated.text).toBe("");

    await fs.rm(tmpRoot, { recursive: true, force: true });
  });

  test("当索引 text 已存在时，不触发 CAS 读取", async () => {
    const tmpRoot = path.join(os.tmpdir(), `memohub-hydration-test-${randomUUID()}`);
    const cas = new ContentAddressableStorage({ root_path: tmpRoot });
    const hydrator = new Hydrator(cas);

    const { contentHash, contentRef } = await cas.putText("payload");

    const hydrated = await hydrator.hydrateRecord({
      track: "gbrain",
      text: "index-text",
      contentHash,
      contentRef,
    });

    expect(hydrated.text).toBe("index-text");

    await fs.rm(tmpRoot, { recursive: true, force: true });
  });
});

