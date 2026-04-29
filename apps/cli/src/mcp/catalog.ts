import * as path from "node:path";
import * as os from "node:os";
import { CLI_METADATA, MCP_RESOURCES, MCP_TOOLS } from "../interface-metadata.js";
import type { ResolvedMemoHubRuntimeConfig } from "../runtime-config.js";

export const MCP_QUERY_VIEWS = ["agent_profile", "recent_activity", "project_context", "coding_context"] as const;
export const MCP_QUERY_LAYERS = ["self", "project", "global"] as const;

export interface McpAccessCatalog {
  name: string;
  version: string;
  command: string;
  args: string[];
  cwd: string;
  tools: typeof MCP_TOOLS;
  resources: typeof MCP_RESOURCES;
  views: readonly string[];
  layers: readonly string[];
  operations: string[];
  storage: {
    root: string;
    dataPath: string;
    blobPath: string;
    logPath: string;
  };
  agentInstructions: string[];
}

export function getMemoHubRoot(): string {
  return path.resolve(os.homedir(), ".memohub");
}

export function getMcpLogPath(root = getMemoHubRoot()): string {
  return path.join(root, "logs", "mcp.ndjson");
}

export function createMcpAccessCatalog(cwd = process.cwd(), runtimeConfig?: ResolvedMemoHubRuntimeConfig): McpAccessCatalog {
  const root = runtimeConfig?.root ?? getMemoHubRoot();
  return {
    name: "memohub",
    version: CLI_METADATA.version,
    command: "memohub",
    args: ["serve"],
    cwd,
    tools: MCP_TOOLS,
    resources: MCP_RESOURCES,
    views: runtimeConfig?.memory.views ?? MCP_QUERY_VIEWS,
    layers: runtimeConfig?.memory.queryLayers ?? MCP_QUERY_LAYERS,
    operations: runtimeConfig?.memory.operations ?? ["ingest_event", "query", "summarize", "clarify", "resolve_clarification", "config_get", "config_set", "config_manage"],
    storage: {
      root,
      dataPath: runtimeConfig?.storage.vectorDbPath ?? path.join(root, "data", "memohub.lancedb"),
      blobPath: runtimeConfig?.storage.blobPath ?? path.join(root, "blobs"),
      logPath: runtimeConfig?.mcp.logPath ?? getMcpLogPath(root),
    },
    agentInstructions: [
      "先读取 memohub://tools 获取当前工具、资源、视图和操作清单。",
      "写入记忆使用 memohub_ingest_event，查询上下文使用 memohub_query。",
      "如果对话中用户澄清了冲突或缺口，调用 memohub_resolve_clarification 写回可检索记忆。",
      "如需调整接入配置，调用 memohub_config_get / memohub_config_set / memohub_config_manage。",
      "查询优先级遵循 self -> project -> global；代码场景使用 coding_context view。",
    ],
  };
}

export function createMcpClientConfig(target = "generic", cwd = process.cwd(), runtimeConfig?: ResolvedMemoHubRuntimeConfig) {
  const catalog = createMcpAccessCatalog(cwd, runtimeConfig);
  const server = {
    command: catalog.command,
    args: catalog.args,
    cwd: catalog.cwd,
  };

  if (target === "hermes") {
    return {
      mcp_servers: {
        memohub: server,
      },
      skill: {
        instruction: "连接 memohub MCP 后，先读 memohub://tools，再按工具目录选择写入、查询、澄清写回能力。",
      },
    };
  }

  return {
    mcpServers: {
      memohub: server,
    },
    skill: {
      instruction: "Use MemoHub as shared memory center. Read memohub://tools before choosing tools.",
      toolsResource: "memohub://tools",
      statusResource: "memohub://stats",
    },
  };
}
