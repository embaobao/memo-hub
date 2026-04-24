import { expect, test, describe, beforeEach } from "bun:test";
import { RetrievalPipeline } from "./retrieval-pipeline.js";
import { MemoryKernel } from "../../core/src/kernel.js";
import { MockEmbedder, MockCompleter, MockCAS, MockVectorStorage } from "../../core/src/mocks.js";

describe("RetrievalPipeline (LightRAG Style)", () => {
  let pipeline: RetrievalPipeline;
  let kernel: any;

  beforeEach(async () => {
    kernel = new MemoryKernel({ 
        version: "1.0.0",
        system: { root: "/tmp", trace_enabled: true, log_level: "info" }, 
        tracks: [
            { id: "track-insight", flow: [] },
            { id: "track-source", flow: [] }
        ], 
        ai: { 
            providers: [{ id: "local", type: "mock" }], 
            agents: { 
                embedder: { provider: "local", model: "mock" },
                summarizer: { provider: "local", model: "mock" }
            } 
        }, 
        dispatcher: { fallback: "track-insight" } 
    } as any);
    const mockEmbedder = new MockEmbedder();
    kernel.setComponents({
      embedder: mockEmbedder,
      completer: new MockCompleter(),
      cas: new MockCAS(),
      vector: new MockVectorStorage()
    });
    
    pipeline = new RetrievalPipeline(kernel, mockEmbedder);
  });

  test("should execute full pipeline stages", async () => {
    const result = await pipeline.execute("How to use MemoryKernel?");
    
    expect(result.pre).toBeDefined();
    expect(result.exec).toBeDefined();
    expect(result.post).toBeDefined();
    expect(result.duration).toBeGreaterThan(0);
  });

  test("should identify intent correctly in Pre-processing", async () => {
    // Note: Mock PreProcessor uses simple heuristics if LLM not used
    const result = await pipeline.execute("Show me code for adding tracks");
    expect(result.pre.intent.type).toBeDefined();
  });
});
