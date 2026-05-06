---
name: memohub
description: Use when an Agent needs to use MemoHub as its durable memory and private knowledge asset center, including Hermes permanent memory, multi-Agent shared project context, private code memory retrieval, clarification write-back, MCP discovery, or local configuration management.
---

# MemoHub Agent Access

MemoHub is the local memory asset center for Agents. Treat it as the place where your durable habits, project context, private code memory, task history, and user-confirmed clarifications live.

Use this skill to install the local MemoHub CLI, start the MemoHub MCP server, discover the live tool contract, and then read/write memory through MCP.

## Agent Mental Model

- If you are Hermes, MemoHub is your durable memory center: query it for your habits, preferences, prior tasks, and project history before acting.
- If you are Codex or an AI IDE, MemoHub is the private project and code context layer: query it before explaining files, editing code, or making architecture decisions.
- If multiple Agents work on the same project, MemoHub is the shared memory layer: write useful facts once so Hermes, Codex, Gemini, and IDE tools can all read them later.
- If the user corrects or clarifies something in conversation, write the resolved answer back so future Agents inherit the clarified fact.
- If you are unsure what MemoHub supports on this machine, read `memohub://tools`; do not guess the tool contract.

## Identity Binding

Always bind your identity when reading or writing memory. This is how MemoHub knows which memories belong to Hermes, which facts belong to a project, and which session or task produced a memory.

Use stable names:

- `actorId`: the current Agent using memory, for example `hermes`, `codex`, `gemini`, `vscode`.
- `source`: the writer, for example `hermes`, `codex`, `vscode`, `scanner`.
- `channel`: the concrete channel, for example `hermes:session:2026-04-29-docs` or `vscode:workspace:memo-hub`.
- `projectId`: the project boundary, for example `memo-hub`.
- `workspaceId`, `sessionId`, `taskId`: use these when available for traceability.

Recommended naming pattern:

```text
actorId: hermes
source: hermes
channel: hermes:session:2026-04-29-docs
projectId: memo-hub
workspaceId: repo:memo-hub
sessionId: session:2026-04-29-hermes-docs
taskId: task:docs-skill-memory-center
```

Default retrieval order: query yourself first, then project, then global. In practice: read `agent_profile` and `recent_activity` with your `actorId`, then read `project_context` or `coding_context` with `projectId`.

## Channel Governance

MemoHub now supports governed channels. Do not treat `channel` as a throwaway string when you can avoid it.

Recommended MCP flow:

1. Read `memohub://tools`
2. Call `memohub_channel_list`
3. If needed, call `memohub_channel_open`
4. Then call `memohub_query` / `memohub_ingest_event`

Once a channel is opened in the current MCP session, MemoHub can inherit `source`, `channel`, `projectId`, `workspaceId`, `sessionId`, and `taskId` for later calls when those fields are omitted. Explicit fields still override inherited values.

## Installation Flow

When this skill is installed into an Agent, the Agent should use these steps to prepare MemoHub access from the repository root:

1. Build and expose the local CLI:

```bash
bun install
bun run build:cli
bun run verify:cli
bun run link:cli
memohub --version
```

2. Initialize and check runtime configuration:

```bash
memohub config check
memohub config show
```

For the first real integration test, or when schema mismatch appears, clear MemoHub-managed test data and rebuild the managed data store:

```bash
memohub data rebuild-schema --yes --confirm DELETE_MEMOHUB_DATA
```

This is a high-risk operation. Do not run it during normal access. It deletes MemoHub-managed `data`, `blobs`, `logs`, and `cache` under `~/.memohub`, so use it only when the user explicitly authorizes a clean first verification run or schema recovery. After this command, restart any running `memohub mcp serve` process before retesting.

Agents can discover cleanup scope without deleting anything:

```bash
memohub data status
memohub data clean --dry-run
memohub data clean --actor hermes --purpose test --dry-run
```

Channel-scoped cleanup is useful for validating one integration channel without clearing other memory:

```bash
memohub data clean --actor hermes --purpose test --yes --confirm DELETE_MEMOHUB_DATA
```

Full cleanup is more destructive and requires the same second confirmation phrase:

```bash
memohub data clean --all --yes --confirm DELETE_MEMOHUB_DATA
```

Through MCP, use `memohub_data_manage` with `{ "action": "status" }` for global preview, `{ "action": "clean_channel", "actorId": "hermes", "purpose": "test", "dryRun": true }` for channel preview, and `{ "action": "clean_channel", "actorId": "hermes", "purpose": "test", "confirm": "DELETE_MEMOHUB_DATA" }` only after user authorization.

3. Validate MCP readiness:

```bash
memohub mcp doctor
memohub mcp tools
```

4. Start MCP for Agent clients:

```bash
memohub mcp serve
```

MCP client config should use:

```json
{
  "mcpServers": {
    "memohub": {
      "command": "memohub",
      "args": ["serve"]
    }
  }
}
```

