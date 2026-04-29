/**
 * CLI/MCP interface metadata is the source for generated reference docs and
 * drift checks. Runtime registrations should stay aligned with these names.
 */

export type InterfaceField = {
  name: string;
  description: string;
  required?: boolean;
  defaultValue?: string;
};

export type CliCommandMetadata = {
  name: string;
  alias?: string;
  description: string;
  arguments?: InterfaceField[];
  options?: InterfaceField[];
  examples: string[];
};

export type McpToolMetadata = {
  name: string;
  status: "recommended";
  description: string;
  inputSummary: string[];
};

export type McpResourceMetadata = {
  name: string;
  uri: string;
  description: string;
};

export const CLI_METADATA = {
  name: "memohub",
  version: "1.1.0",
  description: "MemoHub - unified AI memory hub",
};

export const CLI_COMMANDS: CliCommandMetadata[] = [
  {
    name: "inspect",
    description: "Inspect current Memory OS registry and AI resources",
    examples: ["memohub inspect"],
  },
  {
    name: "add",
    description: "Inject a new memory through the Integration Hub write path",
    arguments: [{ name: "text", description: "Text content", required: true }],
    options: [
      { name: "--project <projectId>", description: "Current project", defaultValue: "default" },
      { name: "--source <source>", description: "Source descriptor id", defaultValue: "cli" },
      { name: "--category <category>", description: "Memory category/domain hint" },
      { name: "--file <filePath>", description: "Related source file path" },
    ],
    examples: ['memohub add "MemoHub uses a unified memory hub" --project memo-hub --source cli'],
  },
  {
    name: "query",
    description: "Query a named layered context view through self/project/global recall",
    arguments: [{ name: "query", description: "Natural language query", required: true }],
    options: [
      { name: "--view <view>", description: "Named view", defaultValue: "project_context" },
      { name: "--actor <actorId>", description: "Requesting agent or actor" },
      { name: "--project <projectId>", description: "Current project", defaultValue: "default" },
      { name: "--limit <limit>", description: "Per-layer result limit", defaultValue: "5" },
    ],
    examples: ['memohub query "Hermes habits" --view agent_profile --actor hermes --project memo-hub'],
  },
  {
    name: "summarize",
    description: "Create a governed summary candidate from explicit text",
    arguments: [{ name: "text", description: "Text to summarize", required: true }],
    options: [{ name: "--agent <agentId>", description: "Agent identity", defaultValue: "cli" }],
    examples: ['memohub summarize "Hermes recently refactored the query path" --agent hermes'],
  },
  {
    name: "clarify",
    description: "Create clarification questions for explicit conflicting or missing memory text",
    arguments: [{ name: "text", description: "Text needing clarification", required: true }],
    options: [{ name: "--agent <agentId>", description: "Agent identity", defaultValue: "cli" }],
    examples: ['memohub clarify "Conflicting source ownership notes" --agent hermes'],
  },
  {
    name: "resolve-clarification",
    description: "Write a clarification answer back as governed searchable memory",
    arguments: [
      { name: "clarificationId", description: "Clarification item id", required: true },
      { name: "answer", description: "Clarification answer", required: true },
    ],
    options: [
      { name: "--agent <agentId>", description: "Resolving agent identity", defaultValue: "cli" },
      { name: "--project <projectId>", description: "Current project", defaultValue: "default" },
      { name: "--memory <memoryId...>", description: "Memory ids resolved by this answer" },
    ],
    examples: ['memohub resolve-clarification clarify_op_1 "以新架构文档为准" --agent hermes --project memo-hub'],
  },
  {
    name: "mcp-config",
    description: "Print MCP client config and agent skill instructions",
    options: [{ name: "--target <target>", description: "Config target: generic or hermes", defaultValue: "generic" }],
    examples: ["memohub mcp-config", "memohub mcp-config --target hermes"],
  },
  {
    name: "config",
    description: "Print resolved new-architecture runtime configuration",
    examples: ["memohub config"],
  },
  {
    name: "config-init",
    description: "Initialize the global MemoHub configuration and remove stale config fragments",
    options: [{ name: "--force", description: "Overwrite existing global config" }],
    examples: ["memohub config-init --force"],
  },
  {
    name: "config-check",
    description: "Check global configuration and initialize it when missing",
    examples: ["memohub config-check"],
  },
  {
    name: "config-uninstall",
    description: "Remove global MemoHub configuration fragments",
    examples: ["memohub config-uninstall"],
  },
  {
    name: "config-get",
    description: "Read a raw configuration value by dotted path",
    arguments: [{ name: "path", description: "Dotted config path", required: true }],
    examples: ["memohub config-get mcp.logPath", "memohub config-get storage.vectorDbPath"],
  },
  {
    name: "config-set",
    description: "Write a raw configuration value by dotted path",
    arguments: [
      { name: "path", description: "Dotted config path", required: true },
      { name: "value", description: "JSON or string value", required: true },
    ],
    examples: ['memohub config-set mcp.logPath "/tmp/memohub-mcp.ndjson"'],
  },
  {
    name: "mcp-tools",
    description: "Print current MCP tools, resources, views, and agent instructions",
    examples: ["memohub mcp-tools"],
  },
  {
    name: "mcp-status",
    description: "Check MemoHub MCP runtime status, storage paths, and exposed dimensions",
    examples: ["memohub mcp-status"],
  },
  {
    name: "mcp-doctor",
    description: "Validate MCP access readiness, catalog consistency, config, and log writability",
    examples: ["memohub mcp-doctor"],
  },
  {
    name: "mcp-logs",
    description: "Read MemoHub MCP service logs",
    options: [{ name: "--tail <lines>", description: "Number of log lines", defaultValue: "50" }],
    examples: ["memohub mcp-logs --tail 100"],
  },
  {
    name: "serve",
    alias: "mcp",
    description: "Start the MCP (Model Context Protocol) server",
    examples: ["memohub serve", "memohub mcp"],
  },
];

