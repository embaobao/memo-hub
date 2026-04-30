import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test } from "bun:test";
import { VectorStorage } from "../../src/index.js";

describe("VectorStorage unified memory schema", () => {
  let tempDir: string | undefined;

  afterEach(async () => {
    if (tempDir) await rm(tempDir, { recursive: true, force: true });
  });

  test("supports first Hermes-style unified memory record on a clean table", async () => {
    tempDir = await mkdtemp(join(tmpdir(), "memohub-vector-"));
    const storage = new VectorStorage({
      dbPath: join(tempDir, "lancedb"),
      tableName: "memohub",
      dimensions: 3,
    });

    await storage.initialize();

    await storage.add({
      id: "mem_evt_hermes:content:0",
      vector: [0.1, 0.2, 0.3],
      hash: "hash-hermes",
      track_id: "track-habits",
      entities: [],
      timestamp: "2026-04-30T00:00:00.000Z",
      memory_id: "mem_evt_hermes",
      content_index: 0,
      scope_types: ["agent", "project"],
      scope_ids: ["hermes", "memo-hub"],
      visibility: "shared",
      domain_types: ["habit-convention", "project-knowledge"],
      state: "raw",
      source_type: "agent",
      source_id: "hermes",
      actor_id: "hermes",
      text: "Hermes uses MemoHub as its memory center.",
    });

    const records = await storage.list(undefined, 10);
    expect(records).toHaveLength(1);
    expect(records[0].memory_id).toBe("mem_evt_hermes");
    expect(records[0].scope_types).toEqual(["agent", "project"]);
    expect(records[0].domain_types).toContain("habit-convention");
  });
});
