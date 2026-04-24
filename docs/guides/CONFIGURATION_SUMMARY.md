# MemoHub v1 - 配置总结

> **✅ 配置已统一**: 所有配置参数和环境变量都在一个文档中

---

## 📋 快速参考

### 配置文件位置

1. **环境变量 `MEMOHUB_CONFIG`** 指定的路径
2. **项目根目录**: `config/config.jsonc`
3. **用户主目录**: `~/.memohub/config.jsonc`

### 配置优先级

```
环境变量 (最高) > YAML 配置 > 默认值 (最低)
```

---

## 🔐 环境变量完整列表

### AI 嵌入配置

| 环境变量 | 说明 | 默认值 |
|---------|------|--------|
| `EMBEDDING_URL` | Ollama 服务地址 | `http://localhost:11434/v1` |
| `EMBEDDING_MODEL` | 嵌入模型名称 | `nomic-embed-text-v2-moe` |
| `EMBEDDING_DIMENSIONS` | 向量维度 | `768` |
| `EMBEDDING_TIMEOUT` | 超时时间（秒） | `30` |

### 存储配置

| 环境变量 | 说明 | 默认值 |
|---------|------|--------|
| `MEMOHUB_DB_PATH` | 向量数据库路径 | `~/.memohub/data/memohub.lancedb` |
| `MEMOHUB_CAS_PATH` | CAS 存储路径 | `~/.memohub/blobs` |

### 配置文件路径

| 环境变量 | 说明 | 默认值 |
|---------|------|--------|
| `MEMOHUB_CONFIG` | 配置文件路径 | `config/config.jsonc` |

---

## 📁 配置文件模板

### 完整配置文件

**位置**: `config/config.jsonc`

```yaml
# AI 嵌入配置
embedding:
  url: http://localhost:11434/v1
  model: nomic-embed-text-v2-moe
  dimensions: 768
  timeout: 30

# 存储配置
storage:
  dbPath: ~/.memohub/data/memohub.lancedb
  casPath: ~/.memohub/blobs
```

---

## 🤖 模型配置

### Ollama 配置步骤

1. **安装 Ollama**
   ```bash
   # macOS
   brew install ollama
   
   # Linux
   curl -fsSL https://ollama.com/install.sh | sh
   ```

2. **启动服务**
   ```bash
   ollama serve
   ```

3. **拉取模型**
   ```bash
   ollama pull nomic-embed-text-v2-moe
   ```

4. **验证配置**
   ```bash
   memohub config --validate
   ```

### 推荐模型

| 使用场景 | 推荐模型 | 维度 | 配置 |
|---------|---------|------|------|
| **通用** | `nomic-embed-text-v2-moe` | 768 | 默认配置 |
| **资源受限** | `all-MiniLM-L6-v2` | 384 | `dimensions: 384` |
| **高精度** | `mxbai-embed-large-v1` | 1024 | `dimensions: 1024` |

---

## 🧪 测试配置

### 1. 验证配置

```bash
memohub config --validate
```

**预期输出**:
```
✅ Configuration is valid
```

---

### 2. 测试添加知识

```bash
memohub add "测试知识" -c test
```

**预期输出**:
```
✔ Added: insight-xxx
```

---

### 3. 测试搜索

```bash
memohub search "测试"
```

**预期输出**:
```
✔ Found 1 results:
  [0.1234] 测试知识...
```

---

## 🔧 不同场景配置

### 开发环境

```yaml
embedding:
  url: http://localhost:11434/v1
  model: nomic-embed-text-v2-moe
  dimensions: 768
  timeout: 30

storage:
  dbPath: ./data/memohub.lancedb
  casPath: ./data/blobs
```

---

### 生产环境

```yaml
embedding:
  url: http://ollama.internal:11434/v1
  model: mxbai-embed-large-v1
  dimensions: 1024
  timeout: 60

storage:
  dbPath: /var/lib/memohub/data/memohub.lancedb
  casPath: /var/lib/memohub/blobs
```

---

### AI Agent 集成

#### Hermes AI

```bash
# ~/.hermes/config.jsonc
mcpServers:
  memohub:
    command: memohub
    args: ["serve"]
    env:
      MEMOHUB_DB_PATH: ~/.hermes/data/memohub.lancedb
      EMBEDDING_URL: http://localhost:11434/v1
```

#### Claude Code

```json
// ~/.claude/config.json
{
  "mcpServers": {
    "memohub": {
      "command": "memohub",
      "args": ["serve"],
      "env": {
        "MEMOHUB_DB_PATH": "~/.claude/data/memohub.lancedb",
        "EMBEDDING_URL": "http://localhost:11434/v1"
      }
    }
  }
}
```

---

## 📚 相关文档

- [完整配置指南](./configuration.md) - 详细的配置说明
- [MCP 集成](../integration/mcp-integration.md) - MCP 集成配置
- [CLI 集成](../integration/cli-integration.md) - CLI 使用

---

**版本**: 3.0.0
**最后更新**: 2026-04-24
