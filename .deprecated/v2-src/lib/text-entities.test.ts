import { describe, expect, test } from "bun:test";
import { extractEntitiesFromText } from "./text-entities.js";

describe("text-entities：通用文本实体抽取（GBrain 写入增强）", () => {
  test("可抽取驼峰词/带点标识符/版本号/缩写，并保持出现顺序去重", () => {
    const text =
      "使用 MemoEngine 接入 GBrainTrackProvider；配置项 config.embedding.url=...；升级到 v1.2.3-beta.1；支持 MCP/CLI。";

    const entities = extractEntitiesFromText(text);

    // 按出现顺序：驼峰词/带点标识符/版本号/缩写
    expect(entities).toEqual(
      expect.arrayContaining([
        "MemoEngine",
        "GBrainTrackProvider",
        "config.embedding.url",
        "v1.2.3-beta.1",
        "MCP",
        "CLI",
      ])
    );

    // 去重：同一 token 不应重复出现
    expect(new Set(entities).size).toBe(entities.length);
  });

  test("maxEntities 生效：超过上限会截断", () => {
    const text =
      "A.B C.D E.F MemoHubEngine GBrainTrackProvider v1.2.3 MCP CLI HTTP2 JSON YAML";
    const entities = extractEntitiesFromText(text, { maxEntities: 3 });
    expect(entities.length).toBe(3);
  });

  test("enabled=false：显式关闭抽取应返回空数组", () => {
    const entities = extractEntitiesFromText("MemoEngine v1.2.3 MCP", { enabled: false });
    expect(entities).toEqual([]);
  });

  test("不会把 URL host 当作“带点标识符”实体", () => {
    const text = "访问 http://a.b.com/path；真实配置项为 config.embedding.url";
    const entities = extractEntitiesFromText(text);
    expect(entities).toEqual(expect.arrayContaining(["config.embedding.url"]));
    expect(entities).not.toEqual(expect.arrayContaining(["a.b.com"]));
  });
});

