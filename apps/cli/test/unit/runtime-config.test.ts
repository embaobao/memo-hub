import { afterEach, describe, expect, test } from "bun:test";
import { resolveRuntimeConfig } from "../../src/runtime-config.js";

const baseConfig = {
  configVersion: "unified-memory-1",
  system: { root: "~/.memohub", trace_enabled: true, log_level: "info", lang: "auto" },
  storage: {
    root: "~/.memohub",
    blobPath: "~/.memohub/blobs",
    vectorDbPath: "~/.memohub/data/memohub.lancedb",
    vectorTable: "memohub",
    dimensions: 768,
  },
  ai: {
    providers: [{ id: "local", type: "ollama", url: "http://localhost:11434/v1" }],
    agents: {
      embedder: { provider: "local", model: "nomic-embed-text-v2-moe", dimensions: 768 },
      summarizer: { provider: "local", model: "qwen2.5:7b" },
    },
  },
  mcp: {
    enabled: true,
    transport: "stdio",
    logPath: "~/.memohub/logs/mcp.ndjson",
    toolsResourceUri: "memohub://tools",
    statsResourceUri: "memohub://stats",
    exposeToolCatalog: true,
    exposeStatus: true,
  },
  memory: {
    queryLayers: ["self", "project", "global"],
    views: ["agent_profile", "project_context"],
    operations: ["ingest_event", "query"],
  },
  dispatcher: { fallback: "memory-object" },
  routing: {},
  tools: [],
  tracks: [],
};

describe("runtime config", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  test("maps deployment environment paths into the shared MemoHub storage fields", () => {
    process.env.MEMOHUB_DB_PATH = "/srv/memohub/shared/data/memohub.lancedb";
    process.env.MEMOHUB_CAS_PATH = "/srv/memohub/shared/blobs";
    process.env.EMBEDDING_URL = "http://localhost:11434/v1";
    process.env.EMBEDDING_MODEL = "nomic-embed-text-v2-moe";

    const config = resolveRuntimeConfig(baseConfig as never);

    expect(config.storage.vectorDbPath).toBe("/srv/memohub/shared/data/memohub.lancedb");
    expect(config.storage.blobPath).toBe("/srv/memohub/shared/blobs");
    expect(config.ai.providerUrl).toBe("http://localhost:11434/v1");
    expect(config.ai.embeddingModel).toBe("nomic-embed-text-v2-moe");
  });
});
