# 配置统一和集成文档更新完成

## ✅ 完成的工作

### 1. 集成文档更新

**移除所有绝对路径，改为先安装 CLI 后集成**

更新的文档：
- ✅ [MCP 协议集成](docs/integration/mcp-integration.md) - 移除绝对路径，使用 `memohub serve` 命令
- ✅ [CLI 命令集成](docs/integration/cli-integration.md) - 移除绝对路径，强调全局安装
- ✅ [配置指南完整版](docs/guides/configuration.md) - 统一所有配置参数和环境变量

**关键变更**:
```
旧方式（不推荐）:
  command: node
  args: ["/Users/embaobao/workspace/ai/memo-hub/apps/cli/dist/index.js", "serve"]

新方式（推荐）:
  command: memohub
  args: ["serve"]
```

---

### 2. 配置统一

**创建统一配置文档**:

#### [docs/guides/configuration.md](docs/guides/configuration.md)

**内容包括**:
- ✅ 完整的环境变量列表（8 个环境变量）
- ✅ 配置参数详解（每个参数的类型、默认值、示例）
- ✅ 模型配置（Ollama 配置步骤）
- ✅ 模型推荐（轻量级、平衡级、高精度）
- ✅ 测试配置（5 个测试步骤）
- ✅ 不同场景配置（开发、生产、AI Agent 集成）
- ✅ 故障排除（4 个常见问题）

#### [docs/guides/CONFIGURATION_SUMMARY.md](docs/guides/CONFIGURATION_SUMMARY.md)

**快速参考文档**:
- ✅ 环境变量完整列表（表格形式）
- ✅ 配置文件模板
- ✅ 测试配置步骤
- ✅ 不同场景配置示例

---

### 3. npm 发布脚本

**更新 apps/cli/package.json**:

```json
{
  "scripts": {
    "build": "tsc",
    "test": "bun test",
    "prepack": "bun run build",
    "pack": "npm pack",
    "prepublishOnly": "bun run build",
    "publish:public": "npm publish --access public",
    "update": "node dist/update.js"
  }
}
```

**新增脚本**:
- ✅ `publish:public` - 发布到 npm 公开仓库
- ✅ `update` - 检查并更新 CLI 到最新版本

---

### 4. update 命令实现

**创建 apps/cli/src/update.ts**:

**功能**:
- ✅ 检查当前版本
- ✅ 从 npm registry 获取最新版本
- ✅ 比较版本号
- ✅ 提示更新命令

**使用方法**:
```bash
memohub update
```

---

### 5. 测试配置

**测试结果**:

```bash
# 1. 验证配置
$ memohub config --validate
✅ Configuration is valid

# 2. 检查版本
$ memohub --version
3.0.0

# 3. 测试配置
$ memohub config
{
  "embedding": {
    "url": "http://localhost:11434/v1",
    "model": "nomic-embed-text-v2-moe",
    "dimensions": 768,
    "timeout": 30
  },
  "storage": {
    "dbPath": "~/.memohub/data/memohub.lancedb",
    "casPath": "~/.memohub/blobs"
  }
}
```

---

## 📊 环境变量完整列表

### AI 嵌入配置（4 个）

| 环境变量 | 说明 | 默认值 |
|---------|------|--------|
| `EMBEDDING_URL` | Ollama 服务地址 | `http://localhost:11434/v1` |
| `EMBEDDING_MODEL` | 嵌入模型名称 | `nomic-embed-text-v2-moe` |
| `EMBEDDING_DIMENSIONS` | 向量维度 | `768` |
| `EMBEDDING_TIMEOUT` | 超时时间（秒） | `30` |

### 存储配置（2 个）

| 环境变量 | 说明 | 默认值 |
|---------|------|--------|
| `MEMOHUB_DB_PATH` | 向量数据库路径 | `~/.memohub/data/memohub.lancedb` |
| `MEMOHUB_CAS_PATH` | CAS 存储路径 | `~/.memohub/blobs` |

### 配置文件路径（1 个）

| 环境变量 | 说明 | 默认值 |
|---------|------|--------|
| `MEMOHUB_CONFIG` | 配置文件路径 | `config/config.jsonc` |

---

## 🔧 配置优先级

```
环境变量 (最高) > YAML 配置文件 > 代码默认值 (最低)
```

---

## 📋 MCP Server 配置

### Claude Code 配置

**配置文件**: `~/.claude/config.json`

```json
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

### ChatGPT 配置

**在 ChatGPT 设置中添加**:
- **Name**: MemoHub
- **Command**: `memohub`
- **Args**: `["serve"]`

---

## 🤖 模型配置

### Ollama 配置步骤

```bash
# 1. 安装 Ollama
brew install ollama  # macOS
# 或
curl -fsSL https://ollama.com/install.sh | sh  # Linux

# 2. 启动服务
ollama serve

# 3. 拉取模型
ollama pull nomic-embed-text-v2-moe

# 4. 验证配置
memohub config --validate
```

### 推荐模型

| 使用场景 | 推荐模型 | 维度 | 配置 |
|---------|---------|------|------|
| **通用** | `nomic-embed-text-v2-moe` | 768 | 默认配置 |
| **资源受限** | `all-MiniLM-L6-v2` | 384 | `dimensions: 384` |
| **高精度** | `mxbai-embed-large-v1` | 1024 | `dimensions: 1024` |

---

## 🎯 CLI 安装和使用

### 全局安装

```bash
# 1. 构建项目
cd /path/to/memo-hub
bun install && bun run build

# 2. 全局安装
cd apps/cli
npm link --force

# 3. 验证安装
memohub --version
```

### 使用 CLI

```bash
# 添加知识
memohub add "知识内容" -c category -t tags

# 搜索知识
memohub search "查询" -l 5

# 检查更新
memohub update

# 配置管理
memohub config --validate
```

---

## 📚 相关文档

- [配置指南完整版](docs/guides/configuration.md) - 详细配置说明
- [配置快速参考](docs/guides/CONFIGURATION_SUMMARY.md) - 快速参考
- [MCP 协议集成](docs/integration/mcp-integration.md) - MCP 集成
- [CLI 命令集成](docs/integration/cli-integration.md) - CLI 使用

---

## ✅ 验证清单

- ✅ 移除集成文档中的所有绝对路径
- ✅ 统一所有配置参数和环境变量到一个文档
- ✅ 创建配置指南完整版
- ✅ 创建配置快速参考
- ✅ 添加 npm 发布脚本
- ✅ 实现 CLI update 命令
- ✅ 测试配置验证
- ✅ 编译项目成功
- ✅ CLI 全局安装成功

---

**完成时间**: 2026-04-24
**版本**: 3.0.0
**状态**: ✅ 配置统一和集成文档更新完成
