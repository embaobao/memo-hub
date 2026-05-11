# CLI Reference

Generated from `apps/cli/src/interface-metadata.ts`.

Command: `memohub`

Version: `1.1.0`

MemoHub - unified AI memory hub

## Commands

### inspect

Inspect current Memory OS registry and AI resources

Examples:

- `memohub inspect`

### add

Inject a new memory through the shared MemoHub memory write path

Arguments:

- `text`: Text content

Options:

- `--project <projectId>`: Current project. Default: `default`.
- `--source <source>`: Source descriptor id. Default: `cli`.
- `--channel <channelId>`: Governed channel id; if omitted, MemoHub can restore or create a default channel.
- `--workspace <workspaceId>`: Workspace binding, useful for IDE-style sources.
- `--session <sessionId>`: Session binding.
- `--task <taskId>`: Task binding.
- `--category <category>`: Memory category/domain hint.
- `--file <filePath>`: Related source file path.
- `--json`: Output raw JSON.

Examples:

- `memohub add "MemoHub uses a unified memory hub" --project memo-hub --source cli`

### query

Query a named layered context view through self/project/global recall

Arguments:

- `query`: Natural language query

Options:

- `--view <view>`: Named view. Default: `project_context`.
- `--actor <actorId>`: Requesting agent or actor.
- `--project <projectId>`: Current project. Default: `default`.
- `--limit <limit>`: Per-layer result limit. Default: `5`.

Examples:

- `memohub query "Hermes habits" --view agent_profile --actor hermes --project memo-hub`

### list

List memory overview by actor first, or inspect governed memory objects by actor/project/global perspective

Alias: `ls`

Options:

- `--perspective <perspective>`: Governance perspective: actor, project, or global.
- `--actor <actorId>`: Actor id for actor perspective.
- `--project <projectId>`: Project id for project perspective.
- `--workspace <workspaceId>`: Workspace binding.
- `--session <sessionId>`: Session binding.
- `--task <taskId>`: Task binding.
- `--domain <domain...>`: Optional domain filter.
- `--limit <limit>`: Result limit. Default: `20`.
- `--json`: Output raw JSON.

Examples:

- `memohub ls`
- `memohub list --perspective actor --actor hermes --limit 10`
- `memohub list --perspective project --project memo-hub --limit 20`
- `memohub ls --perspective global --limit 20 --json`

### summarize

Create a governed summary candidate from explicit text

Arguments:

- `text`: Text to summarize

Options:

- `--actor <actorId>`: Actor identity. Default: `cli`.

Examples:

- `memohub summarize "Hermes recently refactored the query path" --actor hermes`

### clarification create

Create clarification questions for explicit conflicting or missing memory text

Arguments:

- `text`: Text needing clarification

Options:

- `--actor <actorId>`: Actor identity. Default: `cli`.

Examples:

- `memohub clarification create "Conflicting source ownership notes" --actor hermes`

### clarification resolve

Write a clarification answer back as governed searchable memory

Arguments:

- `clarificationId`: Clarification item id
- `answer`: Clarification answer

Options:

- `--actor <actorId>`: Resolving actor identity. Default: `cli`.
- `--project <projectId>`: Current project. Default: `default`.
- `--memory <memoryId...>`: Memory ids resolved by this answer.

Examples:

- `memohub clarification resolve clarify_op_1 "以新架构文档为准" --actor hermes --project memo-hub`

### hermes install

Install the official MemoHub Hermes memory provider into Hermes user plugin directories

Options:

- `--hermes-home <path>`: Hermes home directory. Default: `~/.hermes`.
- `--project <projectId>`: Optional default project id written to provider config.
- `--language <lang>`: Provider output language: auto, zh, or en. Default: `auto`.
- `--cwd <workingDirectory>`: Optional working directory written to provider config.
- `--json`: Output raw JSON.

Examples:

- `memohub hermes install`
- `memohub hermes install --project memo-hub --language zh`

### hermes doctor

Check Hermes plugin links, provider config, Python compatibility, and plugin discoverability

Options:

- `--hermes-home <path>`: Hermes home directory. Default: `~/.hermes`.
- `--json`: Output raw JSON.

Examples:

- `memohub hermes doctor`
- `memohub hermes doctor --hermes-home /tmp/hermes-profile`

### hermes uninstall

Remove Hermes plugin links without touching MemoHub memory data

Options:

- `--hermes-home <path>`: Hermes home directory. Default: `~/.hermes`.
- `--purge-assets`: Also remove MemoHub-managed Hermes integration assets.
- `--json`: Output raw JSON.

Examples:

- `memohub hermes uninstall`
- `memohub hermes uninstall --purge-assets`

### mcp config

Print MCP client config and agent skill instructions

Options:

- `--target <target>`: Config target: generic or hermes. Default: `generic`.

Examples:

- `memohub mcp config`
- `memohub mcp config --target hermes`

### config show

Print resolved new-architecture runtime configuration

Examples:

- `memohub config show`

### config check

Check global configuration and initialize it when missing

Examples:

- `memohub config check`

### config uninstall

Remove global MemoHub configuration fragments with second confirmation

Options:

- `--yes`: Acknowledge destructive config removal.
- `--confirm <phrase>`: Required confirmation phrase: DELETE_MEMOHUB_CONFIG.

Examples:

