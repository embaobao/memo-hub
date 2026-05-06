# MemoHub 接入场景验证

最后更新：2026-04-29

本文档给 Agent、IDE、Hermes、Codex 等接入方提供可复用验证链路。所有场景都基于统一运行时、命名视图和标准事件模型。

## 总体调用链

```text
1. 构建并注册 CLI
   bun run build:cli -> bun run verify:cli -> bun run link:cli

2. 启动和发现 MCP
   memohub mcp serve -> resources/read memohub://tools

3. 绑定身份
   actorId  当前读取者身份，例如 hermes / codex / gemini / vscode
   source   当前写入来源，例如 hermes / codex / vscode / scanner
   channel  当前通道，例如 hermes:session:2026-04-29 或 vscode:workspace:memo-hub
   projectId 项目边界，例如 memo-hub

4. 读取记忆上下文
   agent_profile       读取 Agent 自己的长期习惯和偏好
   recent_activity     回溯近期任务和会话活动
   project_context     读取项目事实、决策和业务背景
   coding_context      读取私有代码记忆、组件、API、依赖和仓库习惯

5. 执行业务任务
   Agent 带着召回上下文完成分析、编码、总结、问答或计划

6. 写回资产
   memohub_ingest_event 写入新事实、代码分析、偏好和任务结果
   memohub_clarification_resolve 写入用户澄清后的 curated memory

7. 后续复用
   Hermes / Codex / Gemini / IDE 从同一项目和全局记忆层继续读取
```

MemoHub 的关键不是“提供一个工具”，而是让 Agent 明确知道：这里是自己的本地记忆资产中心。Hermes 可以把它当作长期记忆和习惯库；Codex 可以把它当作私有代码 context layer；Gemini 和 IDE 插件可以把它当作共享项目知识层。

## 身份命名与追溯规则

每个接入方必须使用稳定身份，否则后续无法可靠回答“谁写入的、哪个会话写入的、哪个项目可见、这个 Agent 自己的习惯是什么”。

推荐字段：

- `actorId`: 查询者或当前 Agent，例如 `hermes`、`codex`、`gemini`。
- `source`: 写入来源，例如 `hermes`、`codex`、`vscode`、`scanner`。
- `channel`: 具体通道，例如 `hermes:session:2026-04-29-docs`、`vscode:workspace:memo-hub`。
- `projectId`: 项目边界，例如 `memo-hub`。
- `workspaceId`: 工作区边界，例如 `repo:memo-hub`。
- `sessionId`: 会话 ID，例如 `session:2026-04-29-hermes-docs`。
- `taskId`: 任务 ID，例如 `task:docs-skill-memory-center`。

推荐命名：

```text
actorId:    hermes
source:     hermes
channel:    hermes:session:2026-04-29-docs
projectId:  memo-hub
workspaceId: repo:memo-hub
sessionId:  session:2026-04-29-hermes-docs
taskId:     task:docs-skill-memory-center
```

查询顺序遵循：先查自己，再查项目，再查全局。也就是 Agent 先用自己的 `actorId` 查 `agent_profile` 和 `recent_activity`，再用 `projectId/workspaceId` 查 `project_context` 和 `coding_context`。

## 场景 1：Agent 发现 MCP 能力

Agent 第一次接入时，不应该猜测 MemoHub 有哪些工具。正确方式是先让 MCP 跑起来，再读取 `memohub://tools`，把它当作当前机器上的实时能力目录。

CLI 预检：

```bash
memohub mcp config
memohub mcp tools
memohub mcp doctor
```

MCP 侧验证：

```json
{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}
{"jsonrpc":"2.0","id":2,"method":"resources/list","params":{}}
{"jsonrpc":"2.0","id":3,"method":"resources/read","params":{"uri":"memohub://tools"}}
```

通过标准：

- `tools/list` 包含 `memohub_ingest_event`、`memohub_query`、`memohub_clarification_resolve`。
- `resources/list` 包含 `memohub://stats` 和 `memohub://tools`。
- `memohub://tools` 返回 views、layers、operations、启动命令、日志路径和 Agent 指令。

## 场景 2：Hermes 查询自己的习惯和近期任务

这个场景用于让 Hermes 明确“MemoHub 是我的记忆中心”。Hermes 启动任务时先查自己的长期习惯和近期活动，再决定如何工作；任务结束后再把新的习惯、偏好和执行结果写回来。

适用问题：

- “我是 Hermes，我的习惯是什么？”
- “Hermes 最近干了什么？”
- “这个 Agent 之前执行过哪些任务？”

写入：

```bash
memohub add "Hermes 在接入新项目时应先读取 memohub://tools，再根据工具目录选择查询或写入工具" --project memo-hub --source hermes --category agent-habit
memohub add "Hermes 最近在梳理 CLI、MCP、配置、Skill 和真实接入文档的闭环" --project memo-hub --source hermes --category recent-activity
```

读取：

```bash
memohub query "Hermes 的接入习惯是什么" --view agent_profile --actor hermes --project memo-hub
memohub query "Hermes 最近在做什么" --view recent_activity --actor hermes --project memo-hub
```

