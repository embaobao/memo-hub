# MemoHub 配置指南

最后更新：2026-05-11

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
    "providers": [
      {
        "id": "ollama",
        "type": "ollama",
        "url": "http://localhost:11434/v1"
      },
      {
        "id": "lmstudio",
        "type": "openai-compatible",
        "url": "http://127.0.0.1:1234/v1"
      }
    ],
    "agents": {
      "embedder": {
        "provider": "ollama",
        "model": "nomic-embed-text-v2-moe",
        "dimensions": 768
      },
      "summarizer": {
        "provider": "ollama",
        "model": "qwen2.5:7b"
      }
    }
  },
  "mcp": {
    "transport": "stdio",
    "logPath": "~/.memohub/logs/mcp.ndjson",
    "resources": ["memohub://tools", "memohub://stats"]
  },
  "memory": {
    "layers": ["self", "project", "global"],
    "views": ["agent_profile", "recent_activity", "project_context", "coding_context"],
    "operations": ["ingest", "query", "summarize", "clarification_create", "clarification_resolve"]
  }
}
```

`configVersion` 是配置结构版本，用于后续迁移和诊断；它不等同于 CLI 包版本。

## 数据根与路径覆盖

MemoHub 现在把共享数据目录明确收敛到一个 managed root，并从这里派生运行时路径：

- `storage.root`
- `storage.vectorDbPath`
- `storage.blobPath`
- `mcp.logPath`
- `state/channels.json`

建议在正式环境里先看一眼当前实际生效值：

```bash
memohub data status
memohub config show
```

`memohub data status` 会直接显示：

- 当前 `configPath`
- 当前 `root`
- 当前 `storageRoot`
- 当前 `vectorDbPath`
- 当前 `blobPath`
- 当前 `mcp.logPath`
- 当前 `channel registry`
- 当前 `vectorTable`

如果你需要在某个环境里临时覆盖路径，优先使用新的 `MEMOHUB_*` 命名：

```bash
MEMOHUB_STORAGE__ROOT=/srv/memohub \
MEMOHUB_STORAGE__VECTOR_DB_PATH=/srv/memohub/data/memohub.lancedb \
MEMOHUB_STORAGE__BLOB_PATH=/srv/memohub/blobs \
MEMOHUB_MCP__LOG_PATH=/srv/memohub/logs/mcp.ndjson \
memohub data status
```

当前仍兼容旧变量：

- `MEMOHUB_DB_PATH`
- `MEMOHUB_CAS_PATH`

但新的正式环境配置建议统一迁到：

- `MEMOHUB_STORAGE__ROOT`
- `MEMOHUB_STORAGE__VECTOR_DB_PATH`
- `MEMOHUB_STORAGE__BLOB_PATH`
- `MEMOHUB_MCP__LOG_PATH`

## 临时测试根目录

如果只是做本地验证、集成测试或接入演练，不要直接写默认 `~/.memohub`。

推荐做法：

```bash
MEMOHUB_STORAGE__ROOT=/tmp/memohub-test \
MEMOHUB_STORAGE__VECTOR_DB_PATH=/tmp/memohub-test/data/memohub.lancedb \
MEMOHUB_STORAGE__BLOB_PATH=/tmp/memohub-test/blobs \
MEMOHUB_MCP__LOG_PATH=/tmp/memohub-test/logs/mcp.ndjson \
memohub mcp doctor
```

对于 Hermes 或其他 Agent 验证，优先再配合 `purpose=test` 渠道和 dry-run 清理：

```bash
memohub data clean --actor hermes --purpose test --dry-run
```

这样可以同时避免两类风险：

- 测试数据污染正式共享记忆
- 高风险清理误删默认运行环境数据

## 本地模型配置

MemoHub 现在默认支持两类本地模型配置入口：

- `ollama`
- `lmstudio`

推荐约定：

- `embedder` 默认使用 `ollama`
- `summarizer` 可以继续使用 `ollama`
- 也可以切到 `lmstudio`

例如：

```json
{
  "ai": {
    "providers": [
      {
        "id": "ollama",
        "type": "ollama",
        "url": "http://localhost:11434/v1"
      },
      {
        "id": "lmstudio",
        "type": "openai-compatible",
        "url": "http://127.0.0.1:1234/v1"
      }
    ],
    "agents": {
      "embedder": {
        "provider": "ollama",
        "model": "nomic-embed-text-v2-moe",
        "dimensions": 768
      },
      "summarizer": {
        "provider": "lmstudio",
        "model": "local-chat-model"
      }
    }
  }
}
```

说明：

- `embedder.provider` 和 `summarizer.provider` 可以不同
- `embedder.model` 用于向量 embedding 模型
- `summarizer.model` 用于总结或对话模型
- 如果使用 LM Studio，需要本地启动 OpenAI 兼容服务，并暴露 `/v1`

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
