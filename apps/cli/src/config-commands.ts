import { ConfigLoader } from "@memohub/config";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { stringify } from "comment-json";
import { MCP_RESOURCES, MCP_TOOLS } from "./interface-metadata.js";
import { createMcpAccessCatalog } from "./mcp/catalog.js";
import { McpLogger } from "./mcp/logger.js";
import { loadRuntimeConfig } from "./runtime-config.js";
import type { UnifiedMemoryRuntime } from "./unified-memory-runtime.js";

export function getConfigValue(config: Record<string, any>, dottedPath: string): unknown {
  return dottedPath.split(".").reduce<unknown>((current, part) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[part];
  }, config);
}

export function setConfigValue(config: Record<string, any>, dottedPath: string, value: unknown): void {
  const parts = dottedPath.split(".").filter(Boolean);
  if (parts.length === 0) throw new Error("Config path is required.");

  let cursor = config;
  for (const part of parts.slice(0, -1)) {
    // 配置写入只创建普通对象，避免把路径错误写成数组或原型字段。
    if (!cursor[part] || typeof cursor[part] !== "object" || Array.isArray(cursor[part])) {
      cursor[part] = {};
    }
    cursor = cursor[part];
  }
  cursor[parts[parts.length - 1]] = value;
}

export function parseConfigValue(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

export function writeConfigValue(path: string, rawValue: string, loader = new ConfigLoader()): Record<string, unknown> {
  const config = loader.getConfig() as Record<string, any>;
  const value = parseConfigValue(rawValue);
  setConfigValue(config, path, value);
  loader.save();
  return { path, value };
}

export function resetGlobalConfig(configPath = `${process.env.HOME}/.memohub/memohub.json`): Record<string, unknown> {
  const root = dirname(configPath);
  const removed = [
    join(root, "tracks"),
  ];

  for (const target of removed) {
    // 用户已明确要求不保留备份，无效配置目录直接删除。
    rmSync(target, { recursive: true, force: true });
  }

  mkdirSync(root, { recursive: true });
  const config = {
    // 配置版本用于后续迁移和诊断，不等同于 npm 包版本。
    configVersion: "unified-memory-1",
    system: {
      root: "~/.memohub",
      trace_enabled: true,
      log_level: "info",
      lang: "auto",
    },
    storage: {
      root: "~/.memohub",
      blobPath: "~/.memohub/blobs",
      vectorDbPath: "~/.memohub/data/memohub.lancedb",
      vectorTable: "memohub",
      dimensions: 768,
    },
    ai: {
      providers: [
        { id: "local", type: "ollama", url: "http://localhost:11434/v1" },
      ],
      agents: {
        embedder: {
          provider: "local",
          model: "nomic-embed-text-v2-moe",
          dimensions: 768,
        },
        summarizer: {
          provider: "local",
          model: "qwen2.5:7b",
        },
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
      views: ["agent_profile", "recent_activity", "project_context", "coding_context"],
      operations: ["ingest_event", "query", "summarize", "clarify", "resolve_clarification"],
    },
    tools: [],
    tracks: [],
  };

  writeFileSync(configPath, stringify(config, null, 2), "utf8");
  return { configPath, removed };
}

export function uninstallGlobalConfig(): Record<string, unknown> {
  const root = `${process.env.HOME}/.memohub`;
  const targets = [
    `${root}/memohub.json`,
    `${root}/tools`,
    `${root}/agents`,
    `${root}/ai`,
    `${root}/tracks`,
  ];
  for (const target of targets) rmSync(target, { recursive: true, force: true });
  return { root, removed: targets };
}

export function ensureGlobalConfig(): { created: boolean; configPath: string } {
  const configPath = `${process.env.HOME}/.memohub/memohub.json`;
  if (existsSync(configPath)) return { created: false, configPath };
  resetGlobalConfig(configPath);
  return { created: true, configPath };
}

export async function runMcpDoctor(runtime: UnifiedMemoryRuntime) {
  const runtimeConfig = loadRuntimeConfig();
  const catalog = createMcpAccessCatalog(process.cwd(), runtimeConfig);
  const stats = await runtime.inspect();
  const checks: Array<{ name: string; ok: boolean; details?: unknown }> = [];

  checks.push({
    name: "tool_catalog_consistency",
    ok: MCP_TOOLS.every((tool) => catalog.tools.some((item) => item.name === tool.name)),
    details: catalog.tools.map((tool) => tool.name),
  });
  checks.push({
    name: "resource_catalog_consistency",
    ok: MCP_RESOURCES.every((resource) => catalog.resources.some((item) => item.uri === resource.uri)),
    details: catalog.resources.map((resource) => resource.uri),
  });
  checks.push({
    name: "runtime_views",
    ok: runtimeConfig.memory.views.every((view) => (stats as any).views.includes(view)),
    details: runtimeConfig.memory.views,
  });
  checks.push({
    name: "stdio_transport",
    ok: runtimeConfig.mcp.transport === "stdio",
    details: runtimeConfig.mcp.transport,
  });

  try {
    const logger = new McpLogger(runtimeConfig.mcp.logPath);
    logger.write({ level: "info", event: "mcp.doctor", message: "MCP doctor log writability probe" });
    checks.push({ name: "log_writable", ok: true, details: runtimeConfig.mcp.logPath });
  } catch (error) {
    checks.push({
      name: "log_writable",
      ok: false,
      details: error instanceof Error ? error.message : String(error),
    });
  }

  return {
    ok: checks.every((check) => check.ok),
    checks,
    catalog,
    config: runtimeConfig,
  };
}
