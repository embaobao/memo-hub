# MCP Server Integration (MVP)

MemoHub 作为一个符合 [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) 的服务端，允许 AI Agent (如 Claude Desktop) 直接读写您的个人记忆库。

---

## 🛠️ 配置 Claude Desktop

编辑您的 `claude_desktop_config.json`（通常位于 `~/Library/Application Support/Claude/`）：

```json
{
  "mcpServers": {
    "memohub": {
      "command": "bun",
      "args": [
        "run",
        "/path/to/memo-hub/apps/cli/src/index.ts",
        "mcp"
      ],
      "env": {
        "MEMOHUB_ROOT": "/Users/yourname/.memohub"
      }
    }
  }
}
```

---

## 🧰 暴露的工具 (Tools)

集成后，Claude 将具备以下能力：

### 1. `add_knowledge`
- **功能**: 手动向 `track-insight` 注入重要事实。
- **参数**: `text` (String).

### 2. `retrieve_knowledge`
- **功能**: 执行语义检索。
- **参数**: `query` (String), `limit` (Number).

### 3. `inspect_kernel`
- **功能**: 让 Agent 了解当前有哪些轨道可用，并查看系统的负载状态。

---

## 🧪 MVP 验证场景

1. **知识沉淀**: 在对话中告诉 Claude：“帮我记住，这个项目的 API 根路径是 /v1/api”。
2. **跨 Session 召回**: 开启新对话，问 Claude：“这个项目的 API 路径是什么？”
3. **代码理解**: 将 `track-source` 挂载，让 Agent 能够检索特定函数的 AST 结构。

---

**通过 MCP，MemoHub 赋予 Agent 真正的“长期记忆”。**
