# MemoHub API 参考

最后更新：2026-04-29

本页记录当前代码里真实存在的 CLI 与 MCP 接口。

## CLI

### `inspect`

```bash
memohub inspect
```

用途：

- 查看统一记忆运行时、存储、视图和 Agent 操作能力

### `add`

```bash
memohub add "文本内容" --project memo-hub --source cli --category decision
```

参数：

- `text`: 必填
- `--project <projectId>`: 可选，默认 `default`
- `--source <source>`: 可选，默认 `cli`
- `--category <category>`: 可选，记忆分类或 domain hint
- `--file <filePath>`: 可选，关联代码文件路径

返回：

- 终端输出成功或失败信息
- 成功时输出 `eventId` 和 `contentHash` 摘要

### `query`

```bash
memohub query "查询文本" --view project_context --actor hermes --project memo-hub --limit 5
```

参数：

- `query`: 必填
- `--view <view>`: 可选，支持 `agent_profile`、`recent_activity`、`project_context`、`coding_context`
- `--actor <actorId>`: 可选，请求方 Agent/Actor
- `--project <projectId>`: 可选，默认 `default`
- `--limit <limit>`: 可选，默认 `5`

返回：

- `selfContext`
- `projectContext`
- `globalContext`
- `conflictsOrGaps`
- `sources`
- `metadata.policyId` 和评分解释信息

### `summarize`

```bash
memohub summarize "Hermes 最近完成了查询链路收敛" --agent hermes
```

用途：

- 从显式文本创建受治理的总结候选记忆
- 输出包含 `operationId`、输入/输出记忆 ID、Agent 来源、置信度和 `reviewState`

### `clarify`

```bash
memohub clarify "这里存在冲突的项目约定" --agent hermes
```

用途：

- 从显式文本创建澄清项
- 输出 `clarifications`，用于后续冲突或缺口处理

### `resolve-clarification`

```bash
memohub resolve-clarification clarify_op_1 "以新架构为准" --agent hermes --project memo-hub
```

用途：

- 将外部对话中的澄清答案写回为 `curated MemoryObject`
- 输出 resolved clarification、memoryObject、contentHash 和 vectorRecordCount

### `config`

```bash
memohub config
```

用途：

- 查看解析后的新架构运行时配置，包括 storage、ai、mcp、memory 能力维度

### MCP 辅助命令

```bash
memohub mcp-config
memohub mcp-tools
memohub mcp-status
memohub mcp-logs --tail 50
```

用途：

- 生成 Agent 可读取的 MCP 接入配置
- 查看当前 MCP 工具/资源/视图/操作目录
- 查看服务状态与日志

### `serve`

```bash
memohub serve
```

启动别名：

```bash
memohub mcp
```

## MCP

### 推荐工具

#### `memohub_ingest_event`

输入：

```ts
{
  event: {
    source: string;
    channel: string;
    kind: "memory";
    projectId: string;
    confidence: "reported" | "observed" | "inferred" | "provisional" | "verified";
    payload: {
      text: string;
      kind?: "memory";
      file_path?: string;
      category?: string;
      tags?: string[];
      metadata?: Record<string, unknown>;
    };
  };
}
```

成功响应：

```ts
{
  success: true;
  eventId: string;
  contentHash?: string;
  canonicalEvent?: unknown;
  memoryObject?: unknown;
  contentLength: number;
}
```

失败响应：

```ts
{
  success: false;
  error: string;
  details?: unknown;
  eventId?: string;
}
```

#### `memohub_query`

输入：

```ts
{
  view: "agent_profile" | "recent_activity" | "project_context" | "coding_context";
  actorId?: string;
  projectId: string;
  workspaceId?: string;
  sessionId?: string;
  taskId?: string;
  query?: string;
  limit?: number;
}
```

返回：

- `selfContext/projectContext/globalContext`
- `conflictsOrGaps`
- `sources`
- `metadata.policyId` 和评分解释信息

#### `memohub_summarize`

输入：

```ts
{
  text: string;
  agentId?: string;
}
```

说明：

- 创建总结候选记忆，默认 `reviewState` 为 `proposed`，输出保留 operation provenance。

#### `memohub_clarify`

输入：

```ts
{
  text: string;
  agentId?: string;
}
```

说明：

- 创建澄清项，作为冲突/缺口治理入口。

#### `memohub_resolve_clarification`

输入：

```ts
{
  clarificationId: string;
  answer: string;
  resolvedBy?: string;
  projectId?: string;
  actorId?: string;
  source?: string;
  memoryIds?: string[];
  question?: string;
  reason?: string;
}
```

说明：

- 将澄清答案写回为可检索的 curated memory
- 写回记忆包含 `resolves` 和 `derived_from` links

### 资源

#### `memohub_stats`

URI：

```text
memohub://stats
```

返回内容包含：

- `status`
- `runtime`
- `stores`
- `model`
- `queryLayers`
- `views`
- `agentOperations`
- `tools`
- `resources`
- `storage`
- `logPath`

#### `memohub_tools`

URI：

```text
memohub://tools
```

返回内容包含：

- 当前工具目录
- 当前资源目录
- 支持的 views、layers、operations
- Agent 接入指令
- MCP 启动命令和日志路径

## 当前接口合同

- 当前 `kind` 只支持 `memory`
- CLI 查询通过命名 `view` 表达读取意图
- MCP 工具目录以 `memohub://tools` 和本页为准
- 配置读写通过 `config`、`config-get`、`config-set` 和 MCP 配置工具完成

## 相关文档

- [CLI 集成](../integration/cli-integration.md)
- [MCP 集成](../integration/mcp-integration.md)
- [当前状态](../development/current-status.md)
