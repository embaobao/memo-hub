# MemoHub 配置指南

最后更新：2026-04-29

MemoHub 当前配置服务于统一记忆中枢。CLI 和 MCP 共享同一份解析后的运行时配置。

## 配置位置

- 全局配置：`~/.memohub/memohub.json`
- 自动检查：CLI 启动时会检查配置；缺失时可通过 `memohub config check` 初始化。
- 配置语言：`system.lang` 支持 `zh`、`en`、`auto`。默认 `auto`，无法判断系统语言时输出中文。

## 常用命令

```bash
memohub config check
memohub config show
memohub config get system.lang
memohub config set system.lang '"zh"'
memohub config uninstall --yes --confirm DELETE_MEMOHUB_CONFIG
```

`config set` 的值会先按 JSON 解析；字符串值建议保留 JSON 引号。

## 核心配置块

```json
{
  "configVersion": "unified-memory-1",
  "system": {
    "root": "~/.memohub",
    "lang": "auto"
  },
  "storage": {
    "blobPath": "~/.memohub/blobs",
    "vectorDbPath": "~/.memohub/vector.lancedb",
    "vectorTable": "memohub"
  },
  "ai": {
    "provider": "ollama",
    "embeddingModel": "nomic-embed-text-v2-moe",
    "chatModel": "llama3.1",
    "dimensions": 768
  },
  "mcp": {
    "transport": "stdio",
    "logPath": "~/.memohub/logs/mcp.ndjson",
    "resources": ["memohub://tools", "memohub://stats"]
  },
  "memory": {
    "layers": ["self", "project", "global"],
    "views": ["agent_profile", "recent_activity", "project_context", "coding_context"],
    "operations": ["ingest", "query", "summarize", "clarify", "resolve_clarification"]
  }
}
```

`configVersion` 是配置结构版本，用于后续迁移和诊断；它不等同于 CLI 包版本。

## MCP 配置能力

Agent 可以通过 MCP 直接读写配置：

- `memohub_config_get`: 读取解析配置或点分路径。
- `memohub_config_set`: 写入点分路径。
- `memohub_config_manage`: 执行 `check`、`uninstall`。
- `memohub_data_manage`: 执行 `status`、`clean_channel`、`clean_all`、`rebuild_schema`。

## 接入前验证

```bash
bun run build:cli
bun run verify:cli
memohub config check
memohub mcp doctor
memohub mcp tools
```

如果日志路径不可写，可临时使用：

```bash
MEMOHUB_MCP__LOG_PATH=/tmp/memohub-mcp.ndjson memohub mcp doctor
```
