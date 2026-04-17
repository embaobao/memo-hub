# MemoHub

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue)](https://www.typescriptlang.org/)
[![LanceDB](https://img.shields.io/badge/LanceDB-0.26.2-orange)](https://lancedb.com/)

**我的记忆中心 - 基于向量嵌入的智能记忆管理**

[功能特性](#-功能特性) • [快速开始](#-快速开始) • [使用文档](#-使用文档) • [隐私安全](#-隐私安全)

</div>

---

## 📖 项目简介

MemoHub 是一个独立的、基于向量嵌入的双轨记忆系统 CLI 工具，作为**你的个人记忆中心**，将记忆分为两条轨道：

- **GBrain (通用知识)**：存储事实、概念、用户偏好等通用性知识
- **ClawMem (代码记忆)**：存储代码片段、API 使用、架构设计等技术性记忆

### 核心理念

> **MemoHub = Memo（记忆）+ Hub（中心枢纽）**
>
> 它是你记忆的汇聚点，通过语义搜索实现智能检索，让知识和经验不再流失。

### 核心特性

- 🧠 **双轨记忆架构**：通用知识与代码记忆分离管理
- 🔍 **语义搜索**：基于向量嵌入的高效相似度搜索
- 💾 **LanceDB 存储**：高性能向量数据库，支持大规模数据
- 🤖 **本地嵌入模型**：使用 Ollama 本地模型，无需云端 API
- 🔒 **隐私保护**：本地数据库，可选私有仓库同步
- 🚀 **快速响应**：毫秒级搜索响应，即时反馈
- 🔧 **CLI 工具**：简洁的命令行界面，易于集成

### 适用场景

- 个人知识管理
- 代码片段归档
- AI 智能体长期记忆
- 技术文档索引
- 用户偏好存储
- 项目经验积累

---

## ✨ 功能特性

### 📊 记忆管理

- ✅ 添加知识（支持分类、标签、重要性评分）
- ✅ 语义搜索知识（相似度排序）
- ✅ 查看统计信息（记录数、数据库大小）
- ✅ 删除知识（按 ID 批量删除）

### 💻 代码记忆

- ✅ 添加代码片段（支持文件路径、符号名、AST 类型）
- ✅ 代码语义搜索（识别代码类型和功能）
- ✅ 代码分类管理（interface, function, class 等）

### ⚙️ 配置管理

- ✅ YAML 配置文件
- ✅ 环境变量覆盖
- ✅ 配置验证
- ✅ 多环境支持

### 🔌 插件系统（实验性）

- ✅ 自动记忆提取（从会话中提取知识）
- ✅ 记忆注入（向系统注入记忆）
- 🚧 私有仓库同步（开发中）

---

## 🚀 快速开始

### 环境要求

- Node.js >= 22.0.0
- Bun >= 1.3.0（推荐）
- Ollama 服务（用于本地嵌入）

### 安装 Ollama 和嵌入模型

```bash
# 安装 Ollama（如果还没安装）
curl -fsSL https://ollama.com/install.sh | sh

# 拉取嵌入模型
ollama pull nomic-embed-text-v2-moe

# 启动 Ollama 服务
ollama serve
```

### 安装 MemoHub

#### 方式一：从源码安装（推荐开发者）

```bash
# 克隆仓库
git clone https://github.com/your-username/memohub.git
cd memohub

# 安装依赖
bun install

# 构建项目
bun run build

# 配置文件
cp config/config.example.yaml config/config.yaml

# 测试安装
mh --help
```

#### 方式二：全局安装（生产环境）

```bash
# 从源码构建后安装
cd memohub
bun run build
npm install -g .

# 或者直接 npm install（会自动构建）
npm install -g https://github.com/your-username/memohub.git

# 测试
mh --help
```

### 配置文件

编辑 `config/config.yaml`：

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
  repoUrl: ""
  branch: "main"
  syncInterval: "1h"
  dataPath: "~/.memohub/"
```

### 首次使用

```bash
# 查看统计信息
mh stats

# 添加知识
mh add-knowledge "用户喜欢 TypeScript 开发" -c user -i 0.9

# 搜索知识
mh search-knowledge "TypeScript" -l 5

# 添加代码
mh add-code "interface User { name: string; }" \
  -f user.ts -a interface -s User

# 搜索代码
mh search-code "interface User" -l 3
```

---

## 📚 使用文档

### 基础命令

#### 查看统计

```bash
mh stats
```

输出示例：
```
GBrain (通用知识):
  总记录数: 69
  数据库路径: ~/.memohub/gbrain.lancedb
  嵌入模型: nomic-embed-text-v2-moe
  向量维度: 768

ClawMem (代码记忆):
  总记录数: 833
  数据库路径: ~/.memohub/clawmem.lancedb
  嵌入模型: nomic-embed-text-v2-moe
  向量维度: 768
```

#### 添加知识

```bash
mh add-knowledge "知识内容" \
  -c 分类 \
  -i 重要性 \
  -t 标签1,标签2
```

参数说明：
- `-c, --category`: 分类（user, memory, system, project-catalog 等）
- `-i, --importance`: 重要性评分（0-1，默认 0.5）
- `-t, --tags`: 标签列表（逗号分隔）

示例：
```bash
mh add-knowledge "用户喜欢 TypeScript 和 React 开发" \
  -c user \
  -i 0.9 \
  -t preference,typescript,react

mh add-knowledge "项目使用 Node.js v22 和 Bun 运行时" \
  -c environment \
  -i 0.8 \
  -t system,nodejs,bun
```

#### 搜索知识

```bash
mh search-knowledge "搜索关键词" -l 5
```

参数说明：
- `-l, --limit`: 返回结果数量（默认 5）

示例：
```bash
mh search-knowledge "TypeScript 开发" -l 3
mh search-knowledge "用户偏好" -l 5
```

输出示例：
```
[1] user (相似度: 0.61)
用户喜欢 TypeScript 和 React 开发，偏好使用 VSCode 编辑器

[2] project-catalog (相似度: 0.37)
Claude Code 项目记忆 - 实验项目目录（11 个）

[3] project-catalog (相似度: 0.36)
Claude Code 项目记忆 - 开源项目目录（33 个）
```

#### 删除知识

```bash
mh delete-knowledge gbrain-id1,gbrain-id2
```

#### 添加代码

```bash
mh add-code "代码内容" \
  -f 文件路径 \
  -a AST 类型 \
  -s 符号名 \
  -l 语言 \
  -i 重要性 \
  -t 标签
```

参数说明：
- `-f, --file-path`: 文件路径
- `-a, --ast-type`: AST 类型（interface, function, class, unknown 等）
- `-s, --symbol-name`: 符号名
- `-l, --language`: 编程语言（typescript, python, javascript 等）
- `-i, --importance`: 重要性评分（0-1）
- `-t, --tags`: 标签列表

示例：
```bash
mh add-code "interface MemoryConfig { dbPath: string; }" \
  -f config.ts \
  -a interface \
  -s MemoryConfig \
  -l typescript \
  -i 0.8 \
  -t memory,config

mh add-code "function search(query: string): Promise<Result[]>" \
  -f search.ts \
  -a function \
  -s search \
  -l typescript \
  -i 0.9 \
  -t search,async
```

#### 搜索代码

```bash
mh search-code "代码关键词" -l 3
```

示例：
```bash
mh search-code "interface Config" -l 3
mh search-code "function search" -l 5
```

#### 配置验证

```bash
mh config --validate
```

输出：
```
✓ 配置验证通过
```

#### 显示配置

```bash
mh config --show
```

---

### 高级功能

#### 环境变量配置

除了 YAML 配置文件，MemoHub 也支持环境变量：

```bash
# 嵌入配置
export MEMOHUB_EMBEDDING_MODEL="nomic-embed-text-v2-moe"
export MEMOHUB_EMBEDDING_BASE_URL="http://localhost:11434"

# 数据库路径
export MEMOHUB_GBRAIN_DB_PATH="~/.memohub/gbrain.lancedb"
export MEMOHUB_CLAWMEM_DB_PATH="~/.memohub/clawmem.lancedb"
```

#### 与 Hermes 兼容

MemoHub 完全兼容 Hermes 记忆系统，可以共享同一数据库：

```yaml
gbrain:
  dbPath: "~/.hermes/data/gbrain.lancedb"

clawmem:
  dbPath: "~/.hermes/data/clawmem.lancedb"
```

---

### 插件使用

#### 自动记忆提取

```bash
# 构建插件
bun run build:plugins

# 从会话文件中提取知识
node plugins/auto-memory-extractor/dist/cli.js \
  extract \
  -s ~/.hermes/sessions/session_xxx.json

# 监控会话目录
node plugins/auto-memory-extractor/dist/cli.js \
  watch \
  -d ~/.hermes/sessions
```

#### 记忆注入

```bash
# 向系统注入记忆
node plugins/memory-injection/dist/cli.js \
  inject \
  -c config.yaml \
  -t "会话摘要"
```

---

## 🔌 MCP 服务器

### 简介

MemoHub 提供了统一的 MCP（Model Context Protocol）服务器，可以与 Hermes 等智能体无缝集成。

### MCP 工具

**GBrain 工具**：
- `query_knowledge` - 搜索知识
- `add_knowledge` - 添加知识
- `list_categories` - 列出分类
- `delete_knowledge` - 删除知识

**ClawMem 工具**：
- `search_code` - 搜索代码
- `add_code` - 添加代码
- `list_symbols` - 列出符号

**统一工具**：
- `get_stats` - 获取统计信息
- `search_all` - 同时搜索知识和代码

### 与 Hermes 集成

在 `~/.hermes/config.yaml` 中添加：

```yaml
mcpServers:
  memohub:
    command: node
    args:
      - /Users/embaobao/workspace/memory-system-cli/mcp-server/dist/index.js
    env:
      GBRAIN_DB_PATH: ~/.hermes/data/gbrain.lancedb
      CLAWMEM_DB_PATH: ~/.hermes/data/clawmem.lancedb
      EMBEDDING_URL: http://localhost:11434/v1
      EMBEDDING_MODEL: nomic-embed-text-v2-moe
```

### 构建和启动

```bash
# 构建 MCP 服务器
cd mcp-server
bun install
bun run build

# 启动服务器
bun run start
```

### 使用示例

#### 在 Hermes 中搜索知识

```
用户: 查找关于 TypeScript 的知识
Hermes: [调用 query_knowledge] 找到 3 条结果...
```

#### 在 Hermes 中搜索代码

```
用户: 查找接口定义
Hermes: [调用 search_code] 找到 5 个接口...
```

#### 统一搜索

```
用户: 查找记忆系统相关内容
Hermes: [调用 search_all] GBrain 找到 2 条，ClawMem 找到 3 条...
```

### 优势

- ✅ **统一接口**：整合 GBrain 和 ClawMem，一个服务器
- ✅ **完整功能**：9 个工具，覆盖所有需求
- ✅ **Hermes 兼容**：直接对接，无缝集成
- ✅ **资源优化**：一个进程，降低资源占用
- ✅ **易于管理**：统一配置，统一维护

### 文档

详细的 MCP 服务器文档请查看 [mcp-server/README.md](mcp-server/README.md)

---

## 🔒 隐私和安全

### 数据隐私

- ✅ 所有数据存储在本地（LanceDB）
- ✅ 可选私有仓库同步（通过 Git）
- ✅ 不上传任何数据到第三方服务
- ✅ 嵌入模型运行在本地（Ollama）

### 安全建议

1. **不要发布配置文件**：`config/config.yaml` 已在 `.gitignore` 中排除
2. **使用私有仓库同步**：仅同步到可信的私有 Git 仓库
3. **定期备份数据库**：备份 `~/.memohub/` 目录
4. **设置适当的文件权限**：确保数据库文件只有当前用户可访问

### 私有仓库同步配置

```yaml
sync:
  enabled: true
  repoUrl: "git@github.com:your-username/memohub-memory-private.git"
  branch: "main"
  syncInterval: "1h"
  dataPath: "~/.memohub/"
```

> 💡 **重要提示**：MemoHub 发布到 GitHub 时，会自动排除所有本地数据文件和配置文件，确保隐私安全。

### 安全检查清单

发布前确保：

- [ ] `.gitignore` 包含 `config/config.yaml`
- [ ] `.gitignore` 包含 `*.lancedb/` 和 `*.db`
- [ ] `.gitignore` 包含 `config/*.local.env`
- [ ] 所有测试数据已清理
- [ ] 私有仓库同步已禁用或使用私有仓库

---

## 🏗️ 项目架构

```
memohub/
├── src/
│   ├── cli/           # CLI 入口和命令定义
│   ├── core/          # 核心功能（嵌入、配置）
│   └── lib/           # 数据库操作（GBrain、ClawMem）
├── plugins/           # 插件系统
│   ├── auto-memory-extractor/
│   └── memory-injection/
├── config/            # 配置文件
│   ├── config.example.yaml
│   └── config.yaml  # 不发布
├── docs/              # 技术文档
├── guides/            # 使用指南
├── examples/          # 示例代码
└── tests/             # 测试文件
```

---

## 📚 文档

- [快速开始](guides/quickstart.md)
- [配置指南](guides/configuration.md)
- [API 文档](docs/api.md)
- [插件开发](docs/plugins.md)
- [私有仓库同步](guides/private-sync.md)
- [常见问题](docs/faq.md)

---

## 🤝 贡献指南

欢迎贡献！请查看 [CONTRIBUTING.md](CONTRIBUTING.md) 了解详情。

### 开发环境设置

```bash
# 克隆仓库
git clone https://github.com/your-username/memohub.git
cd memohub

# 安装依赖
bun install

# 开发模式（热重载）
bun run dev

# 运行测试
bun test

# 代码格式化
bun run format

# 构建
bun run build
```

---

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

---

## 🙏 致谢

- [LanceDB](https://lancedb.com/) - 高性能向量数据库
- [Ollama](https://ollama.com/) - 本地 AI 模型运行
- [Commander.js](https://commander.js/) - CLI 框架
- [Chalk](https://github.com/chalk/chalk) - 终端样式

---

## 📮 联系方式

- 作者：盟哥
- 问题反馈：[GitHub Issues](https://github.com/your-username/memohub/issues)
- 讨论：[GitHub Discussions](https://github.com/your-username/memohub/discussions)

---

<div align="center">

**如果觉得有用，请给个 ⭐️ Star！**

Made with ❤️ by 盟哥

</div>
