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

Inject a new memory through the Integration Hub write path

Arguments:

- `text`: Text content

Options:

- `--project <projectId>`: Current project. Default: `default`.
- `--source <source>`: Source descriptor id. Default: `cli`.
- `--category <category>`: Memory category/domain hint.
- `--file <filePath>`: Related source file path.

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

### summarize

Create a governed summary candidate from explicit text

Arguments:

- `text`: Text to summarize

Options:

- `--agent <agentId>`: Agent identity. Default: `cli`.

Examples:

- `memohub summarize "Hermes recently refactored the query path" --agent hermes`

### clarify

Create clarification questions for explicit conflicting or missing memory text

Arguments:

- `text`: Text needing clarification

Options:

- `--agent <agentId>`: Agent identity. Default: `cli`.

Examples:

- `memohub clarify "Conflicting source ownership notes" --agent hermes`

### resolve-clarification

Write a clarification answer back as governed searchable memory

Arguments:

- `clarificationId`: Clarification item id
- `answer`: Clarification answer

Options:

- `--agent <agentId>`: Resolving agent identity. Default: `cli`.
- `--project <projectId>`: Current project. Default: `default`.
- `--memory <memoryId...>`: Memory ids resolved by this answer.

Examples:

- `memohub resolve-clarification clarify_op_1 "以新架构文档为准" --agent hermes --project memo-hub`

### mcp-config

Print MCP client config and agent skill instructions

Options:

- `--target <target>`: Config target: generic or hermes. Default: `generic`.

Examples:

- `memohub mcp-config`
- `memohub mcp-config --target hermes`

### config

Print resolved new-architecture runtime configuration

Examples:

- `memohub config`

### config-init

Initialize the global MemoHub configuration and remove stale config fragments

Options:

- `--force`: Overwrite existing global config.

Examples:

- `memohub config-init --force`

### config-check

Check global configuration and initialize it when missing

Examples:

- `memohub config-check`

### config-uninstall

Remove global MemoHub configuration fragments

Examples:

- `memohub config-uninstall`

### config-get

Read a raw configuration value by dotted path

Arguments:

- `path`: Dotted config path

Examples:

- `memohub config-get mcp.logPath`
- `memohub config-get storage.vectorDbPath`

### config-set

Write a raw configuration value by dotted path

Arguments:

- `path`: Dotted config path
- `value`: JSON or string value

Examples:

- `memohub config-set mcp.logPath "/tmp/memohub-mcp.ndjson"`

### mcp-tools

Print current MCP tools, resources, views, and agent instructions

Examples:

- `memohub mcp-tools`

### mcp-status

Check MemoHub MCP runtime status, storage paths, and exposed dimensions

Examples:

- `memohub mcp-status`

### mcp-doctor

Validate MCP access readiness, catalog consistency, config, and log writability

Examples:

- `memohub mcp-doctor`

### mcp-logs

Read MemoHub MCP service logs

Options:

- `--tail <lines>`: Number of log lines. Default: `50`.

Examples:

- `memohub mcp-logs --tail 100`

### serve

Start the MCP (Model Context Protocol) server

Alias: `mcp`

Examples:

- `memohub serve`
- `memohub mcp`

