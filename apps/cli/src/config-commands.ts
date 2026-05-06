import { ConfigLoader } from "@memohub/config";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { stringify } from "comment-json";
import { MCP_RESOURCES, MCP_TOOLS } from "./interface-metadata.js";
import { createMcpAccessCatalog } from "./mcp/catalog.js";
import { McpLogger } from "./mcp/logger.js";
import { loadRuntimeConfig } from "./runtime-config.js";
import type { UnifiedMemoryRuntime } from "./unified-memory-runtime.js";
import type { VectorStorage } from "@memohub/storage-soul";
import type { ChannelPurpose, ChannelStatus } from "@memohub/channel";

export const DATA_CLEAN_CONFIRMATION = "DELETE_MEMOHUB_DATA";
export const CONFIG_UNINSTALL_CONFIRMATION = "DELETE_MEMOHUB_CONFIG";

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

export function getManagedDataTargets(configPath = `${process.env.HOME}/.memohub/memohub.json`): string[] {
  const root = dirname(configPath);
  return [
    join(root, "tracks"),
    join(root, "data"),
    join(root, "blobs"),
    join(root, "logs"),
    join(root, "cache"),
  ];
}

export function cleanManagedData(options: {
  configPath?: string;
  dryRun?: boolean;
  all?: boolean;
  yes?: boolean;
  confirm?: string;
} = {}): Record<string, unknown> {
  const configPath = options.configPath ?? `${process.env.HOME}/.memohub/memohub.json`;
  const targets = getManagedDataTargets(configPath);
  const dryRun = options.dryRun ?? true;
  const authorized = options.all === true && options.yes === true && options.confirm === DATA_CLEAN_CONFIRMATION;

  if (dryRun) {
    return {
      success: true,
      dryRun: true,
      destructive: false,
      confirmationRequired: DATA_CLEAN_CONFIRMATION,
      targets,
      message: "Dry run only. No data was deleted.",
    };
  }

  if (!authorized) {
    return {
      success: false,
      dryRun: false,
      destructive: true,
      confirmationRequired: DATA_CLEAN_CONFIRMATION,
      targets,
      error: `Refusing to delete data. Pass --all --yes --confirm ${DATA_CLEAN_CONFIRMATION}.`,
    };
  }

  for (const target of targets) {
    // 高风险清理只删除 MemoHub 管理目录，且必须由调用方提供二次确认。
    rmSync(target, { recursive: true, force: true });
  }

  return {
    success: true,
    dryRun: false,
    destructive: true,
    removed: targets,
    message: "MemoHub-managed data directories were deleted. Restart MCP before retesting.",
  };
}

export async function cleanChannelData(vector: VectorStorage, options: {
  channel?: string;
  dryRun?: boolean;
  yes?: boolean;
  confirm?: string;
}): Promise<Record<string, unknown>> {
  const channel = options.channel?.trim();
  if (!channel) {
    return {
      success: false,
      dryRun: options.dryRun ?? true,
      destructive: false,
      confirmationRequired: DATA_CLEAN_CONFIRMATION,
      error: "Channel is required for scoped cleanup.",
    };
  }

  const filter = `channel = '${escapeLanceString(channel)}'`;
  let matches: Array<{ id: string }> = [];
  try {
    matches = await vector.list(filter, 10000);
  } catch (error) {
    if (isMissingChannelSchemaError(error)) {
      return {
        success: false,
        dryRun: options.dryRun ?? true,
        destructive: false,
        channel,
        schemaMismatch: true,
        confirmationRequired: DATA_CLEAN_CONFIRMATION,
        error: "Current vector table does not expose channel. Rebuild schema only after explicit user authorization, then retest channel cleanup.",
      };
    }
    throw error;
  }
  const dryRun = options.dryRun ?? true;

  if (dryRun) {
    return {
      success: true,
      dryRun: true,
      destructive: false,
      channel,
      matchedRecords: matches.length,
      recordIds: matches.map((record) => record.id),
      confirmationRequired: DATA_CLEAN_CONFIRMATION,
      message: "Dry run only. No channel data was deleted.",
    };
  }

  if (options.yes !== true || options.confirm !== DATA_CLEAN_CONFIRMATION) {
    return {
      success: false,
      dryRun: false,
      destructive: true,
      channel,
      matchedRecords: matches.length,
      confirmationRequired: DATA_CLEAN_CONFIRMATION,
      error: `Refusing to delete channel data. Pass --channel ${channel} --yes --confirm ${DATA_CLEAN_CONFIRMATION}.`,
    };
  }

  await vector.delete(filter);
  return {
    success: true,
    dryRun: false,
    destructive: true,
    channel,
    deletedRecords: matches.length,
    recordIds: matches.map((record) => record.id),
    message: "Channel-scoped vector records were deleted.",
  };
}

