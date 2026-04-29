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
memohub mcp-config
memohub mcp-tools
memohub mcp-doctor
memohub serve
```

Agent 接入后应先读取 `memohub://tools`，再选择具体工具。

## 澄清写回

```bash
memohub clarify "项目上下文里存在需要用户确认的接口描述冲突" --agent hermes
memohub resolve-clarification clarify_op_1 "当前以 UnifiedMemoryRuntime、标准事件和命名视图查询为准" --agent hermes --project memo-hub
```

## 下一步

- [接入前检查清单](../integration/preflight-checklist.md)
- [接入场景验证](../integration/access-scenarios.md)
- [CLI 集成](../integration/cli-integration.md)
- [MCP 集成](../integration/mcp-integration.md)
