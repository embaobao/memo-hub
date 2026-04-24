# 配置指南

本指南说明 MemoHub 的配置结构、常用配置项与环境变量覆盖方式。

## 配置优先级

优先级为：环境变量 > `config/config.yaml` > 默认值。

## 配置文件结构

配置文件位于 `config/config.yaml`，推荐从示例复制：

```bash
cp config/config.example.yaml config/config.yaml
```

核心结构如下（字段名与项目实际代码保持一致）：

```yaml
embedding:
  url: "http://localhost:11434/v1"
  model: "nomic-embed-text-v2-moe"
  dimensions: 768
  timeout: 30

cas:
  root_path: "~/.hermes/data/memohub-cas"

routing:
  enabled: true
  default_track: "gbrain"
  code_suffixes: [".ts", ".tsx", ".js", ".jsx", ".py", ".md"]

gbrain:
  db_path: "~/.hermes/data/gbrain.lancedb"
  table_name: "gbrain"
  default_category: "other"
  default_importance: 0.5

clawmem:
  db_path: "~/.hermes/data/clawmem.lancedb"
  table_name: "clawmem"
  default_language: "typescript"
  default_importance: 0.5
```

## 配置项详解

### 1) 嵌入模型配置（embedding）

- `embedding.url`：嵌入 API 地址（默认 `http://localhost:11434/v1`）
- `embedding.model`：嵌入模型名（默认 `nomic-embed-text-v2-moe`）
- `embedding.dimensions`：向量维度（默认 768）
- `embedding.timeout`：超时秒数（默认 30）

### 2) CAS（灵肉分离原文存储，cas）

- `cas.root_path`：原文落盘根目录（支持 `~` 展开）

说明：
- 当检索开启 Hydration 且索引记录缺失 `text` 时，会使用 `content_ref` 从 CAS 回填原文
- CAS 目录建议与数据库目录同属一个“数据根目录”（例如 `~/.hermes/data/`），便于迁移与备份

### 3) 写入路由（routing）

路由发生在“写入管（Ingestion Pipe）”阶段，用于根据 `MemoContext.filePath` 等上下文决定写入到哪个轨道。

- `routing.enabled`：是否启用路由阶段
- `routing.default_track`：兜底轨道（默认 `gbrain`）
- `routing.code_suffixes`：默认代码后缀列表（未配置 rules 时生效）
- `routing.rules`：可选，自定义责任链规则（按顺序执行）

当你需要全量覆盖规则时，可以在 YAML 配置 `routing.rules`，或使用环境变量 `MEMOHUB_ROUTING_RULES`（JSON 数组）。

### 4) 双轨数据库（gbrain/clawmem）

- `gbrain.db_path` / `clawmem.db_path`：LanceDB 数据库路径
- `gbrain.table_name` / `clawmem.table_name`：表名
- `default_*`：默认分类/语言/重要性等

## 环境变量

### 嵌入与数据库（最常用）

```bash
export EMBEDDING_URL="http://localhost:11434/v1"
export EMBEDDING_MODEL="nomic-embed-text-v2-moe"
export GBRAIN_DB_PATH="~/.hermes/data/gbrain.lancedb"
export CLAWMEM_DB_PATH="~/.hermes/data/clawmem.lancedb"
```

### CAS（原文落盘）

```bash
export MEMOHUB_CAS_PATH="~/.hermes/data/memohub-cas"
```

### 路由（责任链）

```bash
export MEMOHUB_ROUTING_ENABLED="true"
export MEMOHUB_ROUTING_DEFAULT_TRACK="gbrain"
export MEMOHUB_ROUTING_CODE_SUFFIXES=".ts,.tsx,.js,.jsx,.py,.md"

# 可选：全量覆盖规则（JSON 数组）
export MEMOHUB_ROUTING_RULES='[
  { "type": "file_suffix", "name": "route_code", "track": "clawmem", "suffixes": [".ts", ".tsx"] },
  { "type": "default", "name": "route_default", "track": "gbrain" }
]'
```

### 治理冲突检测（Governance Pipe，环境变量）

治理管的最小冲突检测与事件队列采用环境变量控制：

```bash
export MEMOHUB_CONFLICT_ENABLED="true"
export MEMOHUB_CONFLICT_THRESHOLD="0.9"
export MEMOHUB_CONFLICT_STRATEGY="jaccard" # 或 contains
export MEMOHUB_CONFLICT_QUEUE_PATH="~/.hermes/data/memohub-conflicts.ndjson"
```

### 同步环境变量

```bash
export MEMOHUB_SYNC_ENABLED="true"
export MEMOHUB_SYNC_REPO_URL="git@github.com:user/repo.git"
export MEMOHUB_SYNC_BRANCH="main"
export MEMOHUB_SYNC_INTERVAL="1h"
export MEMOHUB_SYNC_DATA_PATH="~/.memohub/"
```

---

## 配置示例

### 本地开发配置

```yaml
embedding:
  model: "nomic-embed-text-v2-moe"
  baseURL: "http://localhost:11434"
  dimension: 768

gbrain:
  dbPath: "~/.memohub/gbrain.lancedb"
  tableName: "gbrain"

clawmem:
  dbPath: "~/.memohub/clawmem.lancedb"
  tableName: "clawmem"

sync:
  enabled: false
```

### Hermes 集成配置

```yaml
embedding:
  model: "nomic-embed-text-v2-moe"
  baseURL: "http://localhost:11434"
  dimension: 768

gbrain:
  dbPath: "~/.hermes/data/gbrain.lancedb"
  tableName: "gbrain"

clawmem:
  dbPath: "~/.hermes/data/clawmem.lancedb"
  tableName: "clawmem"

sync:
  enabled: false
```

### 私有仓库同步配置

```yaml
embedding:
  model: "nomic-embed-text-v2-moe"
  baseURL: "http://localhost:11434"
  dimension: 768

gbrain:
  dbPath: "~/.memohub/gbrain.lancedb"
  tableName: "gbrain"

clawmem:
  dbPath: "~/.memohub/clawmem.lancedb"
  tableName: "clawmem"

sync:
  enabled: true
  repoUrl: "git@github.com:your-username/memohub-memory-private.git"
  branch: "main"
  syncInterval: "1h"
  dataPath: "~/.memohub/"
```

---

## 配置验证

使用 CLI 验证配置：

```bash
# 验证配置
mh config --validate

# 显示配置
mh config --show
```

---

## 常见配置问题

### Q: 更改了配置后需要重启吗？

**A**: 不需要。配置在每次命令运行时重新加载。

### Q: 如何使用不同的嵌入模型？

**A**: 修改 `embedding.model` 和 `embedding.dimension`，然后重新添加记录。

### Q: 如何迁移数据库？

**A**: 修改 `dbPath` 后，手动复制数据库文件：

```bash
cp -r ~/.memohub/ /new/path/
```

### Q: 环境变量和 YAML 配置哪个优先级高？

**A**: 环境变量优先级更高。

---

## 安全建议

1. **不要提交配置文件**：`config/config.yaml` 应该在 `.gitignore` 中
2. **使用环境变量**：敏感信息使用环境变量
3. **限制文件权限**：

```bash
chmod 600 config/config.yaml
```

---

需要更多帮助？查看 [快速开始](quickstart.md) 或 [常见问题](../docs/faq.md)。
