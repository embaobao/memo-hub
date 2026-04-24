# MemoHub v3 - 配置指南完整版

> **🎯 配置类型**: YAML 配置文件、环境变量、CLI 参数
> **⚡ 配置优先级**: 环境变量 > YAML 配置 > 默认值

---

## 📋 目录

- [快速开始](#快速开始)
- [配置文件](#配置文件)
- [环境变量](#环境变量)
- [配置参数详解](#配置参数详解)
- [模型配置](#模型配置)
- [存储配置](#存储配置)
- [测试配置](#测试配置)
- [故障排除](#故障排除)

---

## 🚀 快速开始

### 1. 创建配置文件

**位置**: `config/config.yaml`（项目根目录或用户主目录）

```yaml
# AI 嵌入配置
embedding:
  url: http://localhost:11434/v1           # Ollama 服务地址
  model: nomic-embed-text-v2-moe          # 嵌入模型
  dimensions: 768                          # 向量维度
  timeout: 30                              # 超时时间（秒）

# 存储配置
storage:
  dbPath: ~/.memohub/data/memohub.lancedb  # 向量数据库路径
  casPath: ~/.memohub/blobs                # CAS 存储路径
```

### 2. 使用环境变量（可选）

```bash
# 设置环境变量（覆盖 YAML 配置）
export EMBEDDING_URL=http://localhost:11434/v1
export EMBEDDING_MODEL=nomic-embed-text-v2-moe
export MEMOHUB_DB_PATH=~/.memohub/data/memohub.lancedb
```

### 3. 验证配置

```bash
# 验证配置是否正确
memohub config --validate
```

---

## 📁 配置文件

### 配置文件位置

MemoHub 按以下顺序查找配置文件：

1. **环境变量 `MEMOHUB_CONFIG`** 指定的路径
2. **项目根目录**: `config/config.yaml`
3. **用户主目录**: `~/.memohub/config.yaml`

### 配置文件格式

**YAML 格式**:

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

# 可选：AI 补全配置（未来支持）
completion:
  url: http://localhost:11434/v1
  model: llama3
  timeout: 60
```

---

## 🔐 环境变量

### 完整环境变量列表

#### AI 嵌入配置

| 环境变量 | 说明 | 默认值 | 必填 |
|---------|------|--------|------|
| `EMBEDDING_URL` | Ollama 服务地址 | `http://localhost:11434/v1` | ❌ |
| `EMBEDDING_MODEL` | 嵌入模型名称 | `nomic-embed-text-v2-moe` | ❌ |
| `EMBEDDING_DIMENSIONS` | 向量维度 | `768` | ❌ |
| `EMBEDDING_TIMEOUT` | 超时时间（秒） | `30` | ❌ |

#### 存储配置

| 环境变量 | 说明 | 默认值 | 必填 |
|---------|------|--------|------|
| `MEMOHUB_DB_PATH` | 向量数据库路径 | `~/.memohub/data/memohub.lancedb` | ❌ |
| `MEMOHUB_CAS_PATH` | CAS 存储路径 | `~/.memohub/blobs` | ❌ |

#### 配置文件路径

| 环境变量 | 说明 | 默认值 | 必填 |
|---------|------|--------|------|
| `MEMOHUB_CONFIG` | 配置文件路径 | `config/config.yaml` | ❌ |

### 环境变量使用示例

#### 临时设置（当前会话）

```bash
# Linux/macOS
export EMBEDDING_URL=http://localhost:11434/v1
export EMBEDDING_MODEL=nomic-embed-text-v2-moe
export MEMOHUB_DB_PATH=~/.memohub/data/memohub.lancedb

# Windows (CMD)
set EMBEDDING_URL=http://localhost:11434/v1
set EMBEDDING_MODEL=nomic-embed-text-v2-moe

# Windows (PowerShell)
$env:EMBEDDING_URL="http://localhost:11434/v1"
$env:EMBEDDING_MODEL="nomic-embed-text-v2-moe"
```

#### 永久设置

**Linux/macOS**: 添加到 `~/.bashrc` 或 `~/.zshrc`

```bash
echo 'export EMBEDDING_URL=http://localhost:11434/v1' >> ~/.bashrc
echo 'export EMBEDDING_MODEL=nomic-embed-text-v2-moe' >> ~/.bashrc
source ~/.bashrc
```

**Windows**: 添加到系统环境变量

1. 右键"此电脑" → "属性" → "高级系统设置"
2. 点击"环境变量"
3. 添加新的用户变量

---

## 📊 配置参数详解

### embedding 配置

#### url

**说明**: Ollama 服务地址

**类型**: `string`

**默认值**: `http://localhost:11434/v1`

**示例**:
```yaml
embedding:
  url: http://localhost:11434/v1
```

**注意事项**:
- 确保 Ollama 服务正在运行
- 可以使用远程 Ollama 服务
- 端口默认是 11434

---

#### model

**说明**: 嵌入模型名称

**类型**: `string`

**默认值**: `nomic-embed-text-v2-moe`

**可用模型**:
- `nomic-embed-text-v2-moe` (推荐，768 维)
- `nomic-embed-text-v1.5` (768 维)
- `mxbai-embed-large-v1` (1024 维)
- `all-MiniLM-L6-v2` (384 维)

**示例**:
```yaml
embedding:
  model: nomic-embed-text-v2-moe
```

**更换模型**:
```bash
# 拉取新模型
ollama pull nomic-embed-text-v1.5

# 更新配置
export EMBEDDING_MODEL=nomic-embed-text-v1.5
```

---

#### dimensions

**说明**: 向量维度

**类型**: `number`

**默认值**: `768`

**注意**: 必须与模型的实际维度匹配

**常见模型维度**:
- `nomic-embed-text-v2-moe`: 768
- `nomic-embed-text-v1.5`: 768
- `mxbai-embed-large-v1`: 1024
- `all-MiniLM-L6-v2`: 384

**示例**:
```yaml
embedding:
  model: mxbai-embed-large-v1
  dimensions: 1024
```

---

#### timeout

**说明**: 请求超时时间（秒）

**类型**: `number`

**默认值**: `30`

**示例**:
```yaml
embedding:
  timeout: 60  # 增加到 60 秒
```

---

### storage 配置

#### dbPath

**说明**: LanceDB 向量数据库路径

**类型**: `string`

**默认值**: `~/.memohub/data/memohub.lancedb`

**示例**:
```yaml
storage:
  dbPath: ~/.memohub/data/memohub.lancedb
```

**路径说明**:
- 支持 `~` 扩展（用户主目录）
- 支持相对路径和绝对路径
- 目录不存在时会自动创建

---

#### casPath

**说明**: CAS (Content Addressable Storage) 存储路径

**类型**: `string`

**默认值**: `~/.memohub/blobs`

**示例**:
```yaml
storage:
  casPath: ~/.memohub/blobs
```

**路径说明**:
- 存储原始内容（文本、代码）
- 通过 SHA256 哈希去重
- 支持 `~` 扩展

---

## 🤖 模型配置

### Ollama 配置

#### 1. 安装 Ollama

```bash
# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.com/install.sh | sh

# Windows
# 从 https://ollama.com/download 下载安装包
```

#### 2. 启动 Ollama

```bash
# 启动服务
ollama serve
```

**验证**:
```bash
# 查看 Ollama 版本
ollama --version

# 列出已安装模型
ollama list
```

#### 3. 拉取嵌入模型

```bash
# 拉取默认模型
ollama pull nomic-embed-text-v2-moe

# 拉取其他模型
ollama pull nomic-embed-text-v1.5
ollama pull mxbai-embed-large-v1
```

#### 4. 测试模型

```bash
# 测试嵌入
ollama run nomic-embed-text-v2-moe "测试文本"
```

---

### 模型推荐

#### 轻量级（资源受限）

| 模型 | 维度 | 速度 | 质量 |
|------|------|------|------|
| `all-MiniLM-L6-v2` | 384 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

**配置**:
```yaml
embedding:
  model: all-MiniLM-L6-v2
  dimensions: 384
```

---

#### 平衡级（推荐）

| 模型 | 维度 | 速度 | 质量 |
|------|------|------|------|
| `nomic-embed-text-v1.5` | 768 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| `nomic-embed-text-v2-moe` | 768 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

**配置**:
```yaml
embedding:
  model: nomic-embed-text-v2-moe
  dimensions: 768
```

---

#### 高精度

| 模型 | 维度 | 速度 | 质量 |
|------|------|------|------|
| `mxbai-embed-large-v1` | 1024 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

**配置**:
```yaml
embedding:
  model: mxbai-embed-large-v1
  dimensions: 1024
```

---

## 🧪 测试配置

### 1. 验证 Ollama 连接

```bash
# 测试 Ollama 服务
curl http://localhost:11434/v1/tags

# 或使用 ollama 命令
ollama list
```

**预期输出**:
```json
{
  "models": [
    {
      "name": "nomic-embed-text-v2-moe",
      "modified_at": "2026-04-24T00:00:00Z"
    }
  ]
}
```

---

### 2. 验证 MemoHub 配置

```bash
# 验证配置文件
memohub config --validate
```

**预期输出**:
```
✅ Configuration is valid
```

---

### 3. 测试添加知识

```bash
# 测试添加功能
memohub add "测试知识内容" -c test
```

**预期输出**:
```
✔ Added: insight-xxx
```

---

### 4. 测试搜索功能

```bash
# 测试搜索功能
memohub search "测试"
```

**预期输出**:
```
✔ Found 1 results:
  [0.1234] 测试知识内容...
```

---

### 5. 测试嵌入功能

```bash
# 查看配置
memohub config

# 应该看到 embedding 配置
```

---

## 🔧 配置优先级

### 优先级顺序

```
环境变量 (最高) > YAML 配置文件 > 代码默认值 (最低)
```

### 示例

**YAML 配置**:
```yaml
embedding:
  url: http://localhost:11434/v1
  model: nomic-embed-text-v2-moe
```

**环境变量**:
```bash
export EMBEDDING_URL=http://remote-server:11434/v1
export EMBEDDING_MODEL=mxbai-embed-large-v1
```

**最终使用的配置**:
```yaml
url: http://remote-server:11434/v1  # 使用环境变量
model: mxbai-embed-large-v1         # 使用环境变量
dimensions: 768                       # 使用 YAML 配置
timeout: 30                          # 使用代码默认值
```

---

## 🎯 不同场景的配置

### 开发环境

```yaml
# config/config.yaml
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
# config/config.yaml
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

### Hermes AI 集成

```bash
# ~/.hermes/config.yaml
mcpServers:
  memohub:
    command: memohub
    args: ["serve"]
    env:
      MEMOHUB_DB_PATH: ~/.hermes/data/memohub.lancedb
      EMBEDDING_URL: http://localhost:11434/v1
```

---

### Claude Code 集成

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

## 🔍 故障排除

### 问题 1: 配置文件未找到

**症状**: `Configuration file not found`

**解决方案**:

1. **检查文件是否存在**
   ```bash
   ls -la config/config.yaml
   ```

2. **检查环境变量**
   ```bash
   echo $MEMOHUB_CONFIG
   ```

3. **使用默认配置**
   - 如果没有配置文件，会使用代码默认值

---

### 问题 2: 无法连接到 Ollama

**症状**: `Failed to connect to Ollama`

**解决方案**:

1. **检查 Ollama 是否运行**
   ```bash
   ollama list
   ```

2. **启动 Ollama**
   ```bash
   ollama serve
   ```

3. **检查 URL 配置**
   ```bash
   echo $EMBEDDING_URL
   # 应该输出: http://localhost:11434/v1
   ```

---

### 问题 3: 模型不存在

**症状**: `Model not found: nomic-embed-text-v2-moe`

**解决方案**:

1. **拉取模型**
   ```bash
   ollama pull nomic-embed-text-v2-moe
   ```

2. **更新配置**
   ```bash
   export EMBEDDING_MODEL=nomic-embed-text-v1.5
   ```

---

### 问题 4: 数据库路径错误

**症状**: `Cannot write to database path`

**解决方案**:

1. **检查路径权限**
   ```bash
   ls -la ~/.memohub/data/
   ```

2. **创建目录**
   ```bash
   mkdir -p ~/.memohub/data
   mkdir -p ~/.memohub/blobs
   ```

3. **使用绝对路径**
   ```bash
   export MEMOHUB_DB_PATH=/tmp/memohub/data/memohub.lancedb
   ```

---

## 📚 相关文档

- [集成指南首页](./index.md) - 所有集成方式
- [MCP 协议集成](./mcp-integration.md) - MCP 集成配置
- [CLI 命令集成](./cli-integration.md) - CLI 使用
- [架构文档](../architecture/overview.md) - 系统架构

---

**版本**: 3.0.0
**最后更新**: 2026-04-24