- `memohub config uninstall --yes --confirm DELETE_MEMOHUB_CONFIG`

### channel open

Open or restore a governed channel binding

Options:

- `--actor <actorId>`: Actor id. Default: `cli`.
- `--source <source>`: Source id. Default: `cli`.
- `--project <projectId>`: Project id. Default: `default`.
- `--purpose <purpose>`: Channel purpose. Default: `primary`.
- `--workspace <workspaceId>`: Workspace id.
- `--session <sessionId>`: Session id.
- `--task <taskId>`: Task id.
- `--channel <channelId>`: Explicit channel id.
- `--json`: Output raw JSON.

Examples:

- `memohub channel open --actor hermes --source hermes --project memo-hub --purpose primary`

### channel list

List governed channels and current binding state

Options:

- `--actor <actorId>`: Filter by actor.
- `--project <projectId>`: Filter by project.
- `--source <source>`: Filter by source.
- `--purpose <purpose>`: Filter by purpose.
- `--status <status>`: Filter by status.
- `--json`: Output raw JSON.

Examples:

- `memohub channel list --actor hermes`
- `memohub channel list --project memo-hub --json`

### channel status

Show one governed channel entry

Arguments:

- `channelId`: Channel id

Options:

- `--json`: Output raw JSON.

Examples:

- `memohub channel status hermes:primary:memo-hub`

### channel use

Mark a governed channel active for later reuse

Arguments:

- `channelId`: Channel id

Options:

- `--json`: Output raw JSON.

Examples:

- `memohub channel use hermes:primary:memo-hub`

### channel close

Close a governed channel

Arguments:

- `channelId`: Channel id

Options:

- `--json`: Output raw JSON.

Examples:

- `memohub channel close hermes:test:memo-hub:manual`

### data status

Preview MemoHub-managed data directories and cleanup guidance without deleting anything

Options:

- `--json`: Output raw JSON.

Examples:

- `memohub data status`
- `memohub data status --json`

### data clean

High-risk cleanup for MemoHub-managed data; defaults to dry-run and requires explicit confirmation for deletion

Options:

- `--dry-run`: Preview cleanup targets without deleting data. Default: `true`.
- `--all`: Select all MemoHub-managed data directories.
- `--channel <channel>`: Clean only vector records from one channel, for example hermes:mcp-test.
- `--actor <actorId>`: Select governed channels by actor, for example hermes.
- `--project <projectId>`: Select governed channels by project id.
- `--source <source>`: Select governed channels by source id.
- `--purpose <purpose>`: Select governed channels by purpose, for example test.
- `--status <status>`: Select governed channels by lifecycle status.
- `--yes`: Acknowledge destructive cleanup.
- `--confirm <phrase>`: Required confirmation phrase: DELETE_MEMOHUB_DATA.
- `--json`: Output raw JSON.

Examples:

- `memohub data clean --dry-run`
- `memohub data clean --channel hermes:mcp-test --dry-run`
- `memohub data clean --actor hermes --purpose test --dry-run`
- `memohub data clean --actor hermes --project memo-hub --purpose test --yes --confirm DELETE_MEMOHUB_DATA`
- `memohub data clean --channel hermes:mcp-test --yes --confirm DELETE_MEMOHUB_DATA`
- `memohub data clean --all --yes --confirm DELETE_MEMOHUB_DATA`

### data rebuild-schema

High-risk: rebuild the managed data store schema after explicit user authorization

Options:

- `--yes`: Acknowledge destructive schema rebuild.
- `--confirm <phrase>`: Required confirmation phrase: DELETE_MEMOHUB_DATA.
- `--json`: Output raw JSON.

Examples:

- `memohub data rebuild-schema --yes --confirm DELETE_MEMOHUB_DATA`

### config get

Read a raw configuration value by dotted path

Arguments:

- `path`: Dotted config path

Examples:

- `memohub config get mcp.logPath`
- `memohub config get storage.vectorDbPath`

### config set

Write a raw configuration value by dotted path

Arguments:

- `path`: Dotted config path
- `value`: JSON or string value

Examples:

- `memohub config set mcp.logPath "/tmp/memohub-mcp.ndjson"`

### mcp tools

Print current MCP tools, resources, views, and agent instructions

Examples:

- `memohub mcp tools`

### mcp status

Check MemoHub MCP runtime status, storage paths, and exposed dimensions

Examples:

- `memohub mcp status`

### mcp doctor

Validate MCP access readiness, catalog consistency, config, log writability, and runtime schema health

Examples:

- `memohub mcp doctor`

### logs query

Read MemoHub logs with readable filters for event, channel, project, session, task, and source

Options:

- `--tail <lines>`: Number of log lines. Default: `50`.
- `--event <event>`: Filter by log event name.
- `--channel <channel>`: Filter by channel id.
- `--project <projectId>`: Filter by project id.
- `--session <sessionId>`: Filter by session id.
- `--task <taskId>`: Filter by task id.
- `--source <source>`: Filter by source id.
- `--level <level>`: Filter by log level.
- `--json`: Output raw JSON.

Examples:

- `memohub logs query --tail 100`
- `memohub logs query --channel hermes:mcp-test`
- `memohub logs query --session session:2026-04-30-hermes-docs --json`

### serve

Start the MCP (Model Context Protocol) server

Alias: `mcp`

Examples:

- `memohub serve`
- `memohub mcp`