MemoHub data must remain shared across Agents. Do not point Hermes, Codex, Gemini, or IDE clients at separate private data stores. If a deployment needs explicit paths, set these environment variables on every MemoHub MCP server process and make them point to the same shared MemoHub storage:

```yaml
env:
  MEMOHUB_DB_PATH: ~/.memohub/data/memohub.lancedb
  MEMOHUB_CAS_PATH: ~/.memohub/blobs
  EMBEDDING_URL: http://localhost:11434/v1
  EMBEDDING_MODEL: nomic-embed-text-v2-moe
```

MemoHub maps these deployment variables into the new architecture fields:

- `MEMOHUB_DB_PATH` -> `storage.vectorDbPath` for the shared vector store
- `MEMOHUB_CAS_PATH` -> `storage.blobPath` for the shared Blob/CAS store
- `EMBEDDING_URL` -> embedding provider URL
- `EMBEDDING_MODEL` -> embedding model

After connection, read `memohub://tools` or `memohub://stats` and verify the returned `storage.dataPath` and `storage.blobPath`; those are the actual paths in use.

After MCP is connected, read `memohub://tools` before choosing tools. Treat that resource as the live contract for tools, resources, views, logs, and configuration.

## First Action After Connection

Every Agent should run this discovery step after MCP connects:

```text
Read resource: memohub://tools
```

Then use the returned views and tools to decide the next action:

- Need your own long-term profile or habits: query `agent_profile`.
- Need recent task history: query `recent_activity`.
- Need project facts and decisions: query `project_context`.
- Need repository files, APIs, components, dependencies, or coding conventions: query `coding_context`.
- Need to preserve a new fact, decision, task result, code analysis, or user preference: call `memohub_ingest_event`.
- Need to store a user clarification: call `memohub_clarification_resolve`.

## Skill Distribution

This skill source lives at repository root:

```text
skills/memohub/SKILL.md
```

Install it through the external skills package manager, for example:

```bash
npx skills add <repo> --skill memohub
```

Do not copy this skill into local Agent directories manually during MemoHub builds.

## MCP Tools

- `memohub_ingest_event`: Ingest external events into shared MemoHub memory with channel binding and project context
- `memohub_query`: Query named layered context views through the unified query tool
- `memohub_channel_open`: Open or restore a governed channel binding
- `memohub_channel_list`: List governed channels and lifecycle state
- `memohub_channel_status`: Read one governed channel entry
- `memohub_channel_close`: Close a governed channel
- `memohub_channel_use`: Restore an existing governed channel as the active binding
- `memohub_summarize`: Create a governed summary candidate from explicit memory text
- `memohub_clarification_create`: Create clarification items for explicit conflicting or missing memory text
- `memohub_clarification_resolve`: Write external clarification answers back as curated searchable memory
- `memohub_logs_query`: Query MemoHub logs for self-diagnosis and onboarding verification
- `memohub_config_get`: Read MemoHub resolved runtime configuration or a dotted raw config path
- `memohub_config_set`: Write MemoHub configuration by dotted path
- `memohub_config_manage`: Check MemoHub configuration health or uninstall global config with second confirmation.
- `memohub_data_manage`: Preview cleanup targets, clean one channel, clean all MemoHub-managed data with second confirmation, or rebuild schema. `{ "action": "clean_all", "confirm": "DELETE_MEMOHUB_DATA" }` and `{ "action": "rebuild_schema", "confirm": "DELETE_MEMOHUB_DATA" }` are high-risk; use only with explicit user authorization, then restart MCP.

## MCP Resources

- `memohub://stats`: Current unified runtime status, tools, views, storage, and logs
- `memohub://tools`: Self-describing MCP tool catalog for agents and skills

## Common Workflows

### 1. Hermes Bootstraps Its Memory

When Hermes starts a task, it should treat MemoHub as its own memory asset center:

First restore the governed primary channel:

```json
{
  "name": "memohub_channel_open",
  "arguments": {
    "actorId": "hermes",
    "source": "hermes",
    "projectId": "memo-hub",
    "purpose": "primary"
  }
}
```

If this is the user-authorized first connection verification and the user explicitly asks for a clean test dataset, clear old MemoHub-managed test data first:

```json
{
  "name": "memohub_data_manage",
  "arguments": {
    "action": "rebuild_schema",
    "confirm": "DELETE_MEMOHUB_DATA"
  }
}
```

Restart MCP, then write a Hermes-owned probe memory:

```json
{
  "name": "memohub_ingest_event",
  "arguments": {
    "event": {
      "source": "hermes",
      "channel": "hermes:first-integration",
      "kind": "memory",
      "projectId": "memo-hub",
      "confidence": "reported",
      "payload": {
        "text": "Hermes first integration probe: MemoHub is my durable memory center.",
        "category": "habit-convention",
        "tags": ["hermes", "first-integration"]
      }
    }
  }
}
```

