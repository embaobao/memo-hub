import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test } from "bun:test";
import { ContentAddressableStorage } from "@memohub/storage-flesh";
import { ChannelRegistry } from "../../src/channel-registry.js";
import { UnifiedMemoryRuntime } from "../../src/unified-memory-runtime.js";

class FakeVectorStorage {
  records: any[] = [];

  async initialize() {
    // 测试替身不需要初始化外部数据库。
  }

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
      channels: new ChannelRegistry(join(tempDir, "state", "channels.json")),
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
      channels: new ChannelRegistry(join(tempDir, "state", "channels.json")),
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
      channels: new ChannelRegistry(join(tempDir, "state", "channels.json")),
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

  test("recalls Hermes memory in agent_profile after a real agent-scoped write", async () => {
    tempDir = await mkdtemp(join(tmpdir(), "memohub-runtime-"));
    const vector = new FakeVectorStorage();
    const runtime = new UnifiedMemoryRuntime({
      cas: new ContentAddressableStorage(join(tempDir, "blobs")),
      vector: vector as never,
      embedder: fakeEmbedder,
      channels: new ChannelRegistry(join(tempDir, "state", "channels.json")),
    });

    await runtime.initialize();

    await runtime.ingest({
      id: "evt-hermes-profile-1",
      source: "hermes" as never,
      channel: "hermes:primary:memo-hub",
      kind: "memory" as never,
      projectId: "memo-hub",
      confidence: "reported" as never,
      payload: {
        text: "Hermes should treat MemoHub as its durable memory center.",
        kind: "memory",
        category: "habit-convention",
      },
    });

    // 模拟真实库里向量候选召回过浅；运行时应能通过兜底扫描补回 Hermes 自身记忆。
    vector.search = async () => [];

    const view = await runtime.queryView({
      view: "agent_profile",
      actorId: "hermes",
      projectId: "memo-hub",
      query: "durable memory center",
      limit: 5,
    });

    expect(view.selfContext).toHaveLength(1);
    expect(view.selfContext[0].object.actor?.id).toBe("hermes");
    expect(view.selfContext[0].object.content[0]?.text).toContain("durable memory center");
  });

  test("ranks the most relevant newly written actor memory ahead of older broader memories", async () => {
    tempDir = await mkdtemp(join(tmpdir(), "memohub-runtime-"));
    const vector = new FakeVectorStorage();
    const runtime = new UnifiedMemoryRuntime({
      cas: new ContentAddressableStorage(join(tempDir, "blobs")),
      vector: vector as never,
      embedder: fakeEmbedder,
      channels: new ChannelRegistry(join(tempDir, "state", "channels.json")),
    });

    await runtime.initialize();

    await runtime.ingest({
      id: "evt-hermes-old-1",
      source: "hermes" as never,
      channel: "hermes:primary:memo-hub",
      kind: "memory" as never,
      projectId: "memo-hub",
      confidence: "reported" as never,
      payload: {
        text: "Hermes first real onboarding verification: MemoHub is Hermes durable memory center and shared project context hub.",
        kind: "memory",
        category: "habit-convention",
      },
    });

    await runtime.ingest({
      id: "evt-hermes-new-1",
      source: "hermes" as never,
      channel: "hermes:test:memo-hub:actor-first-check",
      kind: "memory" as never,
      projectId: "memo-hub",
      confidence: "reported" as never,
      payload: {
        text: "Hermes actor-first governance validation memory",
        kind: "memory",
        category: "project-knowledge",
      },
    });

    const view = await runtime.queryView({
      view: "project_context",
      actorId: "hermes",
      projectId: "memo-hub",
      query: "Hermes actor-first governance validation memory",
      limit: 5,
    });

    expect(view.selfContext).toHaveLength(2);
    expect(view.selfContext[0].object.id).toBe("mem_evt-hermes-new-1");
    expect(view.projectContext[0].object.id).toBe("mem_evt-hermes-new-1");
  });

  test("lists governed memories directly by actor perspective without semantic query dependency", async () => {
    tempDir = await mkdtemp(join(tmpdir(), "memohub-runtime-"));
    const vector = new FakeVectorStorage();
    const runtime = new UnifiedMemoryRuntime({
      cas: new ContentAddressableStorage(join(tempDir, "blobs")),
      vector: vector as never,
      embedder: fakeEmbedder,
      channels: new ChannelRegistry(join(tempDir, "state", "channels.json")),
    });

    await runtime.initialize();

    await runtime.ingest({
      id: "evt-hermes-list-1",
      source: "hermes" as never,
      channel: "hermes:test:memo-hub:list",
      kind: "memory" as never,
      projectId: "memo-hub",
      confidence: "reported" as never,
      payload: {
        text: "Hermes governance list validation memory",
        kind: "memory",
        category: "project-knowledge",
      },
    });

    const memories = await runtime.listMemories({
      perspective: "actor",
      actorId: "hermes",
      limit: 10,
    });

    expect(memories.some((memory) => memory.id === "mem_evt-hermes-list-1")).toBe(true);
  });

  test("lists memories across projects without assuming a default project", async () => {
    tempDir = await mkdtemp(join(tmpdir(), "memohub-runtime-"));
    const vector = new FakeVectorStorage();
    const runtime = new UnifiedMemoryRuntime({
      cas: new ContentAddressableStorage(join(tempDir, "blobs")),
      vector: vector as never,
      embedder: fakeEmbedder,
      channels: new ChannelRegistry(join(tempDir, "state", "channels.json")),
    });

    await runtime.initialize();

    await runtime.ingest({
      id: "evt-overview-1",
      source: "hermes" as never,
      channel: "hermes:primary:hermes-cli",
      kind: "memory" as never,
      projectId: "hermes-cli",
      confidence: "reported" as never,
      payload: {
        text: "Hermes overview memory in hermes-cli project",
        kind: "memory",
        category: "project-knowledge",
      },
    });

    const globalMemories = await runtime.listMemories({
      perspective: "global",
      limit: 20,
    });

    expect(globalMemories.length).toBeGreaterThan(0);
    expect(globalMemories.some((memory) => memory.subject?.id === "hermes-cli")).toBe(true);
  });
});
