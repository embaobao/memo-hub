import { expect, test, describe } from "bun:test";
import { ConfigLoader } from "./index.js";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

describe("ConfigLoader", () => {
  const testConfigPath = "./test-memohub.json";

  test("should load default configuration when file missing", () => {
    if (fs.existsSync(testConfigPath)) fs.unlinkSync(testConfigPath);
    const loader = new ConfigLoader(testConfigPath);
    const config = loader.getConfig();
    expect(config.system.root).toBe("~/.memohub");
    expect(config.dispatcher.fallback).toBe("track-insight");
  });

  test("should parse JSONC with comments", () => {
    const jsoncContent = `{
      // This is a comment
      "system": {
        /* Multi-line
           comment */
        "log_level": "debug"
      }
    }`;
    fs.writeFileSync(testConfigPath, jsoncContent);
    const loader = new ConfigLoader(testConfigPath);
    const config = loader.getConfig();
    expect(config.system.log_level).toBe("debug");
    fs.unlinkSync(testConfigPath);
  });

  test("should apply environment overrides", () => {
    process.env.MEMOHUB_AI__AGENTS__DEFAULT__PROVIDER = "test-provider";
    process.env.MEMOHUB_AI__AGENTS__DEFAULT__MODEL = "test-model";
    const loader = new ConfigLoader(testConfigPath);
    const config = loader.getConfig();
    expect(config.ai.agents.default.provider).toBe("test-provider");
    expect(config.ai.agents.default.model).toBe("test-model");
    delete process.env.MEMOHUB_AI__AGENTS__DEFAULT__PROVIDER;
    delete process.env.MEMOHUB_AI__AGENTS__DEFAULT__MODEL;
  });

  test("should mask secrets", () => {
    const config = {
      ai: {
        providers: [{ id: "test", apiKey: "secret-key-123" }]
      }
    };
    const loader = new ConfigLoader();
    // @ts-ignore - reaching into private state for test
    loader.config = config;
    const masked = loader.getMaskedConfig();
    expect(masked.ai.providers[0].apiKey).toBe("***");
  });
});
