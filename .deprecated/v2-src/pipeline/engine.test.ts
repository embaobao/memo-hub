import { describe, expect, test } from "bun:test";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { randomUUID } from "node:crypto";
import type { RoutingConfig, TrackProvider } from "../types/index.js";
import { MemoEngine } from "./engine.js";
import { ContentAddressableStorage } from "../core/cas.js";

describe("MemoEngine（反应式管道骨架）", () => {
  test("写入管：默认路由到 gbrain，带 filePath 可推断 clawmem", async () => {
    const calls: string[] = [];

    const gbrainProvider: TrackProvider = {
      track: "gbrain",
      ingest: async ({ text = "" }) => {
        calls.push(`gbrain.ingest:${text}`);
        return {
          track: "gbrain",
          text,
          contentHash: "h-gbrain",
        };
      },
      retrieve: async () => [],
    };

    const clawmemProvider: TrackProvider = {
      track: "clawmem",
      ingest: async ({ text = "" }) => {
        calls.push(`clawmem.ingest:${text}`);
        return {
          track: "clawmem",
          text,
          contentHash: "h-clawmem",
        };
      },
      retrieve: async () => [],
    };

    const engine = new MemoEngine({
      providers: [gbrainProvider, clawmemProvider],
    });

    const r1 = await engine.ingest({ text: "hello" });
    expect(r1.track).toBe("gbrain");
    expect(calls).toEqual(["gbrain.ingest:hello"]);

    const r2 = await engine.ingest({
      text: "export const a = 1;",
      context: { filePath: "src/a.ts" },
    });
    expect(r2.track).toBe("clawmem");
    expect(calls).toEqual(["gbrain.ingest:hello", "clawmem.ingest:export const a = 1;"]);
  });

  test("写入管：支持 routing 配置覆盖 + route_track 阶段可观测", async () => {
    const calls: string[] = [];
    const routeObservations: Array<{ track?: unknown; rule?: unknown; reason?: unknown }> = [];

    const gbrainProvider: TrackProvider = {
      track: "gbrain",
      ingest: async ({ text = "" }) => {
        calls.push(`gbrain.ingest:${text}`);
        return { track: "gbrain", text };
      },
      retrieve: async () => [],
    };

    const clawmemProvider: TrackProvider = {
      track: "clawmem",
      ingest: async ({ text = "" }) => {
        calls.push(`clawmem.ingest:${text}`);
        return { track: "clawmem", text };
      },
      retrieve: async () => [],
    };

    const routing: RoutingConfig = {
      enabled: true,
      default_track: "gbrain",
      /**
       * 这里刻意把“代码后缀列表”缩到最小：
       * - 只有 .md 才会路由到 clawmem
       * - 其它一律走默认轨道 gbrain
       */
      code_suffixes: [".md"],
    };

    const engine = new MemoEngine({
      providers: [gbrainProvider, clawmemProvider],
      routing,
    });

    const unsub = engine.events.on("stage_success", ({ pipe, stage, output }) => {
      if (pipe !== "ingestion" || stage !== "route_track") {
        return;
      }
      const out = output as any;
      const routingMeta = out?.metadata?.__pipeline?.routing;
      routeObservations.push({
        track: routingMeta?.track,
        rule: routingMeta?.rule,
        reason: routingMeta?.reason,
      });
    });

    const r1 = await engine.ingest({
      text: "export const a = 1;",
      context: { filePath: "src/a.ts" },
    });
    expect(r1.track).toBe("gbrain");

    const r2 = await engine.ingest({
      text: "# README",
      context: { filePath: "README.md" },
    });
    expect(r2.track).toBe("clawmem");

    unsub();

    expect(calls).toEqual(["gbrain.ingest:export const a = 1;", "clawmem.ingest:# README"]);
    expect(routeObservations.length).toBe(2);
    expect(routeObservations.every((o) => typeof o.track === "string")).toBe(true);
    expect(routeObservations.every((o) => typeof o.rule === "string")).toBe(true);
    expect(routeObservations.every((o) => typeof o.reason === "string")).toBe(true);
  });

  test("检索管：多轨并行召回 + 合并排序 + 事件流可订阅", async () => {
    const events: string[] = [];

    const gbrainProvider: TrackProvider = {
      track: "gbrain",
      ingest: async ({ text = "" }) => ({ track: "gbrain", text }),
      retrieve: async ({ query = "" }) => {
        return [
          { track: "gbrain", text: `kb:${query}`, score: 0.2, contentHash: "h1" },
        ];
      },
    };

    const clawmemProvider: TrackProvider = {
      track: "clawmem",
      ingest: async ({ text = "" }) => ({ track: "clawmem", text }),
      retrieve: async ({ query = "" }) => {
        return [
          { track: "clawmem", text: `code:${query}`, score: 0.9, contentHash: "h2" },
        ];
      },
    };

    const engine = new MemoEngine({
      providers: [gbrainProvider, clawmemProvider],
    });

    const unsub1 = engine.events.on("pipe_start", ({ pipe }) => events.push(`pipe_start:${pipe}`));
    const unsub2 = engine.events.on("stage_start", ({ pipe, stage }) =>
      events.push(`stage_start:${pipe}:${stage ?? ""}`)
    );
    const unsub3 = engine.events.on("pipe_success", ({ pipe }) => events.push(`pipe_success:${pipe}`));

    const results = await engine.retrieve({ query: "hello", limit: 10 });

    unsub1();
    unsub2();
    unsub3();

    expect(results.map((r) => r.track)).toEqual(["clawmem", "gbrain"]);
    expect(events.includes("pipe_start:retrieval")).toBe(true);
    expect(events.some((e) => e.startsWith("stage_start:retrieval:normalize_request"))).toBe(true);
    expect(events.some((e) => e.startsWith("stage_start:retrieval:vector_recall"))).toBe(true);
    expect(events.some((e) => e.startsWith("stage_start:retrieval:fts_recall"))).toBe(true);
    expect(events.some((e) => e.startsWith("stage_start:retrieval:assemble_results"))).toBe(true);
    expect(events.some((e) => e.startsWith("stage_start:retrieval:hydrate_records"))).toBe(true);
    expect(events.includes("pipe_success:retrieval")).toBe(true);
  });

  test("检索管：FTS 可选插槽 + 多路合并去重（同 hash 取高分并补齐 text）", async () => {
    const provider: TrackProvider = {
      track: "gbrain",
      ingest: async ({ text = "" }) => ({ track: "gbrain", text }),
      retrieve: async ({ query = "" }) => {
        return [
          {
            track: "gbrain",
            text: "",
            score: 0.6,
            contentHash: `hash:${query}`,
            contentRef: `sha256:hash:${query}`,
          },
        ];
      },
      retrieveFTS: async ({ query = "" }) => {
        return [
          {
            track: "gbrain",
            text: `fts:${query}`,
            score: 0.2,
            contentHash: `hash:${query}`,
            contentRef: `sha256:hash:${query}`,
          },
        ];
      },
    };

    const engine = new MemoEngine({ providers: [provider] });

    const results = await engine.retrieve({
      query: "hello",
      limit: 10,
      fts: { enabled: true },
    });

    expect(results.length).toBe(1);
    expect(results[0].score).toBe(0.6);
    expect(results[0].text).toBe("fts:hello");
  });

  test("检索管：需要时 Hydration 回填原文；hydrate=false 时不回填", async () => {
    const tmpRoot = path.join(os.tmpdir(), `memohub-retrieval-hydration-test-${randomUUID()}`);
    const cas = new ContentAddressableStorage({ root_path: tmpRoot });
    const { contentHash, contentRef } = await cas.putText("payload");

    const provider: TrackProvider = {
      track: "gbrain",
      ingest: async ({ text = "" }) => ({ track: "gbrain", text }),
      retrieve: async () => {
        return [
          {
            track: "gbrain",
            text: "",
            score: 0.9,
            contentHash,
            contentRef,
          },
        ];
      },
    };

    const engine = new MemoEngine({ providers: [provider], cas });

    const hydrated = await engine.retrieve({ query: "x", limit: 5 });
    expect(hydrated[0].text).toBe("payload");

    const notHydrated = await engine.retrieve({ query: "x", limit: 5, hydrate: false });
    expect(notHydrated[0].text).toBe("");

    await fs.rm(tmpRoot, { recursive: true, force: true });
  });

  test("治理管：最小冲突检测产出 CONFLICT_PENDING 事件 + 写入本地队列", async () => {
    const tmpRoot = path.join(os.tmpdir(), `memohub-governance-conflict-test-${randomUUID()}`);
    const queuePath = path.join(tmpRoot, "conflicts.ndjson");

    const prevEnv = {
      MEMOHUB_CONFLICT_QUEUE_PATH: process.env.MEMOHUB_CONFLICT_QUEUE_PATH,
      MEMOHUB_CONFLICT_THRESHOLD: process.env.MEMOHUB_CONFLICT_THRESHOLD,
      MEMOHUB_CONFLICT_STRATEGY: process.env.MEMOHUB_CONFLICT_STRATEGY,
      MEMOHUB_CONFLICT_MIN_TEXT_LENGTH: process.env.MEMOHUB_CONFLICT_MIN_TEXT_LENGTH,
    };

    process.env.MEMOHUB_CONFLICT_QUEUE_PATH = queuePath;
    process.env.MEMOHUB_CONFLICT_THRESHOLD = "0.9";
    process.env.MEMOHUB_CONFLICT_STRATEGY = "jaccard";
    process.env.MEMOHUB_CONFLICT_MIN_TEXT_LENGTH = "1";

    const gbrainProvider: TrackProvider = {
      track: "gbrain",
      ingest: async ({ text = "" }) => ({ track: "gbrain", text }),
      retrieve: async () => [],
    };

    const engine = new MemoEngine({ providers: [gbrainProvider] });

    let captured: any = null;
    const unsub = engine.events.on("CONFLICT_PENDING", ({ output }) => {
      captured = output;
    });

    const result = await engine.govern({
      records: [
        { track: "gbrain", text: "Hello World 2026" },
        { track: "gbrain", text: "Hello World 2026" },
      ],
    });

    unsub();

    expect(result.conflicts.length).toBe(1);
    expect(captured?.name).toBe("CONFLICT_PENDING");
    expect(Array.isArray(captured?.candidates)).toBe(true);

    const lines = (await fs.readFile(queuePath, "utf-8"))
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    expect(lines.length).toBe(1);

    const persisted = JSON.parse(lines[0] ?? "{}");
    expect(persisted.type).toBe("CONFLICT_PENDING");
    expect(persisted.payload?.name).toBe("CONFLICT_PENDING");

    await fs.rm(tmpRoot, { recursive: true, force: true });
    process.env.MEMOHUB_CONFLICT_QUEUE_PATH = prevEnv.MEMOHUB_CONFLICT_QUEUE_PATH;
    process.env.MEMOHUB_CONFLICT_THRESHOLD = prevEnv.MEMOHUB_CONFLICT_THRESHOLD;
    process.env.MEMOHUB_CONFLICT_STRATEGY = prevEnv.MEMOHUB_CONFLICT_STRATEGY;
    process.env.MEMOHUB_CONFLICT_MIN_TEXT_LENGTH = prevEnv.MEMOHUB_CONFLICT_MIN_TEXT_LENGTH;
  });

  test("治理管：裁决回流入口可把 resolution 重新进入写入管", async () => {
    const tmpRoot = path.join(os.tmpdir(), `memohub-governance-resolution-test-${randomUUID()}`);
    const queuePath = path.join(tmpRoot, "conflicts.ndjson");

    const prevQueuePath = process.env.MEMOHUB_CONFLICT_QUEUE_PATH;
    process.env.MEMOHUB_CONFLICT_QUEUE_PATH = queuePath;

    const calls: string[] = [];
    const gbrainProvider: TrackProvider = {
      track: "gbrain",
      ingest: async ({ text = "" }) => {
        calls.push(`gbrain.ingest:${text}`);
        return { track: "gbrain", text };
      },
      retrieve: async () => [],
    };

    const engine = new MemoEngine({ providers: [gbrainProvider] });

    const resolved = await engine.resolveConflict({
      conflict_id: "conflict-1",
      action: "merge",
      final_text: "最终裁决后的文本",
      track: "gbrain",
      context: { sessionId: "s1" },
      metadata: { from: "test" },
    });

    expect(resolved?.track).toBe("gbrain");
    expect(resolved?.text).toBe("最终裁决后的文本");
    expect(calls).toEqual(["gbrain.ingest:最终裁决后的文本"]);

    const lines = (await fs.readFile(queuePath, "utf-8"))
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    expect(lines.length).toBe(1);

    const persisted = JSON.parse(lines[0] ?? "{}");
    expect(persisted.type).toBe("CONFLICT_RESOLUTION");
    expect(persisted.payload?.conflict_id).toBe("conflict-1");

    await fs.rm(tmpRoot, { recursive: true, force: true });
    process.env.MEMOHUB_CONFLICT_QUEUE_PATH = prevQueuePath;
  });
});
