import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test } from "bun:test";
import { ContentAddressableStorage } from "@memohub/storage-flesh";
import { UnifiedMemoryRuntime } from "../../src/unified-memory-runtime.js";

class FakeVectorStorage {
  records: any[] = [];

  async initialize() {
    // 测试替身不需要初始化外部数据库。
  }

  async add(records: any | any[]) {
    this.records.push(...(Array.isArray(records) ? records : [records]));
  }

  async search() {
    return this.records;
  }
}

const fakeEmbedder = {
  async embed(text: string) {
    // 使用稳定的轻量向量，避免测试依赖真实模型服务。
    return [text.length, 1, 0];
  },
};

describe("UnifiedMemoryRuntime business chain", () => {
  let tempDir: string | undefined;

  afterEach(async () => {
    if (tempDir) await rm(tempDir, { recursive: true, force: true });
  });

  test("ingests event into canonical memory object and recalls layered context view", async () => {
    tempDir = await mkdtemp(join(tmpdir(), "memohub-runtime-"));
    const vector = new FakeVectorStorage();
    const runtime = new UnifiedMemoryRuntime({
      cas: new ContentAddressableStorage(join(tempDir, "blobs")),
      vector: vector as never,
      embedder: fakeEmbedder,
    });

    await runtime.initialize();

    const ingestResult = await runtime.ingest({
      id: "evt-runtime-1",
      source: "gemini" as never,
      channel: "agent-session",
      kind: "memory" as never,
      projectId: "memo-hub",
      confidence: "observed" as never,
      payload: {
        text: "MemoHub query uses self project global layered recall",
        kind: "memory",
        category: "architecture",
      },
    });

    expect(ingestResult.success).toBe(true);
    expect(ingestResult.canonicalEvent?.source).toMatchObject({
      type: "agent",
      id: "gemini",
      vendor: "google",
    });
    expect(ingestResult.memoryObject?.scopes.map((scope) => scope.type)).toContain("project");
    expect(vector.records).toHaveLength(1);

    const view = await runtime.queryView({
      view: "project_context",
      projectId: "memo-hub",
      query: "layered recall",
      limit: 5,
    });

    expect(view.view).toBe("project_context");
    expect(view.projectContext).toHaveLength(1);
    expect(view.projectContext[0].object.id).toBe("mem_evt-runtime-1");
    expect(view.metadata.layers.project).toBe(1);
  });

  test("resolves clarification answer into searchable project memory", async () => {
    tempDir = await mkdtemp(join(tmpdir(), "memohub-runtime-"));
    const vector = new FakeVectorStorage();
    const runtime = new UnifiedMemoryRuntime({
      cas: new ContentAddressableStorage(join(tempDir, "blobs")),
      vector: vector as never,
      embedder: fakeEmbedder,
    });

    await runtime.initialize();

    const result = await runtime.resolveClarification({
      clarificationId: "clarify-runtime-1",
      answer: "当前以 UnifiedMemoryRuntime 和命名视图查询为准。",
      resolvedBy: "hermes",
      actorId: "hermes",
      projectId: "memo-hub",
      memoryIds: ["mem-old-note"],
      question: "旧 track 说明和新架构说明冲突时以谁为准？",
    });

    expect(result.success).toBe(true);
    expect(result.clarification.status).toBe("resolved");
    expect(result.memoryObject?.state).toBe("curated");
    expect(result.memoryObject?.links?.map((link) => link.type)).toContain("resolves");

    const view = await runtime.queryView({
      view: "project_context",
      actorId: "hermes",
      projectId: "memo-hub",
      query: "UnifiedMemoryRuntime",
      limit: 5,
    });

    expect(view.projectContext.some((item) => item.object.metadata?.operationType === "resolve_clarification")).toBe(true);
  });

  test("recalls code memory through coding_context view", async () => {
    tempDir = await mkdtemp(join(tmpdir(), "memohub-runtime-"));
    const vector = new FakeVectorStorage();
    const runtime = new UnifiedMemoryRuntime({
      cas: new ContentAddressableStorage(join(tempDir, "blobs")),
      vector: vector as never,
      embedder: fakeEmbedder,
    });

    await runtime.initialize();

    await runtime.ingest({
      id: "evt-code-1",
      source: "ide" as never,
      channel: "vscode",
      kind: "memory" as never,
      projectId: "memo-hub",
      confidence: "observed" as never,
      payload: {
        text: "apps/cli/src/mcp.ts registers memohub_query for coding_context reads",
        kind: "memory",
        file_path: "apps/cli/src/mcp.ts",
        category: "mcp-code",
      },
    });

    const view = await runtime.queryView({
      view: "coding_context",
      projectId: "memo-hub",
      query: "memohub_query coding_context",
      limit: 5,
    });

    expect(view.projectContext).toHaveLength(1);
    expect(view.projectContext[0].object.domains.map((domain) => domain.type)).toContain("code-intelligence");
  });
});
