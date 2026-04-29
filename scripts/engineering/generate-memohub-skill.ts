#!/usr/bin/env bun
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { MCP_RESOURCES, MCP_TOOLS } from "../../apps/cli/src/interface-metadata.js";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = join(scriptDir, "../..");
// 只生成仓库根目录 skill 包；具体安装交给 npx skills，避免写入 Agent 私有目录。
const targetDir = join(root, "skills", "memohub");
mkdirSync(targetDir, { recursive: true });
writeFileSync(join(targetDir, "SKILL.md"), renderSkill(), "utf8");

console.log("MemoHub skill generated: skills/memohub/SKILL.md");

function renderSkill(): string {
  const tools = MCP_TOOLS.map((tool) => `- \`${tool.name}\`: ${tool.description}`).join("\n");
  const resources = MCP_RESOURCES.map((resource) => `- \`${resource.uri}\`: ${resource.description}`).join("\n");

  return `---
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
- If you are unsure what MemoHub supports on this machine, read \`memohub://tools\`; do not guess the tool contract.

## Identity Binding

Always bind your identity when reading or writing memory. This is how MemoHub knows which memories belong to Hermes, which facts belong to a project, and which session or task produced a memory.

Use stable names:

- \`actorId\`: the current Agent using memory, for example \`hermes\`, \`codex\`, \`gemini\`, \`vscode\`.
- \`source\`: the writer, for example \`hermes\`, \`codex\`, \`vscode\`, \`scanner\`.
- \`channel\`: the concrete channel, for example \`hermes:session:2026-04-29-docs\` or \`vscode:workspace:memo-hub\`.
- \`projectId\`: the project boundary, for example \`memo-hub\`.
- \`workspaceId\`, \`sessionId\`, \`taskId\`: use these when available for traceability.

Recommended naming pattern:

\`\`\`text
actorId: hermes
source: hermes
channel: hermes:session:2026-04-29-docs
projectId: memo-hub
workspaceId: repo:memo-hub
sessionId: session:2026-04-29-hermes-docs
taskId: task:docs-skill-memory-center
\`\`\`

Default retrieval order: query yourself first, then project, then global. In practice: read \`agent_profile\` and \`recent_activity\` with your \`actorId\`, then read \`project_context\` or \`coding_context\` with \`projectId\`.

## Installation Flow

When this skill is installed into an Agent, the Agent should use these steps to prepare MemoHub access from the repository root:

1. Build and expose the local CLI:

\`\`\`bash
bun install
bun run build:cli
bun run verify:cli
bun run link:cli
memohub --version
\`\`\`

2. Initialize and check runtime configuration:

\`\`\`bash
memohub config-check
memohub config
\`\`\`

3. Validate MCP readiness:

\`\`\`bash
memohub mcp-doctor
memohub mcp-tools
\`\`\`

4. Start MCP for Agent clients:

\`\`\`bash
memohub serve
\`\`\`

MCP client config should use:

\`\`\`json
{
  "mcpServers": {
    "memohub": {
      "command": "memohub",
      "args": ["serve"]
    }
  }
}
\`\`\`

After MCP is connected, read \`memohub://tools\` before choosing tools. Treat that resource as the live contract for tools, resources, views, logs, and configuration.

## First Action After Connection

Every Agent should run this discovery step after MCP connects:

\`\`\`text
Read resource: memohub://tools
\`\`\`

Then use the returned views and tools to decide the next action:

- Need your own long-term profile or habits: query \`agent_profile\`.
- Need recent task history: query \`recent_activity\`.
- Need project facts and decisions: query \`project_context\`.
- Need repository files, APIs, components, dependencies, or coding conventions: query \`coding_context\`.
- Need to preserve a new fact, decision, task result, code analysis, or user preference: call \`memohub_ingest_event\`.
- Need to store a user clarification: call \`memohub_resolve_clarification\`.

## Skill Distribution

This skill source lives at repository root:

\`\`\`text
skills/memohub/SKILL.md
\`\`\`

Install it through the external skills package manager, for example:

\`\`\`bash
npx skills add <repo> --skill memohub
\`\`\`

Do not copy this skill into local Agent directories manually during MemoHub builds.

## MCP Tools

${tools}

## MCP Resources

${resources}

## Common Workflows

### 1. Hermes Bootstraps Its Memory

When Hermes starts a task, it should treat MemoHub as its own memory asset center:

\`\`\`json
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
\`\`\`

Then ask for recent activity:

\`\`\`json
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
\`\`\`

### 2. Codex or IDE Reads Private Code Memory

Before editing or explaining code, query the private code context layer:

\`\`\`json
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
\`\`\`

Use this like a private context7 for your own repositories: files, APIs, components, dependency notes, and project conventions should be retained as private memory assets.

### 3. Multi-Agent Shared Project Context

Before planning project work, read shared project context:

\`\`\`json
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
\`\`\`

### 4. Write Useful Memory

Write facts that future Agents should inherit:

\`\`\`json
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
\`\`\`

For code memory, include \`file_path\`:

\`\`\`json
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
\`\`\`

### 5. Write Back User Clarification

When the user clarifies a memory, write the resolved answer back:

\`\`\`json
{
  "name": "memohub_resolve_clarification",
  "arguments": {
    "clarificationId": "clarify_op_1",
    "answer": "MemoHub should be treated as the Agent's local memory asset center.",
    "resolvedBy": "hermes",
    "projectId": "memo-hub",
    "actorId": "hermes",
    "reason": "User clarified product positioning in conversation."
  }
}
\`\`\`

## Decision Rules

- Agent profile: query \`memohub_query\` with \`view=agent_profile\` when an Agent asks for its habits, preferences, or prior behavior.
- Recent activity: query \`memohub_query\` with \`view=recent_activity\` when a user asks what an Agent or project has been doing.
- Project context: query \`memohub_query\` with \`view=project_context\` before planning or implementing project work.
- Code context: query \`memohub_query\` with \`view=coding_context\` before explaining files, APIs, components, dependencies, or repository conventions.
- Memory write: call \`memohub_ingest_event\` when a task decision, user preference, project fact, code analysis, or external tool result should be retained.
- Clarification write-back: call \`memohub_resolve_clarification\` after the user resolves a conflict or missing detail in conversation.
- Runtime config: use \`memohub_config_get\`, \`memohub_config_set\`, and \`memohub_config_manage\` to inspect or maintain local configuration.

## Expected End-to-End Chain

\`\`\`text
Agent starts
  -> reads memohub://tools
  -> queries agent_profile / recent_activity / project_context / coding_context
  -> performs task with retrieved context
  -> writes useful facts through memohub_ingest_event
  -> writes user clarifications through memohub_resolve_clarification
  -> later Agents query the same memory layers and continue from there
\`\`\`

## CLI Fallback

\`\`\`bash
memohub config
memohub config-check
memohub mcp-doctor
memohub mcp-tools
memohub add "memory text" --project memo-hub --source cli
memohub query "question" --view project_context --project memo-hub
memohub query "code question" --view coding_context --project memo-hub
\`\`\`

Human CLI output defaults to Chinese. Use \`--lang en\` for English and \`--json\` for machine-readable output.
`;
}
