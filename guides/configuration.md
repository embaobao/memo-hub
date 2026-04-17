# 配置指南

本指南详细说明 MemoHub 的配置选项。

## 配置文件结构

配置文件位于 `config/config.yaml`，包含以下部分：

```yaml
# 嵌入模型配置
embedding:
  model: "nomic-embed-text-v2-moe"
  baseURL: "http://localhost:11434"
  dimension: 768

# GBrain 配置
gbrain:
  dbPath: "~/.memohub/gbrain.lancedb"
  tableName: "gbrain"

# ClawMem 配置
clawmem:
  dbPath: "~/.memohub/clawmem.lancedb"
  tableName: "clawmem"

# 同步配置
sync:
  enabled: false
  repoUrl: ""
  branch: "main"
  syncInterval: "1h"
  dataPath: "~/.memohub/"
```

---

## 配置选项详解

### 嵌入模型配置 (`embedding`)

#### `model`
嵌入模型名称。

**支持的模型**：
- `nomic-embed-text-v2-moe` (推荐)
- `nomic-embed-text-v1`
- `all-minilm`
- 其他 Ollama 支持的嵌入模型

**示例**：
```yaml
embedding:
  model: "nomic-embed-text-v2-moe"
```

#### `baseURL`
Ollama API 端点。

**默认值**：`http://localhost:11434`

**示例**：
```yaml
embedding:
  baseURL: "http://localhost:11434"
```

#### `dimension`
向量维度。

**不同模型的维度**：
- `nomic-embed-text-v2-moe`: 768
- `nomic-embed-text-v1`: 768
- `all-minilm`: 384

**示例**：
```yaml
embedding:
  dimension: 768
```

---

### GBrain 配置 (`gbrain`)

#### `dbPath`
GBrain 数据库路径。

**支持路径格式**：
- 绝对路径：`/Users/username/data/gbrain.lancedb`
- 相对路径：`./data/gbrain.lancedb`
- 用户目录：`~/.memohub/gbrain.lancedb`

**示例**：
```yaml
gbrain:
  dbPath: "~/.memohub/gbrain.lancedb"
```

#### `tableName`
GBrain 表名。

**默认值**：`gbrain`

**示例**：
```yaml
gbrain:
  tableName: "gbrain"
```

---

### ClawMem 配置 (`clawmem`)

#### `dbPath`
ClawMem 数据库路径。

**格式**：同 GBrain

**示例**：
```yaml
clawmem:
  dbPath: "~/.memohub/clawmem.lancedb"
```

#### `tableName`
ClawMem 表名。

**默认值**：`clawmem`

**示例**：
```yaml
clawmem:
  tableName: "clawmem"
```

---

### 同步配置 (`sync`)

#### `enabled`
是否启用私有仓库同步。

**值**：`true` / `false`

**示例**：
```yaml
sync:
  enabled: true
```

#### `repoUrl`
私有 Git 仓库 URL。

**支持的格式**：
- SSH：`git@github.com:username/repo.git`
- HTTPS：`https://github.com/username/repo.git`

**示例**：
```yaml
sync:
  repoUrl: "git@github.com:your-username/memohub-memory-private.git"
```

#### `branch`
同步分支。

**默认值**：`main`

**示例**：
```yaml
sync:
  branch: "main"
```

#### `syncInterval`
同步间隔。

**支持的格式**：
- 数字（秒）：`3600`
- 分钟：`60m`, `1h`
- 小时：`24h`

**示例**：
```yaml
sync:
  syncInterval: "1h"
```

#### `dataPath`
要同步的数据路径。

**示例**：
```yaml
sync:
  dataPath: "~/.memohub/"
```

---

## 环境变量

除了 YAML 配置文件，MemoHub 也支持环境变量覆盖。

### 嵌入模型环境变量

```bash
export MEMOHUB_EMBEDDING_MODEL="nomic-embed-text-v2-moe"
export MEMOHUB_EMBEDDING_BASE_URL="http://localhost:11434"
export MEMOHUB_EMBEDDING_DIMENSION="768"
```

### 数据库环境变量

```bash
export MEMOHUB_GBRAIN_DB_PATH="~/.memohub/gbrain.lancedb"
export MEMOHUB_GBRAIN_TABLE_NAME="gbrain"
export MEMOHUB_CLAWMEM_DB_PATH="~/.memohub/clawmem.lancedb"
export MEMOHUB_CLAWMEM_TABLE_NAME="clawmem"
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
