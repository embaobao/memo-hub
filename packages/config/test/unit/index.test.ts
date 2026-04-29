import { expect, test, describe } from "bun:test";
import { ConfigLoader } from "../../src/index.js";
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
    expect(config.storage.vectorDbPath).toBe("~/.memohub/data/memohub.lancedb");
    expect(config.mcp.toolsResourceUri).toBe("memohub://tools");
    expect(config.memory.operations).toContain("resolve_clarification");
    expect(config.configVersion).toBe("unified-memory-1");
    expect(config.dispatcher.fallback).toBe("memory-object");
  });

  test("should parse JSONC with comments", () => {
    const jsoncContent = `{
      // This is a comment
      "configVersion": "unified-memory-1",
      "system": {
        /* Multi-line
           comment */
        "log_level": "debug",
        "root": "/tmp"
      },
      "ai": { "providers": [], "agents": {} },
      "dispatcher": { "fallback": "memory-object" },
      "tracks": []
    }`;
    // Use custom path to test parsing
    const customPath = "/tmp/memohub-test-config.jsonc";
    fs.writeFileSync(customPath, jsoncContent);
    const loader = new ConfigLoader(customPath);
    const config = loader.getConfig();
    expect(config.system.log_level).toBe("debug");
    fs.unlinkSync(customPath);
  });

  test("should apply environment overrides", () => {
    process.env.MEMOHUB_AI__AGENTS__SUMMARIZER__PROVIDER = "test-provider";
    process.env.MEMOHUB_AI__AGENTS__SUMMARIZER__MODEL = "test-model";
    process.env.MEMOHUB_MCP__LOG_PATH = "/tmp/memohub-test/mcp.ndjson";
    const loader = new ConfigLoader();
    const config = loader.getConfig();
    expect(config.ai.agents.summarizer.provider).toBe("test-provider");
    expect(config.ai.agents.summarizer.model).toBe("test-model");
    expect(config.mcp.logPath).toBe("/tmp/memohub-test/mcp.ndjson");
    delete process.env.MEMOHUB_AI__AGENTS__SUMMARIZER__PROVIDER;
    delete process.env.MEMOHUB_AI__AGENTS__SUMMARIZER__MODEL;
    delete process.env.MEMOHUB_MCP__LOG_PATH;
  });

  test("should mask secrets", () => {
    const config = {
      ai: {
        providers: [{ id: "test", apiKey: "secret-key-123" }],
      },
    };
    const loader = new ConfigLoader();
    // @ts-ignore - reaching into private state for test
    loader.config = config;
    const masked = loader.getMaskedConfig();
    expect(masked.ai.providers[0].apiKey).toBe("***");
  });
});
