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
    description: "Inject a new memory through the shared MemoHub memory write path",
    arguments: [{ name: "text", description: "Text content", required: true }],
    options: [
      { name: "--project <projectId>", description: "Current project", defaultValue: "default" },
      { name: "--source <source>", description: "Source descriptor id", defaultValue: "cli" },
      { name: "--channel <channelId>", description: "Governed channel id; if omitted, MemoHub can restore or create a default channel" },
      { name: "--workspace <workspaceId>", description: "Workspace binding, useful for IDE-style sources" },
      { name: "--session <sessionId>", description: "Session binding" },
      { name: "--task <taskId>", description: "Task binding" },
      { name: "--category <category>", description: "Memory category/domain hint" },
      { name: "--file <filePath>", description: "Related source file path" },
      { name: "--json", description: "Output raw JSON" },
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
    name: "list",
    alias: "ls",
    description: "List memory overview by actor first, or inspect governed memory objects by actor/project/global perspective",
    options: [
      { name: "--perspective <perspective>", description: "Governance perspective: actor, project, or global" },
      { name: "--actor <actorId>", description: "Actor id for actor perspective" },
      { name: "--project <projectId>", description: "Project id for project perspective" },
      { name: "--workspace <workspaceId>", description: "Workspace binding" },
      { name: "--session <sessionId>", description: "Session binding" },
      { name: "--task <taskId>", description: "Task binding" },
      { name: "--domain <domain...>", description: "Optional domain filter" },
      { name: "--limit <limit>", description: "Result limit", defaultValue: "20" },
      { name: "--json", description: "Output raw JSON" },
    ],
    examples: [
      "memohub ls",
      "memohub list --perspective actor --actor hermes --limit 10",
      "memohub list --perspective project --project memo-hub --limit 20",
      "memohub ls --perspective global --limit 20 --json",
    ],
  },
  {
    name: "summarize",
    description: "Create a governed summary candidate from explicit text",
    arguments: [{ name: "text", description: "Text to summarize", required: true }],
    options: [{ name: "--actor <actorId>", description: "Actor identity", defaultValue: "cli" }],
    examples: ['memohub summarize "Hermes recently refactored the query path" --actor hermes'],
  },
  {
    name: "clarification create",
    description: "Create clarification questions for explicit conflicting or missing memory text",
    arguments: [{ name: "text", description: "Text needing clarification", required: true }],
    options: [{ name: "--actor <actorId>", description: "Actor identity", defaultValue: "cli" }],
    examples: ['memohub clarification create "Conflicting source ownership notes" --actor hermes'],
  },
  {
    name: "clarification resolve",
    description: "Write a clarification answer back as governed searchable memory",
    arguments: [
      { name: "clarificationId", description: "Clarification item id", required: true },
      { name: "answer", description: "Clarification answer", required: true },
    ],
    options: [
      { name: "--actor <actorId>", description: "Resolving actor identity", defaultValue: "cli" },
      { name: "--project <projectId>", description: "Current project", defaultValue: "default" },
      { name: "--memory <memoryId...>", description: "Memory ids resolved by this answer" },
    ],
    examples: ['memohub clarification resolve clarify_op_1 "以新架构文档为准" --actor hermes --project memo-hub'],
  },
  {
    name: "hermes install",
    description: "Install the official MemoHub Hermes memory provider into Hermes user plugin directories",
    options: [
      { name: "--hermes-home <path>", description: "Hermes home directory", defaultValue: "~/.hermes" },
      { name: "--project <projectId>", description: "Optional default project id written to provider config" },
      { name: "--language <lang>", description: "Provider output language: auto, zh, or en", defaultValue: "auto" },
      { name: "--cwd <workingDirectory>", description: "Optional working directory written to provider config" },
      { name: "--json", description: "Output raw JSON" },
    ],
    examples: ["memohub hermes install", "memohub hermes install --project memo-hub --language zh"],
  },
  {
    name: "hermes doctor",
    description: "Check Hermes plugin links, provider config, Python compatibility, and plugin discoverability",
    options: [
      { name: "--hermes-home <path>", description: "Hermes home directory", defaultValue: "~/.hermes" },
      { name: "--json", description: "Output raw JSON" },
    ],
    examples: ["memohub hermes doctor", "memohub hermes doctor --hermes-home /tmp/hermes-profile"],
  },
  {
    name: "hermes uninstall",
    description: "Remove Hermes plugin links without touching MemoHub memory data",
    options: [
      { name: "--hermes-home <path>", description: "Hermes home directory", defaultValue: "~/.hermes" },
      { name: "--purge-assets", description: "Also remove MemoHub-managed Hermes integration assets" },
      { name: "--json", description: "Output raw JSON" },
    ],
    examples: ["memohub hermes uninstall", "memohub hermes uninstall --purge-assets"],
  },
  {
    name: "mcp config",
    description: "Print MCP client config and agent skill instructions",
    options: [{ name: "--target <target>", description: "Config target: generic or hermes", defaultValue: "generic" }],
    examples: ["memohub mcp config", "memohub mcp config --target hermes"],
  },
  {
    name: "config show",
    description: "Print resolved new-architecture runtime configuration",
    examples: ["memohub config show"],
  },
  {
    name: "config check",
    description: "Check global configuration and initialize it when missing",
    examples: ["memohub config check"],
  },
  {
    name: "config uninstall",
    description: "Remove global MemoHub configuration fragments with second confirmation",
    options: [
      { name: "--yes", description: "Acknowledge destructive config removal" },
      { name: "--confirm <phrase>", description: "Required confirmation phrase: DELETE_MEMOHUB_CONFIG" },
    ],
    examples: ["memohub config uninstall --yes --confirm DELETE_MEMOHUB_CONFIG"],
  },
  {
    name: "channel open",
    description: "Open or restore a governed channel binding",
    options: [
      { name: "--actor <actorId>", description: "Actor id", defaultValue: "cli" },
      { name: "--source <source>", description: "Source id", defaultValue: "cli" },
      { name: "--project <projectId>", description: "Project id", defaultValue: "default" },
      { name: "--purpose <purpose>", description: "Channel purpose", defaultValue: "primary" },
      { name: "--workspace <workspaceId>", description: "Workspace id" },
      { name: "--session <sessionId>", description: "Session id" },
      { name: "--task <taskId>", description: "Task id" },
      { name: "--channel <channelId>", description: "Explicit channel id" },
      { name: "--json", description: "Output raw JSON" },
    ],
    examples: ["memohub channel open --actor hermes --source hermes --project memo-hub --purpose primary"],
  },
  {
    name: "channel list",
    description: "List governed channels and current binding state",
    options: [
      { name: "--actor <actorId>", description: "Filter by actor" },
      { name: "--project <projectId>", description: "Filter by project" },
      { name: "--source <source>", description: "Filter by source" },
      { name: "--purpose <purpose>", description: "Filter by purpose" },
      { name: "--status <status>", description: "Filter by status" },
      { name: "--json", description: "Output raw JSON" },
    ],
    examples: ["memohub channel list --actor hermes", "memohub channel list --project memo-hub --json"],
  },
  {
    name: "channel status",
    description: "Show one governed channel entry",
    arguments: [{ name: "channelId", description: "Channel id", required: true }],
    options: [{ name: "--json", description: "Output raw JSON" }],
    examples: ["memohub channel status hermes:primary:memo-hub"],
  },
  {
    name: "channel use",
    description: "Mark a governed channel active for later reuse",
    arguments: [{ name: "channelId", description: "Channel id", required: true }],
    options: [{ name: "--json", description: "Output raw JSON" }],
    examples: ["memohub channel use hermes:primary:memo-hub"],
  },
  {
    name: "channel close",
    description: "Close a governed channel",
    arguments: [{ name: "channelId", description: "Channel id", required: true }],
    options: [{ name: "--json", description: "Output raw JSON" }],
    examples: ["memohub channel close hermes:test:memo-hub:manual"],
  },
  {
    name: "data status",
    description: "Preview MemoHub-managed data directories and cleanup guidance without deleting anything",
    options: [{ name: "--json", description: "Output raw JSON" }],
    examples: ["memohub data status", "memohub data status --json"],
  },
  {
    name: "data clean",
    description: "High-risk cleanup for MemoHub-managed data; defaults to dry-run and requires explicit confirmation for deletion",
    options: [
      { name: "--dry-run", description: "Preview cleanup targets without deleting data", defaultValue: "true" },
      { name: "--all", description: "Select all MemoHub-managed data directories" },
      { name: "--channel <channel>", description: "Clean only vector records from one channel, for example hermes:mcp-test" },
      { name: "--actor <actorId>", description: "Select governed channels by actor, for example hermes" },
      { name: "--project <projectId>", description: "Select governed channels by project id" },
      { name: "--source <source>", description: "Select governed channels by source id" },
      { name: "--purpose <purpose>", description: "Select governed channels by purpose, for example test" },
      { name: "--status <status>", description: "Select governed channels by lifecycle status" },
      { name: "--yes", description: "Acknowledge destructive cleanup" },
      { name: "--confirm <phrase>", description: "Required confirmation phrase: DELETE_MEMOHUB_DATA" },
      { name: "--json", description: "Output raw JSON" },
    ],
    examples: [
      "memohub data clean --dry-run",
      "memohub data clean --channel hermes:mcp-test --dry-run",
      "memohub data clean --actor hermes --purpose test --dry-run",
      "memohub data clean --actor hermes --project memo-hub --purpose test --yes --confirm DELETE_MEMOHUB_DATA",
      "memohub data clean --channel hermes:mcp-test --yes --confirm DELETE_MEMOHUB_DATA",
      "memohub data clean --all --yes --confirm DELETE_MEMOHUB_DATA",
    ],
  },
  {
    name: "data rebuild-schema",
    description: "High-risk: rebuild the managed data store schema after explicit user authorization",
    options: [
      { name: "--yes", description: "Acknowledge destructive schema rebuild" },
      { name: "--confirm <phrase>", description: "Required confirmation phrase: DELETE_MEMOHUB_DATA" },
      { name: "--json", description: "Output raw JSON" },
    ],
    examples: ["memohub data rebuild-schema --yes --confirm DELETE_MEMOHUB_DATA"],
  },
  {
    name: "config get",
    description: "Read a raw configuration value by dotted path",
    arguments: [{ name: "path", description: "Dotted config path", required: true }],
    examples: ["memohub config get mcp.logPath", "memohub config get storage.vectorDbPath"],
  },
  {
    name: "config set",
    description: "Write a raw configuration value by dotted path",
    arguments: [
      { name: "path", description: "Dotted config path", required: true },
      { name: "value", description: "JSON or string value", required: true },
    ],
    examples: ['memohub config set mcp.logPath "/tmp/memohub-mcp.ndjson"'],
  },
  {
    name: "mcp tools",
    description: "Print current MCP tools, resources, views, and agent instructions",
    examples: ["memohub mcp tools"],
  },
  {
    name: "mcp status",
    description: "Check MemoHub MCP runtime status, storage paths, and exposed dimensions",
    examples: ["memohub mcp status"],
  },
  {
    name: "mcp doctor",
    description: "Validate MCP access readiness, catalog consistency, config, log writability, and runtime schema health",
    examples: ["memohub mcp doctor"],
  },
  {
    name: "logs query",
    description: "Read MemoHub logs with readable filters for event, channel, project, session, task, and source",
    options: [
      { name: "--tail <lines>", description: "Number of log lines", defaultValue: "50" },
      { name: "--event <event>", description: "Filter by log event name" },
      { name: "--channel <channel>", description: "Filter by channel id" },
      { name: "--project <projectId>", description: "Filter by project id" },
      { name: "--session <sessionId>", description: "Filter by session id" },
      { name: "--task <taskId>", description: "Filter by task id" },
      { name: "--source <source>", description: "Filter by source id" },
      { name: "--level <level>", description: "Filter by log level" },
      { name: "--json", description: "Output raw JSON" },
    ],
    examples: [
      "memohub logs query --tail 100",
      "memohub logs query --channel hermes:mcp-test",
      "memohub logs query --session session:2026-04-30-hermes-docs --json",
    ],
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
    description: "Ingest external events into shared MemoHub memory with channel binding and project context",
    inputSummary: ["event.source", "event.channel", "event.kind", "event.projectId", "event.confidence", "event.payload.text"],
  },
  {
    name: "memohub_query",
    status: "recommended",
    description: "Query named layered context views through the unified query tool",
    inputSummary: ["view", "actorId", "projectId", "sessionId", "taskId", "query", "limit"],
  },
  {
    name: "memohub_list",
    status: "recommended",
    description: "List governed memory objects directly by actor/project/global perspective",
    inputSummary: ["perspective", "actorId", "projectId", "workspaceId", "sessionId", "taskId", "domains", "limit"],
  },
  {
    name: "memohub_summarize",
    status: "recommended",
    description: "Create a governed summary candidate from explicit memory text",
    inputSummary: ["text", "actorId"],
  },
  {
    name: "memohub_clarification_create",
    status: "recommended",
    description: "Create clarification items for explicit conflicting or missing memory text",
    inputSummary: ["text", "actorId"],
  },
  {
    name: "memohub_clarification_resolve",
    status: "recommended",
    description: "Write external clarification answers back as curated searchable memory",
    inputSummary: ["clarificationId", "answer", "resolvedBy", "projectId", "actorId", "memoryIds"],
  },
  {
    name: "memohub_logs_query",
    status: "recommended",
    description: "Query MemoHub logs by event, level, channel, project, session, task, or source for agent self-diagnosis",
    inputSummary: ["tail", "event", "level", "channel", "projectId", "sessionId", "taskId", "source"],
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
    description: "Check config or uninstall global config with second confirmation.",
    inputSummary: ["action=check|uninstall", "confirm=DELETE_MEMOHUB_CONFIG for uninstall"],
  },
  {
    name: "memohub_data_manage",
    status: "recommended",
    description: "Preview cleanup targets, clean one channel, clean all MemoHub-managed data with second confirmation, or rebuild schema. clean_channel, clean_all, and rebuild_schema require explicit user authorization.",
    inputSummary: ["action=status|clean_channel|clean_all|rebuild_schema", "channel or actorId/source/projectId/purpose/status for clean_channel", "confirm=DELETE_MEMOHUB_DATA for deletion", "dryRun"],
  },
  {
    name: "memohub_channel_open",
    status: "recommended",
    description: "Open or restore a governed channel binding for an actor or workspace source",
    inputSummary: ["actorId", "source", "projectId", "purpose", "workspaceId", "sessionId", "taskId", "channelId"],
  },
  {
    name: "memohub_channel_list",
    status: "recommended",
    description: "List governed channels and their current lifecycle state",
    inputSummary: ["actorId", "source", "projectId", "purpose", "status"],
  },
  {
    name: "memohub_channel_status",
    status: "recommended",
    description: "Read one governed channel entry by channelId",
    inputSummary: ["channelId"],
  },
  {
    name: "memohub_channel_close",
    status: "recommended",
    description: "Close a governed channel so it is no longer implicitly reused",
    inputSummary: ["channelId"],
  },
  {
    name: "memohub_channel_use",
    status: "recommended",
    description: "Restore an existing governed channel as the current active binding",
    inputSummary: ["channelId"],
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
