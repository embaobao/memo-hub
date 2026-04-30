# MemoHub 集成指南

最后更新：2026-04-29

本页只保留当前实际可用的接入入口：CLI、MCP、接入前检查和预置场景验证。

## 接入前先做什么

1. 构建并验证 CLI：

```bash
bun run build:cli
bun run verify:cli
```

2. 全局注册 CLI：

```bash
bun run link:cli
memohub --help
```

3. 检查 MCP 可接入性：

```bash
memohub mcp config
memohub mcp tools
memohub mcp doctor
```

详见：[接入前检查清单](./preflight-checklist.md)

4. 生成 Agent Skill 安装源：

```bash
bun run skill:memohub
```

该命令只生成仓库根目录 `skills/memohub/SKILL.md`。Agent 通过 `npx skills add <repo> --skill memohub` 安装后，会读取该 skill 来完成本地 CLI 构建/链接、MCP 配置检查、`memohub mcp serve` 启动和工具发现。不要生成到 `.codex`、`.claude`、`.gemini` 或 `apps/cli/skills`。

## 如何选择入口

### AI Agent / IDE / Hermes / Codex

使用 MCP：

- 启动命令：`memohub mcp serve`
- 能力发现：读取 `memohub://tools`
- 状态资源：读取 `memohub://stats`
- 接入验证：`memohub mcp doctor`

详见：[MCP 集成](./mcp-integration.md)

### 人工或脚本直接操作

使用 CLI：

- `memohub add`
- `memohub query`
- `memohub clarification resolve`
- `memohub config show`
- `memohub mcp status`

详见：[CLI 集成](./cli-integration.md)

## 当前真实能力

CLI 命令：

- `inspect`
- `add`
- `query`
- `summarize`
- `clarify`
- `clarification resolve`
- `config show`
- `config check`
- `config get`
- `config set`
- `config uninstall`
- `channel open/list/status/use/close`
- `data status/clean/rebuild-schema`
- `mcp config`
- `mcp tools`
- `mcp status`
- `mcp doctor`
- `logs query`
- `serve`

MCP 工具：

- `memohub_ingest_event`
- `memohub_query`
- `memohub_summarize`
- `memohub_clarification_create`
- `memohub_clarification_resolve`
- `memohub_logs_query`
- `memohub_config_get`
- `memohub_config_set`
- `memohub_config_manage`
- `memohub_data_manage`
- `memohub_channel_open`
- `memohub_channel_list`
- `memohub_channel_status`
- `memohub_channel_close`
- `memohub_channel_use`

MCP 资源：

- `memohub://tools`
- `memohub://stats`

## 接入场景

- Agent 发现 MCP 能力
- 普通记忆写入与读取
- 代码 `coding_context` 读取
- 外部澄清写回
- 配置和服务维护

详见：[接入场景验证](./access-scenarios.md)

## 相关文档

- [接入前检查清单](./preflight-checklist.md)
- [接入场景验证](./access-scenarios.md)
- [CLI 集成](./cli-integration.md)
- [MCP 集成](./mcp-integration.md)
- [API 参考](../api/reference.md)
- [当前状态](../development/current-status.md)
