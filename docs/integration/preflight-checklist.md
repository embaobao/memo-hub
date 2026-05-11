# MemoHub 接入前检查清单

最后更新：2026-05-11

本文档用于在 Hermes、IDE、Codex、Claude Desktop 或其他 Agent 接入 MemoHub 前完成统一检查。

## 1. 构建与 CLI 暴露

```bash
bun run build:cli
bun run verify:cli
bun run link:cli
memohub --version
memohub --help
```

如果本次目标是让 Hermes 通过官方 memory provider plugin 接入，额外执行：

```bash
memohub hermes install
hermes memory setup
hermes plugins reload
memohub hermes doctor
```

通过标准：

- `hermes memory setup` 中能看到 `memohub`
- `memohub hermes doctor` 返回成功
- Hermes 不使用私有数据源，而是与 MemoHub CLI / MCP 共用同一套数据
- Hermes 插件入口来自 `~/.hermes/plugins/memohub`

通过标准：

- `apps/cli/dist/index.js` 存在且可执行。
- `bin.memohub` 指向 `dist/index.js`。
- `memohub --version` 能输出版本。
- `memohub --help` 能看到 `mcp doctor`、`mcp tools`、`clarification resolve`。
- 中文环境或 `memohub --lang zh --help` 下，帮助信息应以中文显示关键命令、选项和流程指引。

## 2. 配置检查

如果这是第一次真实接入，先检查共享配置与当前运行时：

```bash
memohub config check
memohub config show
```

如果发现旧 schema 或明确需要清空验证污染数据，再由用户授权执行高风险命令：

```bash
memohub data rebuild-schema --yes --confirm DELETE_MEMOHUB_DATA
```

如果只是验证某一个接入渠道，不要默认清空全部数据。先查看状态和按渠道 dry-run：

```bash
memohub data status
memohub data clean --actor hermes --purpose test --dry-run
```

只有用户明确授权时，才执行按渠道删除：

```bash
memohub data clean --actor hermes --purpose test --yes --confirm DELETE_MEMOHUB_DATA
```

如果 dry-run 返回 `schemaMismatch: true`，说明本机向量表缺少 `channel` 字段。此时不要继续删除，也不要让 Hermes/Codex/Gemini 使用独立私有数据源；应由用户决定是否重建 MemoHub 管理数据目录。

```bash
memohub config show
memohub config get mcp.logPath
memohub config get storage.vectorDbPath
```

通过标准：

- `storage.blobPath`、`storage.vectorDbPath`、`storage.vectorTable` 均有解析值。
- `memohub data status` 能显示 `configPath`、`root`、`storageRoot`、`vectorDbPath`、`blobPath`、`mcp.logPath` 和 `channel registry`。
- `ai.embeddingModel` 和 `ai.dimensions` 有解析值。
- `mcp.logPath` 可写，或已通过环境变量覆盖。
- `memory.views` 至少包含 `project_context` 和 `coding_context`。

如果这是临时验证环境，优先显式覆盖 managed root，而不是复用默认 `~/.memohub`：

```bash
MEMOHUB_STORAGE__ROOT=/tmp/memohub-test \
MEMOHUB_STORAGE__VECTOR_DB_PATH=/tmp/memohub-test/data/memohub.lancedb \
MEMOHUB_STORAGE__BLOB_PATH=/tmp/memohub-test/blobs \
MEMOHUB_MCP__LOG_PATH=/tmp/memohub-test/logs/mcp.ndjson \
memohub data status
```

通过标准：

- `data status` 中显示的 root 和各路径都落在临时目录下。
- 测试、接入演练、Hermes 验证不写默认生产共享目录。

## 3. MCP 能力发现

```bash
memohub mcp config
memohub mcp tools
memohub mcp status
memohub mcp doctor
```

通过标准：

- `mcp tools` 返回当前 tools、resources、views、layers、operations。
- `mcp doctor.ok=true`。
- `mcp status` 能返回 storage、logPath、views 和 operations。
- `memohub://tools` 或 `mcp tools` 能看到 `memohub_data_manage action=clean_channel`。

如果默认日志路径无权限：

```bash
MEMOHUB_MCP__LOG_PATH=/tmp/memohub-mcp.ndjson memohub mcp doctor
```

如果只是临时验证，不想污染默认数据目录：

```bash
MEMOHUB_STORAGE__ROOT=/tmp/memohub-test \
MEMOHUB_STORAGE__BLOB_PATH=/tmp/memohub-test/blobs \
MEMOHUB_STORAGE__VECTOR_DB_PATH=/tmp/memohub-test/data/memohub.lancedb \
MEMOHUB_MCP__LOG_PATH=/tmp/memohub-test/logs/mcp.ndjson \
memohub mcp doctor
```

建议正式环境和临时验证环境都统一用新的路径覆盖变量：

- `MEMOHUB_STORAGE__ROOT`
- `MEMOHUB_STORAGE__VECTOR_DB_PATH`
- `MEMOHUB_STORAGE__BLOB_PATH`
- `MEMOHUB_MCP__LOG_PATH`

旧变量 `MEMOHUB_DB_PATH`、`MEMOHUB_CAS_PATH` 仍兼容，但不建议继续作为新的部署约定。

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

- `tools/list` 包含 `memohub_ingest_event`、`memohub_query`、`memohub_clarification_resolve`、`memohub_config_manage` 和 `memohub_data_manage`。
- `resources/list` 包含 `memohub://tools` 和 `memohub://stats`。
- `resources/read memohub://tools` 返回 Agent 可读接入说明。
- `memohub_data_manage` 的工具说明包含 `status`、`clean_channel`、`clean_all` 和 `rebuild_schema` 的风险边界。

## 6. 业务链路验证

执行 [接入场景验证](./access-scenarios.md) 中至少三个场景：

- 普通记忆写入与读取。
- 代码 `coding_context` 写入与读取。
- 外部澄清写回与后续查询。

通过标准：

- 写入链路返回 `eventId`、`contentHash` 和 `memoryObject`。
- 查询链路返回 `selfContext/projectContext/globalContext`。
- 澄清写回返回 `clarification.status=resolved` 和 `memoryObject.state=curated`。

如果要先验证 Hermes 新库闭环，而不触碰真实共享数据，使用隔离脚本：

```bash
bun run build:cli
bun run test:hermes-isolated
```

通过标准：

- 临时配置和临时存储根目录被自动创建。
- Hermes 主渠道和测试渠道都能正常打开。
- `memohub list --perspective actor --actor hermes` 能列出刚写入的隔离记忆。
- `memohub query ... --view project_context` 能召回隔离记忆。
- `memohub data clean --actor hermes --purpose test --dry-run --json` 能返回匹配记录数。
- 验证链路默认只使用 `test` 渠道，不应触碰真实共享数据。
- 脚本结束后自动删除临时目录，不污染真实 `~/.memohub`。

## 7. 文档一致性检查

```bash
bun run docs:generate
bun run docs:check
```

通过标准：

- `docs/generated/cli-reference.md` 与 CLI metadata 同步。
- `docs/generated/mcp-reference.md` 与 MCP metadata 同步。
- 新增命令或工具必须先更新 `apps/cli/src/interface-metadata.ts`。
