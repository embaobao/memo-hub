import { describe, expect, test } from "bun:test";
import { GBrainTrackProvider } from "./gbrain-provider.js";

describe("GBrainTrackProvider：写入时填充 entities（轻量实体抽取）", () => {
  test("默认启用实体抽取，并把 entities 透传到存储层与返回值", async () => {
    let captured: { entities?: string[] } | undefined;

    const provider = new GBrainTrackProvider({
      initialize: async () => {},
      addKnowledge: async (params) => {
        captured = { entities: params.entities };
        return "gbrain-1";
      },
      searchKnowledge: async () => [],
    });

    const result = await provider.ingest({
      text: "使用 MemoEngine v1.2.3 通过 config.embedding.url 接入 MCP",
      metadata: {},
    });

    expect(result.id).toBe("gbrain-1");
    expect(Array.isArray(captured?.entities)).toBe(true);
    expect(captured?.entities).toEqual(
      expect.arrayContaining(["MemoEngine", "v1.2.3", "config.embedding.url", "MCP"])
    );
    expect(result.entities).toEqual(captured?.entities);
  });

  test("可通过 metadata 关闭实体抽取", async () => {
    const provider = new GBrainTrackProvider({
      initialize: async () => {},
      addKnowledge: async (params) => {
        return Array.isArray(params.entities) && params.entities.length === 0 ? "ok" : "bad";
      },
      searchKnowledge: async () => [],
    });

    const result = await provider.ingest({
      text: "MemoEngine v1.2.3 MCP",
      metadata: { entities_enabled: false },
    });

    expect(result.id).toBe("ok");
    expect(result.entities).toEqual([]);
  });
});

