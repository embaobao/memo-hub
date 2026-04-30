# MemoHub 接入前检查清单

最后更新：2026-04-29

本文档用于在 Hermes、IDE、Codex、Claude Desktop 或其他 Agent 接入 MemoHub 前完成统一检查。

## 1. 构建与 CLI 暴露

```bash
bun run build:cli
bun run verify:cli
bun run link:cli
memohub --version
memohub --help
```

通过标准：

- `apps/cli/dist/index.js` 存在且可执行。
- `bin.memohub` 指向 `dist/index.js`。
- `memohub --version` 能输出版本。
- `memohub --help` 能看到 `mcp-doctor`、`mcp-tools`、`resolve-clarification`。

## 2. 配置检查

如果这是第一次真实接入，先清理开发和测试阶段的本地数据：

```bash
memohub config-init
```

该命令会重写全局配置，并删除 MemoHub 管理的 `data`、`blobs`、`logs`、`cache` 和旧 `tracks` 目录。它不会删除仓库源码。

```bash
memohub config
memohub config-get mcp.logPath
memohub config-get storage.vectorDbPath
```

通过标准：

- `storage.blobPath`、`storage.vectorDbPath`、`storage.vectorTable` 均有解析值。
- `ai.embeddingModel` 和 `ai.dimensions` 有解析值。
- `mcp.logPath` 可写，或已通过环境变量覆盖。
- `memory.views` 至少包含 `project_context` 和 `coding_context`。

## 3. MCP 能力发现

```bash
memohub mcp-config
memohub mcp-tools
memohub mcp-status
memohub mcp-doctor
```

通过标准：

- `mcp-tools` 返回当前 tools、resources、views、layers、operations。
- `mcp-doctor.ok=true`。
- `mcp-status` 能返回 storage、logPath、views 和 operations。

如果默认日志路径无权限：

```bash
MEMOHUB_MCP__LOG_PATH=/tmp/memohub-mcp.ndjson memohub mcp-doctor
```

如果只是临时验证，不想污染默认数据目录：

```bash
MEMOHUB_STORAGE__ROOT=/tmp/memohub-test \
MEMOHUB_STORAGE__BLOB_PATH=/tmp/memohub-test/blobs \
MEMOHUB_STORAGE__VECTOR_DB_PATH=/tmp/memohub-test/data/memohub.lancedb \
MEMOHUB_MCP__LOG_PATH=/tmp/memohub-test/logs/mcp.ndjson \
memohub mcp-doctor
```

## 4. Agent Skill 安装源

```bash
bun run skill:memohub
```

通过标准：

- 只生成 `skills/memohub/SKILL.md`。
- 不存在 `apps/cli/skills`。
- 不写入 `.codex`、`.claude`、`.gemini` 等 Agent 私有目录。
- 发布或本地接入时由 `npx skills add <repo> --skill memohub` 安装。
- Agent 读取 skill 后能按步骤完成本地 CLI 安装、配置检查、MCP 启动和 `memohub://tools` 能力发现。

## 5. MCP 协议冒烟

用 MCP Client 发送：

```json
{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}
{"jsonrpc":"2.0","id":2,"method":"resources/list","params":{}}
{"jsonrpc":"2.0","id":3,"method":"resources/read","params":{"uri":"memohub://tools"}}
```

通过标准：

- `tools/list` 包含 `memohub_ingest_event`、`memohub_query`、`memohub_resolve_clarification` 和 `memohub_config_manage`。
- `resources/list` 包含 `memohub://tools` 和 `memohub://stats`。
- `resources/read memohub://tools` 返回 Agent 可读接入说明。

## 6. 业务链路验证

执行 [接入场景验证](./access-scenarios.md) 中至少三个场景：

- 普通记忆写入与读取。
- 代码 `coding_context` 写入与读取。
- 外部澄清写回与后续查询。

通过标准：

- 写入链路返回 `eventId`、`contentHash` 和 `memoryObject`。
- 查询链路返回 `selfContext/projectContext/globalContext`。
- 澄清写回返回 `clarification.status=resolved` 和 `memoryObject.state=curated`。

## 7. 文档一致性检查

```bash
bun run docs:generate
bun run docs:check
```

通过标准：

- `docs/generated/cli-reference.md` 与 CLI metadata 同步。
- `docs/generated/mcp-reference.md` 与 MCP metadata 同步。
- 新增命令或工具必须先更新 `apps/cli/src/interface-metadata.ts`。