MCP 写入时应带稳定通道：

```json
{
  "name": "memohub_ingest_event",
  "arguments": {
    "event": {
      "source": "hermes",
      "channel": "hermes:session:2026-04-29-docs",
      "kind": "memory",
      "projectId": "memo-hub",
      "confidence": "reported",
      "payload": {
        "text": "Hermes 在接入新项目时应先读取 memohub://tools。",
        "category": "agent-habit",
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

通过标准：

- 写入返回 `eventId` 和 `contentHash`。
- 查询返回 `selfContext/projectContext/globalContext` 三层结果。
- 返回结果保留 source、scope、domain、scoreBreakdown，便于解释为什么召回。

推荐 Hermes 启动提示词：

```text
你已接入 MemoHub。先读取 memohub://tools，然后查询 agent_profile 和 recent_activity。
把 MemoHub 当作你的长期记忆中心：执行任务前读取习惯和近期任务，任务结束后写入重要事实、用户偏好、决策和澄清。
```

## 场景 3：Codex/IDE 切换后的项目与代码上下文读取

这个场景对应私有代码记忆检索。它不是通用公网文档检索，而是把你自己的仓库理解沉淀为本地资产：文件职责、组件关系、API 入口、依赖分析、项目约定和历史决策都可以进入 `coding_context`。

适用问题：

- “我从 VS Code 切到 Codex，继续开发 memo-hub 时要先知道什么？”
- “MCP 工具注册在哪里？”
- “这个项目的当前实现边界和约定是什么？”
- “能不能像私有版 context7 一样，直接查询这个仓库自己的组件、API 和依赖记忆？”

写入代码相关记忆：

```bash
memohub add "apps/cli/src/mcp.ts 注册 MCP 工具和资源" --project memo-hub --source vscode --file apps/cli/src/mcp.ts --category mcp-code
memohub add "MemoHub 当前通过 UnifiedMemoryRuntime 组织写入、查询、总结、澄清和配置管理" --project memo-hub --source codex --category architecture
memohub add "apps/cli/src/mcp/tools/query.ts 只接收命名 view，并通过 QueryPlanner 召回 self/project/global 三层上下文" --project memo-hub --source codex --file apps/cli/src/mcp/tools/query.ts --category private-code-memory
```

读取：

```bash
memohub query "MCP 工具注册在哪里" --view coding_context --actor codex --project memo-hub
memohub query "继续开发 memo-hub 前需要知道哪些项目上下文" --view project_context --actor codex --project memo-hub
memohub query "这个仓库的 query 工具和 QueryPlanner 是什么关系" --view coding_context --actor codex --project memo-hub
```

通过标准：

- 记忆进入 `code-intelligence` domain。
- `coding_context` 同时允许返回代码记忆和项目知识。
- `project_context` 能返回业务边界、架构约定和当前开发重点。
- 私有代码事实不会离开本地记忆中心，后续 Agent 通过 `coding_context` 继承这份代码资产。

## 场景 4：多 Agent 协同记忆与回溯

这个场景用于验证多 Agent 协同。一个 Agent 写入的项目事实，另一个 Agent 可以按项目或代码上下文读取；用户也可以追问“最近谁做了什么、为什么这么设计、当前项目进度是什么”。

适用问题：

- “Hermes 最近干嘛了？”
- “Codex 和 IDE 最近围绕 memo-hub 写入了哪些项目事实？”
- “我现在都在开发什么，哪些 Agent 参与过？”

写入不同来源的记忆：

```bash
memohub add "Hermes 已完成 MemoHub 接入文档梳理，并确认 Agent 应先读取 memohub://tools" --project memo-hub --source hermes --category task-session
memohub add "Codex 已验证 check:release，并修复 TypeDoc source link 配置" --project memo-hub --source codex --category task-session
memohub add "VS Code 侧记录 apps/cli/src/interface-metadata.ts 是 CLI/MCP 工具目录的生成源" --project memo-hub --source vscode --file apps/cli/src/interface-metadata.ts --category project-knowledge
```

回溯：

```bash
memohub query "Hermes 最近干嘛了" --view recent_activity --actor hermes --project memo-hub
memohub query "memo-hub 最近有哪些 Agent 参与开发" --view project_context --actor codex --project memo-hub
memohub query "CLI/MCP 工具目录的生成源在哪里" --view coding_context --actor gemini --project memo-hub
```

通过标准：

- `recent_activity` 能按 Agent 和任务脉络召回近期动作。
- `project_context` 能聚合不同 Agent 写入的项目事实。
- `coding_context` 能把 IDE 录入的代码事实共享给 Codex、Gemini、Hermes 等其他 Agent。

## 场景 5：外部澄清写回

适用问题：

- “对话中用户纠正了一条记忆，如何让后续 Agent 都能读到？”
- “当前实现和文档冲突时，以哪条为准？”

生成澄清：

```bash
memohub clarification create "文档和实现对于查询入口描述不一致，需要确认以哪个接口合同为准" --actor hermes
```

写回澄清：

```bash
memohub clarification resolve clarify_op_1 "当前以 UnifiedMemoryRuntime、标准事件摄取和命名视图查询为准" --actor hermes --project memo-hub --memory mem_conflicting_note
```

读取澄清后的项目上下文：

```bash
memohub query "当前 MemoHub 的查询入口合同是什么" --view project_context --actor hermes --project memo-hub
```

通过标准：

- `clarification resolve` 返回 `clarification.status=resolved`。
- 写回的 `memoryObject.state=curated`。
- `memoryObject.links` 包含 `resolves` 和 `derived_from`。
- 后续 `project_context` 能召回澄清答案。

## 场景 6：配置和服务维护

适用问题：

- “Agent 如何知道 MCP 是否可用？”
- “本机日志在哪里？”
- “如何让 Agent 直接维护 MemoHub 配置？”

读取配置：

```bash
memohub config show
memohub config get mcp.logPath
```

写入配置：

```bash
memohub config set mcp.logPath '"/tmp/memohub-mcp.ndjson"'
```

检查服务：

```bash
memohub mcp status
memohub mcp doctor
memohub logs query --tail 100
```

通过标准：

- 配置写入后 `memohub config show` 能看到解析后的新值。
- `mcp doctor.ok=true`。
- `logs query` 能读取 NDJSON 日志。

## 场景 7：按渠道验证和清理接入数据

这个场景用于验证某个 Agent 或某个会话的写入链路，而不污染或清空其他 Agent 的共享记忆。典型用途是 Hermes 第一次接入、IDE 插件试运行、Gemini 接入冒烟测试。

适用问题：

- “只清理 Hermes 这次 MCP 测试写入的数据可以吗？”
- “如何验证某个 channel 写入了多少记录？”
- “旧 schema 没有 channel 字段时应该怎么办？”

推荐通道命名：

```text
hermes:first-integration
hermes:mcp-test
codex:session:2026-04-30-docs
vscode:workspace:memo-hub
```

CLI dry-run：

```bash
memohub data clean --actor hermes --purpose test --dry-run --json
```

MCP dry-run：

```json
{
  "name": "memohub_data_manage",
  "arguments": {
    "action": "clean_channel",
    "channel": "hermes:mcp-test",
    "dryRun": true
  }
}
```

真正删除必须由用户明确授权：

```bash
memohub data clean --actor hermes --purpose test --yes --confirm DELETE_MEMOHUB_DATA
```

MCP 等价调用：

```json
{
  "name": "memohub_data_manage",
  "arguments": {
    "action": "clean_channel",
    "channel": "hermes:mcp-test",
    "confirm": "DELETE_MEMOHUB_DATA"
  }
}
```

如果返回：

```json
{
  "schemaMismatch": true
}
```

说明当前向量表是旧 schema，缺少 `channel` 字段。Agent 应停止删除操作并反馈给用户；只有用户明确授权首次验证或 schema 损坏恢复时，才能执行 `memohub data rebuild-schema --yes --confirm DELETE_MEMOHUB_DATA` 或 MCP `rebuild_schema`。不要把 Agent 改到 `~/.hermes/data` 这类私有数据源，因为这会破坏 MemoHub 作为共享记忆中枢的目标。

通过标准：

- dry-run 不删除数据，并返回匹配数量或 schemaMismatch 诊断。
- 真删除必须带 `DELETE_MEMOHUB_DATA` 二次确认。
- 按渠道删除只影响该 `channel` 的向量记录，不删除 `data`、`blobs`、`logs` 等目录。
- schemaMismatch 场景不会崩溃，也不会删除任何数据。

## 场景 8：Agent Skill 安装后自动接入

适用问题：

- “新 Agent 如何从仓库安装 MemoHub 使用说明？”
- “Agent 读完 Skill 后如何接入本机 MCP？”

生成 Skill 安装源：

```bash
bun run skill:memohub
```

安装方式：

```bash
npx skills add <repo> --skill memohub
```

Agent 读取 Skill 后执行：

```bash
bun install
bun run build:cli
bun run verify:cli
bun run link:cli
memohub config check
memohub mcp doctor
memohub mcp serve
```

Agent 读完 Skill 后的完整使用顺序：

```text
1. 确认 memohub 命令可用。
2. 运行 memohub config check 和 memohub mcp doctor。
3. 启动 memohub mcp serve。
4. 读取 memohub://tools。
5. 根据任务选择 agent_profile、recent_activity、project_context 或 coding_context。
6. 执行任务。
7. 把有价值的新事实写入 memohub_ingest_event。
8. 把用户澄清写入 memohub_clarification_resolve。
```

通过标准：

- Skill 只生成到仓库根目录 `skills/memohub/SKILL.md`。
- Agent 能通过 `memohub://tools` 读取当前工具、资源、视图、操作、日志路径和配置入口。
- Agent 后续使用 `memohub_ingest_event`、`memohub_query`、`memohub_clarification_resolve` 和配置工具完成接入闭环。