export async function cleanChannelsBySelector(
  runtime: UnifiedMemoryRuntime,
  options: {
    actorId?: string;
    source?: string;
    projectId?: string;
    purpose?: ChannelPurpose;
    status?: ChannelStatus;
    dryRun?: boolean;
    yes?: boolean;
    confirm?: string;
  },
): Promise<Record<string, unknown>> {
  const selected = runtime.listChannels({
    actorId: options.actorId,
    source: options.source,
    projectId: options.projectId,
    purpose: options.purpose,
    status: options.status,
  });

  if (selected.length === 0) {
    return {
      success: true,
      dryRun: options.dryRun ?? true,
      destructive: false,
      matchedChannels: 0,
      channels: [],
      message: "No matching governed channels.",
    };
  }

  const summaries: Array<Record<string, unknown>> = [];
  let schemaMismatch = false;
  let totalMatchedRecords = 0;
  for (const entry of selected) {
    const result = await cleanChannelData(runtime.vectorStore, {
      channel: entry.channelId,
      dryRun: options.dryRun ?? true,
      yes: options.yes,
      confirm: options.confirm,
    });
    if (result.schemaMismatch === true) schemaMismatch = true;
    totalMatchedRecords += Number(result.matchedRecords ?? result.deletedRecords ?? 0);
    summaries.push({
      channelId: entry.channelId,
      purpose: entry.purpose,
      status: entry.status,
      result,
    });
    if (result.success === false && result.schemaMismatch !== true) {
      return {
        success: false,
        dryRun: options.dryRun ?? true,
        destructive: false,
        matchedChannels: selected.length,
        channels: summaries,
        error: result.error,
      };
    }
  }

  if (schemaMismatch) {
    return {
      success: false,
      dryRun: options.dryRun ?? true,
      destructive: false,
      schemaMismatch: true,
      matchedChannels: selected.length,
      matchedRecords: totalMatchedRecords,
      channels: summaries,
      error: "Current vector table does not expose channel. Rebuild schema only after explicit user authorization, then retest selector-based cleanup.",
    };
  }

  return {
    success: true,
    dryRun: options.dryRun ?? true,
    destructive: !(options.dryRun ?? true),
    matchedChannels: selected.length,
    matchedRecords: totalMatchedRecords,
    channels: summaries,
    message: (options.dryRun ?? true)
      ? "Dry run only. No selected channel data was deleted."
      : "Selected channel-scoped vector records were deleted.",
  };
}

function escapeLanceString(value: string): string {
  return value.replace(/'/g, "''");
}

function isMissingChannelSchemaError(error: unknown): boolean {
  return error instanceof Error &&
    error.message.includes("No field named channel");
}

export function resetGlobalConfig(configPath = `${process.env.HOME}/.memohub/memohub.json`): Record<string, unknown> {
  const root = dirname(configPath);
  const cleanup = cleanManagedData({
    configPath,
    all: true,
    yes: true,
    confirm: DATA_CLEAN_CONFIRMATION,
    dryRun: false,
  });

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
      operations: ["ingest", "query", "summarize", "clarification_create", "clarification_resolve"],
    },
    tools: [],
    tracks: [],
  };

  writeFileSync(configPath, stringify(config, null, 2), "utf8");
  return { configPath, removed: cleanup.removed };
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

export function uninstallGlobalConfigWithConfirmation(options: {
  yes?: boolean;
  confirm?: string;
} = {}): Record<string, unknown> {
  if (options.yes !== true || options.confirm !== CONFIG_UNINSTALL_CONFIRMATION) {
    return {
      success: false,
      destructive: true,
      confirmationRequired: CONFIG_UNINSTALL_CONFIRMATION,
      error: `Refusing to remove config. Pass --yes --confirm ${CONFIG_UNINSTALL_CONFIRMATION}.`,
    };
  }
  return {
    success: true,
    destructive: true,
    confirmationRequired: CONFIG_UNINSTALL_CONFIRMATION,
    ...uninstallGlobalConfig(),
  };
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
