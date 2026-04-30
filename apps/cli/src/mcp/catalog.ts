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
  registry: {
    channelRegistryPath: string;
  };
  ingestContract: {
    identity: string[];
    eventFields: string[];
    payloadFields: string[];
    metadataRecommended: string[];
    guidance: string[];
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
    args: ["mcp", "serve"],
    cwd,
    tools: MCP_TOOLS,
    resources: MCP_RESOURCES,
    views: runtimeConfig?.memory.views ?? MCP_QUERY_VIEWS,
    layers: runtimeConfig?.memory.queryLayers ?? MCP_QUERY_LAYERS,
    operations: runtimeConfig?.memory.operations ?? ["ingest_event", "query", "summarize", "clarify", "resolve_clarification", "config_get", "config_set", "config_manage", "data_manage", "channel_governance"],
    storage: {
      root,
      dataPath: runtimeConfig?.storage.vectorDbPath ?? path.join(root, "data", "memohub.lancedb"),
      blobPath: runtimeConfig?.storage.blobPath ?? path.join(root, "blobs"),
      logPath: runtimeConfig?.mcp.logPath ?? getMcpLogPath(root),
    },
    registry: {
      channelRegistryPath: runtimeConfig?.registry.channelRegistryPath ?? path.join(root, "state", "channels.json"),
    },
    ingestContract: {
      identity: [
        "actorId: querying or resolving agent identity, for example hermes",
        "source: writing source identity, for example hermes, codex, vscode",
        "channel: stable governed channel id, for example hermes:session:2026-04-30-docs",
        "projectId: shared project boundary, for example memo-hub",
      ],
      eventFields: [
        "source",
        "channel",
        "projectId",
        "sessionId",
        "taskId",
        "confidence",
      ],
      payloadFields: [
        "text",
        "category",
        "file_path",
        "tags",
        "metadata",
      ],
      metadataRecommended: [
        "sourceId",
        "workspaceId",
        "component",
        "dependency",
        "api",
        "decisionId",
        "note",
      ],
      guidance: [
        "Prefer binding a governed channel first, then omit repeated source/channel/projectId in later MCP writes.",
        "For code memory, include file_path and useful metadata such as component, dependency, or api.",
        "For task/session memory, include sessionId and taskId for later traceability.",
        "For cross-agent shared memory, keep projectId stable and avoid private per-agent data roots.",
      ],
    },
    agentInstructions: [
      "先读取 memohub://tools 获取当前工具、资源、视图和操作清单。",
      "如需恢复或治理渠道，先使用 memohub_channel_list / memohub_channel_open / memohub_channel_status。",
      "Hermes 等长期 Agent 应先恢复主渠道，再执行查询和写入。",
      "IDE/workspace 来源应优先复用或自动创建 workspace 主渠道，而不是每次手工生成随机 channel。",
      "正常接入只运行配置检查和 MCP 诊断，不要默认清空数据。",
      "只有用户明确授权的首次验证、schema 损坏恢复或污染数据治理场景，才允许执行 data 管理工具里的破坏性操作。",
      "如需查看清理目标，使用 memohub data status 或 memohub_data_manage action=status。",
      "如需按渠道验证接入，可先使用 memohub data clean --channel <channel> --dry-run 或 memohub_data_manage action=clean_channel channel=<channel> dryRun=true。",
      "按渠道删除也需要二次确认：CLI 使用 memohub data clean --channel <channel> --yes --confirm DELETE_MEMOHUB_DATA；MCP 使用 memohub_data_manage action=clean_channel channel=<channel> confirm=DELETE_MEMOHUB_DATA。",
      "如需清空所有 MemoHub 管理数据，必须二次确认：CLI 使用 memohub data clean --all --yes --confirm DELETE_MEMOHUB_DATA；MCP 使用 memohub_data_manage action=clean_all confirm=DELETE_MEMOHUB_DATA。",
      "如需直接重建 schema，CLI 使用 memohub data rebuild-schema --yes --confirm DELETE_MEMOHUB_DATA；MCP 使用 memohub_data_manage action=rebuild_schema confirm=DELETE_MEMOHUB_DATA。",
      "重建 schema 会删除 MemoHub 管理的 data、blobs、logs、cache 和旧 tracks 目录；执行后必须重启正在运行的 memohub serve。",
      "写入记忆使用 memohub_ingest_event，查询上下文使用 memohub_query。写入前先查看 ingestContract，确保身份字段、event 字段和 metadata 约定齐全。",
      "验证链路使用 Hermes 身份写入一条记忆，再用 actorId=hermes 的 agent_profile 查询确认 selfContext 有返回。",
      "如果对话中用户澄清了冲突或缺口，调用 memohub_clarification_resolve 写回可检索记忆。",
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
        instruction: "连接 memohub MCP 后，先读 memohub://tools。正常接入不要清空数据；仅在用户明确授权的首次验证或 schema 损坏恢复时，才用 memohub_data_manage action=rebuild_schema 清空 MemoHub 管理数据并重启 MCP。",
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
