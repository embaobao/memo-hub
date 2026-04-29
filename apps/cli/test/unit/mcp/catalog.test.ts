import { describe, expect, test } from "bun:test";
import { createMcpAccessCatalog, createMcpClientConfig } from "../../../src/mcp/catalog.js";
import type { ResolvedMemoHubRuntimeConfig } from "../../../src/runtime-config.js";

const runtimeConfig: ResolvedMemoHubRuntimeConfig = {
  version: "1.1.0",
  configVersion: "unified-memory-1",
  root: "/tmp/memohub",
  storage: {
    blobPath: "/tmp/memohub/blobs",
    vectorDbPath: "/tmp/memohub/data/memohub.lancedb",
    vectorTable: "memohub",
    dimensions: 3,
  },
  ai: {
    providerId: "local",
    providerType: "ollama",
    providerUrl: "http://localhost:11434/v1",
    embeddingModel: "fake",
    chatModel: "fake-chat",
    dimensions: 3,
  },
  mcp: {
    enabled: true,
    transport: "stdio",
    logPath: "/tmp/memohub/logs/mcp.ndjson",
    toolsResourceUri: "memohub://tools",
    statsResourceUri: "memohub://stats",
    exposeToolCatalog: true,
    exposeStatus: true,
  },
  memory: {
    queryLayers: ["self", "project", "global"],
    views: ["project_context", "coding_context"],
    operations: ["ingest_event", "query", "resolve_clarification"],
  },
  sources: [],
};

describe("MCP access catalog", () => {
  test("exposes tools, resources, storage and agent instructions from runtime config", () => {
    const catalog = createMcpAccessCatalog("/repo/memo-hub", runtimeConfig);

    expect(catalog.tools.map((tool) => tool.name)).toContain("memohub_resolve_clarification");
    expect(catalog.resources.map((resource) => resource.uri)).toContain("memohub://tools");
    expect(catalog.views).toContain("coding_context");
    expect(catalog.storage.logPath).toBe("/tmp/memohub/logs/mcp.ndjson");
    expect(catalog.agentInstructions.join("\n")).toContain("memohub://tools");
  });

  test("generates agent-readable MCP client config", () => {
    const config = createMcpClientConfig("generic", "/repo/memo-hub", runtimeConfig) as any;

    expect(config.mcpServers.memohub.command).toBe("memohub");
    expect(config.mcpServers.memohub.args).toEqual(["serve"]);
    expect(config.skill.toolsResource).toBe("memohub://tools");
  });
});
