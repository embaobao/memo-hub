import { describe, it, expect, beforeAll } from "bun:test";
import { MemoryKernel } from "./kernel.js";
import { ConfigLoader } from "@memohub/config";
import { MemoOp } from "@memohub/protocol";
import * as fs from "node:fs";
import * as path from "node:path";

describe("Flow Engine Integration", () => {
  let kernel: MemoryKernel;

  beforeAll(async () => {
    // Setup a clean config environment
    const configDir = "./test-env";
    if (fs.existsSync(configDir)) fs.rmSync(configDir, { recursive: true });
    fs.mkdirSync(configDir, { recursive: true });

    // Create a minimal config for testing
    const configPath = path.join(configDir, "memohub.json");
    const loader = new ConfigLoader(configPath);
    const config = loader.getConfig();

    // Inject mock provider
    config.ai.providers = [{ id: "mock", type: "mock" }];
    config.ai.agents = {
      embedder: { provider: "mock", model: "mock-model", dimensions: 768 },
      ranker: { provider: "mock", model: "mock-model" },
    };

    // Update track-insight to use new interpolation syntax
    config.tracks = [
      {
        id: "track-insight",
        flows: {
          ADD: [
            {
              step: "storage",
              tool: "builtin:cas",
              input: { content: "{{payload.text}}" },
            },
            {
              step: "embedding",
              tool: "builtin:embedder",
              input: { text: "{{payload.text}}" },
            },
            {
              step: "indexing",
              tool: "builtin:vector",
              input: {
                id: "{{payload.id}}",
                vector: "{{nodes.embedding.vector}}",
                hash: "{{nodes.storage.hash}}",
                track_id: "track-insight",
                meta: { category: "{{payload.category}}" },
              },
            },
          ],
          RETRIEVE: [
            {
              step: "embedding",
              tool: "builtin:embedder",
              input: { text: "{{payload.query}}" },
            },
            {
              step: "searching",
              tool: "builtin:retriever",
              input: {
                vector: "{{nodes.embedding.vector}}",
                track_id: "track-insight",
                limit: "{{payload.limit}}",
              },
            },
          ],
        },
      },
      {
        id: "track-source",
        flow: [
          {
            step: "storage",
            tool: "builtin:cas",
            input: { content: "{{payload.content}}" },
          },
          {
            step: "embedding",
            tool: "builtin:embedder",
            input: { text: "{{payload.content}}" },
          },
          {
            step: "indexing",
            tool: "builtin:vector",
            input: {
              id: "{{payload.id}}",
              vector: "{{nodes.embedding.vector}}",
              hash: "{{nodes.storage.hash}}",
              track_id: "track-source",
              meta: {
                language: "{{payload.language}}",
                file_path: "{{payload.file_path}}",
              },
            },
          },
        ],
      },
    ];

    kernel = new MemoryKernel(config);
    await kernel.initialize();
  });

  it("should execute track-insight flow successfully", async () => {
    const result = await kernel.dispatch({
      op: MemoOp.ADD,
      trackId: "track-insight",
      payload: {
        id: "test-1",
        text: "Hello, this is a test for the flow engine.",
        category: "test",
      },
    });

    expect(result.success).toBe(true);
    expect(result.meta?.trackId).toBe("track-insight");
    expect(result.success).toBe(true);
  });

  it("should retrieve from track-insight flow successfully", async () => {
    const result = await kernel.dispatch({
      op: MemoOp.RETRIEVE,
      trackId: "track-insight",
      payload: {
        query: "test query",
        limit: 2,
      },
    });

    if (!result.success) console.error("RETRIEVE Error:", result.error);
    expect(result.success).toBe(true);
    expect(result.data.results).toBeDefined();
    expect(Array.isArray(result.data.results)).toBe(true);
  });

  it("should execute track-source flow successfully", async () => {
    const result = await kernel.dispatch({
      op: MemoOp.ADD,
      trackId: "track-source",
      payload: {
        id: "code-1",
        content: 'console.log("hello world");',
        language: "typescript",
        file_path: "test.ts",
      },
    });

    expect(result.success).toBe(true);
    expect(result.meta?.trackId).toBe("track-source");
  });

  it("should handle missing tracks gracefully", async () => {
    const result = await kernel.dispatch({
      op: MemoOp.ADD,
      trackId: "non-existent",
      payload: { text: "fail" },
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("轨道定义不存在");
  });
});
