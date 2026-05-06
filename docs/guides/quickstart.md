# MemoHub 快速开始

最后更新：2026-04-29

## 环境准备

```bash
bun install
bun run build
bun run verify:cli
```

默认嵌入模型来自本地 Ollama。首次使用前建议准备模型：

```bash
ollama pull nomic-embed-text-v2-moe
ollama serve
```

## 全局注册 CLI

```bash
bun run link:cli
memohub --version
memohub --help
```

如果要开始第一次真实接入，先检查配置和当前运行时：

```bash
memohub config check
memohub config show
```

正常接入不会删除任何数据。

如果本机已经创建过旧 schema 的向量表，且用户明确授权清空 MemoHub 管理数据，才执行 `memohub data rebuild-schema --yes --confirm DELETE_MEMOHUB_DATA` 重建数据目录，并重启 MCP 服务。正常接入不要默认清空数据。

需要显式查看或清空 MemoHub 管理数据时，使用数据命令。默认只预览，不删除：

```bash
memohub data status
memohub data clean --dry-run
memohub data clean --actor hermes --purpose test --dry-run
memohub data clean --actor hermes --purpose test --yes --confirm DELETE_MEMOHUB_DATA
memohub data clean --all --yes --confirm DELETE_MEMOHUB_DATA
```

带 `--channel` 的命令只清理该渠道的向量记录，适合验证单个接入渠道。带 `--all` 的命令会清理所有 MemoHub 管理数据，风险更高。删除命令只能在用户明确授权时执行。

## 写入和查询

```bash
memohub add "用户偏好极简设计风格" --project memo-hub --source cli --category preference
memohub query "用户设计偏好是什么" --view project_context --actor hermes --project memo-hub
```

## 代码上下文

```bash
memohub add "apps/cli/src/mcp.ts 注册 MCP 工具和资源" --project memo-hub --source vscode --file apps/cli/src/mcp.ts --category mcp-code
memohub query "MCP 工具注册在哪里" --view coding_context --actor codex --project memo-hub
```

## MCP 接入

```bash
memohub mcp config
memohub mcp tools
memohub mcp doctor
memohub mcp serve
```

Agent 接入后应先读取 `memohub://tools`，再选择具体工具。

## 澄清写回

```bash
memohub clarification create "项目上下文里存在需要用户确认的接口描述冲突" --actor hermes
memohub clarification resolve clarify_op_1 "当前以 UnifiedMemoryRuntime、标准事件和命名视图查询为准" --actor hermes --project memo-hub
```

## 下一步

- [接入前检查清单](../integration/preflight-checklist.md)
- [接入场景验证](../integration/access-scenarios.md)
- [CLI 集成](../integration/cli-integration.md)
- [MCP 集成](../integration/mcp-integration.md)
