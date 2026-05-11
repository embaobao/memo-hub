# MemoHub 当前状态

最后更新：2026-05-11

## 当前主线

当前正式主线已经收敛为：

```text
Connector -> Channel -> Memory
```

已明确：

- CLI 是人工/脚本 Connector。
- MCP 是 Agent 工具协议 Connector。
- Hermes 是第一个真实外部 Connector。
- `integration-hub` 只保留为 Memory 内部实现细节。

## 已完成且已验证

- `packages/channel` 已落地，CLI/MCP 不再在 app 层维护 channel registry 业务实现。
- `packages/memory` 已落地，统一承接 Memory runtime、Hermes 预取、候选提取与列表概览。
- `connectors/hermes` 已落地，使用 Python + uv 管理 Hermes memory provider plugin。
- `memohub hermes install|doctor|uninstall` 已落地，统一管理 Hermes 官方 provider 安装链路。
- `data status` 现在会显示当前生效的 config root、storage root、vector db、blob、log 和 channel registry 路径。
- `data clean` / `data rebuild-schema` 已补齐 managed root 安全边界，默认只允许清理 MemoHub 管理路径。
- 正式环境路径覆盖已统一支持 `MEMOHUB_STORAGE__ROOT`、`MEMOHUB_STORAGE__VECTOR_DB_PATH`、`MEMOHUB_STORAGE__BLOB_PATH`、`MEMOHUB_MCP__LOG_PATH`。
- CLI 新增 `list|ls` 概览能力，默认按 actor 展示记忆概览。
- CLI 与 MCP 已统一使用 `actorId` 作为治理主体字段。
- `memohub serve` / `memohub mcp serve` 都可作为 MCP 服务入口。
- `connector:hermes:sync/lint/test/check` 根命令已补齐。

## 当前接口面

CLI：

```bash
memohub inspect
memohub hermes install
memohub hermes doctor
memohub hermes uninstall
memohub add "文本内容" --project memo-hub --source cli --category decision
memohub query "Hermes habits" --view agent_profile --actor hermes --project memo-hub
memohub ls
memohub summarize "Hermes 最近完成了查询链路收敛" --actor hermes
memohub clarification create "项目约定存在冲突" --actor hermes
memohub clarification resolve clarify_op_1 "以新架构为准" --actor hermes --project memo-hub
memohub channel open --actor hermes --source hermes --project memo-hub --purpose primary
memohub data status
memohub data clean --actor hermes --purpose test --dry-run
memohub mcp tools
memohub serve
```

MCP：

- `memohub_channel_open`
- `memohub_channel_list`
- `memohub_ingest_event`
- `memohub_query`
- `memohub_list`
- `memohub_logs_query`
- `memohub_clarification_resolve`
- `memohub_config_get`
- `memohub_config_set`
- `memohub_config_manage`
- `memohub_data_manage`

资源：

- `memohub://tools`
- `memohub://stats`

## 已完成验证

本轮已重新验证：

- `bun run --filter @memohub/cli test`
- `bun run docs:site`
- `bun run check:release`

说明：

- CLI 单测已覆盖命令面、MCP 契约、渠道治理、国际化与统一运行时链路。
- 数据治理链路已覆盖 runtime path 解析、managed root 安全边界、`data status` 输出和 MCP data manage 确认门槛。
- Hermes Connector 在当前仓库状态下已经完成官方插件目录、安装链路和验证脚本接入；历史验证仍覆盖官方插件注册、CLI 扩展、配置、初始化、prefetch、sync_turn 和工具调用契约。
- Hermes 官方安装链路已通过隔离 home 验证：插件资产复制到 `~/.memohub/integrations/hermes/`、Hermes 固定目录软链接创建、`doctor` Python 3.9+ 检查。

## 当前活跃提案

- `add-git-code-asset-layer`

最近已归档：

- `2026-05-11-add-data-environments-and-cleanup`

当前优先级：

1. 推进 Git / AST / 依赖 / 私有源代码资产层，保持独立提案推进。
2. 在正式环境兼容性边界稳定后，再评估是否继续拆分新的 Connector 或 Memory 治理提案。