export const MCP_TOOLS: McpToolMetadata[] = [
  {
    name: "memohub_ingest_event",
    status: "recommended",
    description: "Ingest external events through the Integration Hub",
    inputSummary: ["event.source", "event.channel", "event.kind", "event.projectId", "event.confidence", "event.payload.text"],
  },
  {
    name: "memohub_query",
    status: "recommended",
    description: "Query named layered context views through the unified query tool",
    inputSummary: ["view", "actorId", "projectId", "sessionId", "taskId", "query", "limit"],
  },
  {
    name: "memohub_summarize",
    status: "recommended",
    description: "Create a governed summary candidate from explicit memory text",
    inputSummary: ["text", "agentId"],
  },
  {
    name: "memohub_clarify",
    status: "recommended",
    description: "Create clarification items for explicit conflicting or missing memory text",
    inputSummary: ["text", "agentId"],
  },
  {
    name: "memohub_resolve_clarification",
    status: "recommended",
    description: "Write external clarification answers back as curated searchable memory",
    inputSummary: ["clarificationId", "answer", "resolvedBy", "projectId", "actorId", "memoryIds"],
  },
  {
    name: "memohub_config_get",
    status: "recommended",
    description: "Read MemoHub resolved runtime configuration or a dotted raw config path",
    inputSummary: ["path"],
  },
  {
    name: "memohub_config_set",
    status: "recommended",
    description: "Write MemoHub configuration by dotted path",
    inputSummary: ["path", "value"],
  },
  {
    name: "memohub_config_manage",
    status: "recommended",
    description: "Check, initialize, or uninstall MemoHub global configuration",
    inputSummary: ["action=check|init|uninstall"],
  },
];

export const MCP_RESOURCES: McpResourceMetadata[] = [
  {
    name: "memohub_stats",
    uri: "memohub://stats",
    description: "Current unified runtime status, tools, views, storage, and logs",
  },
  {
    name: "memohub_tools",
    uri: "memohub://tools",
    description: "Self-describing MCP tool catalog for agents and skills",
  },
];
