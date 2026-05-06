import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test } from "bun:test";
import { ContentAddressableStorage } from "@memohub/storage-flesh";
import { ChannelRegistry } from "@memohub/channel";
import {
  MemoryService,
  UnifiedMemoryRuntime,
  extractHermesMemoryCandidates,
} from "../../src/index.js";

class FakeVectorStorage {
  records: any[] = [];

  async initialize() {}

  async add(records: any | any[]) {
    this.records.push(...(Array.isArray(records) ? records : [records]));
  }

  async search(queryVector: number[], options?: { limit?: number }) {
    const limit = options?.limit ?? this.records.length;
    return this.records
      .map((record) => {
        const vector = Array.isArray(record.vector) ? record.vector : [];
        const distance = Math.abs((vector[0] ?? 0) - (queryVector[0] ?? 0));
        return { ...record, _distance: distance / 100 };
      })
      .sort((left, right) => Number(left._distance ?? 0) - Number(right._distance ?? 0))
      .slice(0, limit);
  }

  async list() {
    return this.records;
  }
}

const fakeEmbedder = {
  async embed(text: string) {
    return [text.length, 1, 0];
  },
};

describe("memory service", () => {
  let tempDir: string | undefined;

  afterEach(async () => {
    if (tempDir) await rm(tempDir, { recursive: true, force: true });
  });

  test("writes memory through the shared service and builds actor overview", async () => {
    tempDir = await mkdtemp(join(tmpdir(), "memohub-memory-"));
    const runtime = new UnifiedMemoryRuntime({
      cas: new ContentAddressableStorage(join(tempDir, "blobs")),
      vector: new FakeVectorStorage() as never,
      embedder: fakeEmbedder as never,
      channels: new ChannelRegistry(join(tempDir, "state", "channels.json")),
    });
    const service = new MemoryService(runtime);

    await service.initialize();
    await service.writeMemory({
      text: "Hermes prefers reading memohub://tools before querying.",
      source: "hermes" as never,
      channel: "hermes:primary:memo-hub",
      projectId: "memo-hub",
      category: "preference",
      metadata: { actorId: "hermes" },
    });

    const overview = await service.listOverview(10);
    expect(overview).toHaveLength(1);
    expect(overview[0]?.actorId).toBe("hermes");
    expect(overview[0]?.projectId).toBe("memo-hub");
  });

  test("builds Hermes prefetch summary from the shared runtime", async () => {
    tempDir = await mkdtemp(join(tmpdir(), "memohub-memory-prefetch-"));
    const runtime = new UnifiedMemoryRuntime({
      cas: new ContentAddressableStorage(join(tempDir, "blobs")),
      vector: new FakeVectorStorage() as never,
      embedder: fakeEmbedder as never,
      channels: new ChannelRegistry(join(tempDir, "state", "channels.json")),
    });
    const service = new MemoryService(runtime);

    await service.initialize();
    await service.writeMemory({
      text: "Hermes 默认先查自己的长期习惯，再看当前项目要点。",
      source: "hermes" as never,
      channel: "hermes:primary:memo-hub",
      projectId: "memo-hub",
      category: "habit",
      metadata: { actorId: "hermes" },
    });

    const summary = await service.prefetchHermes({
      actorId: "hermes",
      projectId: "memo-hub",
      channel: {
        channelId: "hermes:primary:memo-hub",
        actorId: "hermes",
        source: "hermes",
        projectId: "memo-hub",
        purpose: "primary",
      },
    });

    expect(summary.channel.channelId).toBe("hermes:primary:memo-hub");
    expect(summary.actorSummary.length).toBeGreaterThan(0);
    expect(summary.nextActions.length).toBeGreaterThan(0);
  });

  test("extracts deterministic Hermes candidates for preference, activity, fact, and clarification", () => {
    const candidates = extractHermesMemoryCandidates({
      userMessage: "以后都先查自己记忆。我正在做 Hermes 接入，项目约定是使用 Connector -> Channel -> Memory。",
      assistantMessage: "澄清一下，不是多轨模型，应该是统一记忆模型。",
      projectId: "memo-hub",
      channelId: "hermes:test:memo-hub:validation",
      sessionId: "session-1",
    });

    expect(candidates.some((item) => item.category === "preference")).toBe(true);
    expect(candidates.some((item) => item.category === "activity")).toBe(true);
    expect(candidates.some((item) => item.category === "project_fact")).toBe(true);
    expect(candidates.some((item) => item.category === "clarification")).toBe(true);
  });
});