Then confirm self-layer recall:

```json
{
  "name": "memohub_query",
  "arguments": {
    "view": "agent_profile",
    "actorId": "hermes",
    "projectId": "memo-hub",
    "query": "What are my habits, preferences, and durable operating rules?",
    "limit": 5
  }
}
```

Then ask for recent activity:

```json
{
  "name": "memohub_query",
  "arguments": {
    "view": "recent_activity",
    "actorId": "hermes",
    "projectId": "memo-hub",
    "query": "What did Hermes recently do in this project?",
    "limit": 5
  }
}
```

### 2. Codex or IDE Reads Private Code Memory

Before editing or explaining code, query the private code context layer:

```json
{
  "name": "memohub_query",
  "arguments": {
    "view": "coding_context",
    "actorId": "codex",
    "projectId": "memo-hub",
    "query": "Where is the MCP tool catalog registered and how does query flow through QueryPlanner?",
    "limit": 5
  }
}
```

Use this like a private context7 for your own repositories: files, APIs, components, dependency notes, and project conventions should be retained as private memory assets.

### 3. Multi-Agent Shared Project Context

Before planning project work, read shared project context:

```json
{
  "name": "memohub_query",
  "arguments": {
    "view": "project_context",
    "actorId": "gemini",
    "projectId": "memo-hub",
    "query": "What is the current architecture and integration contract?",
    "limit": 8
  }
}
```

### 4. Write Useful Memory

Write facts that future Agents should inherit:

```json
{
  "name": "memohub_ingest_event",
  "arguments": {
    "event": {
      "source": "hermes",
      "channel": "agent-session",
      "kind": "memory",
      "projectId": "memo-hub",
      "confidence": "reported",
      "payload": {
        "text": "Hermes should read memohub://tools before choosing MemoHub MCP tools.",
        "category": "agent-habit",
        "tags": ["hermes", "mcp", "memory-center"],
        "metadata": {
          "actorId": "hermes",
          "sessionId": "session:2026-04-29-hermes-docs",
          "taskId": "task:docs-skill-memory-center"
        }
      }
    }
  }
}
```

For code memory, include `file_path`:

```json
{
  "name": "memohub_ingest_event",
  "arguments": {
    "event": {
      "source": "codex",
      "channel": "codex:session:2026-04-29-code-review",
      "kind": "memory",
      "projectId": "memo-hub",
      "confidence": "observed",
      "payload": {
        "text": "apps/cli/src/interface-metadata.ts is the source for generated CLI and MCP capability docs.",
        "file_path": "apps/cli/src/interface-metadata.ts",
        "category": "private-code-memory",
        "tags": ["cli", "mcp", "docs"],
        "metadata": {
          "actorId": "codex",
          "workspaceId": "repo:memo-hub",
          "sessionId": "session:2026-04-29-code-review"
        }
      }
    }
  }
}
```

### 5. Write Back User Clarification

When the user clarifies a memory, write the resolved answer back:

```json
{
  "name": "memohub_clarification_resolve",
  "arguments": {
    "clarificationId": "clarify_op_1",
    "answer": "MemoHub should be treated as the Agent's local memory asset center.",
    "resolvedBy": "hermes",
    "projectId": "memo-hub",
    "actorId": "hermes",
    "reason": "User clarified product positioning in conversation."
  }
}
```

## Decision Rules

- Agent profile: query `memohub_query` with `view=agent_profile` when an Agent asks for its habits, preferences, or prior behavior.
- Recent activity: query `memohub_query` with `view=recent_activity` when a user asks what an Agent or project has been doing.
- Project context: query `memohub_query` with `view=project_context` before planning or implementing project work.
- Code context: query `memohub_query` with `view=coding_context` before explaining files, APIs, components, dependencies, or repository conventions.
- Memory write: call `memohub_ingest_event` when a task decision, user preference, project fact, code analysis, or external tool result should be retained.
- Clarification write-back: call `memohub_clarification_resolve` after the user resolves a conflict or missing detail in conversation.
- Runtime config: use `memohub_config_get`, `memohub_config_set`, and `memohub_config_manage` to inspect or maintain local configuration.

## Expected End-to-End Chain

```text
Agent starts
  -> reads memohub://tools
  -> queries agent_profile / recent_activity / project_context / coding_context
  -> performs task with retrieved context
  -> writes useful facts through memohub_ingest_event
  -> writes user clarifications through memohub_clarification_resolve
  -> later Agents query the same memory layers and continue from there
```

## CLI Fallback

```bash
memohub config show
memohub config check
memohub mcp doctor
memohub mcp tools
memohub add "memory text" --project memo-hub --source cli
memohub query "question" --view project_context --project memo-hub
memohub query "code question" --view coding_context --project memo-hub
```

Human CLI output defaults to Chinese. Use `--lang en` for English and `--json` for machine-readable output.
