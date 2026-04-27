import { describe, test, expect, beforeEach } from "bun:test";
import { MemoryKernel } from "./kernel.js";
import {
  MockEmbedder,
  MockCompleter,
  MockCAS,
  MockVectorStorage,
} from "./mocks.js";
import { MemoOp, ITrackProvider, InstructionState } from "@memohub/protocol";

class MockTrack implements ITrackProvider {
  id = "track-test";
  name = "Mock Track";
  async initialize() {}
  async execute(instruction: any) {
    if (instruction.op === MemoOp.ADD) return { success: true, data: { hashed: true } };
    return { success: false, error: "Not supported" };
  }
}

describe("MemoryKernel State-Machine Dispatch", () => {
  let kernel: MemoryKernel;

  beforeEach(async () => {
    kernel = new MemoryKernel({
      version: "1.0.0",
      system: { root: "/tmp/test", trace_enabled: true, log_level: "info" },
      ai: { providers: [], agents: {} },
      dispatcher: { fallback: "track-test" },
      tracks: [{ id: "track-test" }],
    } as any);

    kernel.setComponents({
      embedder: new MockEmbedder(),
      completer: new MockCompleter(),
      cas: new MockCAS(),
      vector: new MockVectorStorage(),
    });
    
    await kernel.initialize();
    await kernel.registerTrack(new MockTrack());
  });

  test("dispatches instruction to registered track", async () => {
    const result = await kernel.dispatch({
      op: MemoOp.ADD,
      trackId: "track-test",
      payload: { text: "hello" },
    });
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.meta?.state).toBe(InstructionState.COMMITTED);
  });

  test("returns error for unregistered track", async () => {
    const result = await kernel.dispatch({
      op: MemoOp.ADD,
      trackId: "unknown",
      payload: {},
    });
    expect(result.success).toBe(false);
    expect(result.error?.message).toContain("Track not found");
  });
});
