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
- 📊 **记忆管理**：列出、总结、萃取、删除知识
- 🧩 **智能整理**：按重要性排序，自动去重
- 🎯 **知识萃取**：从大量记忆中提炼高价值信息

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
- ✅ 列出知识（按重要性排序，文本自动截断）
- ✅ 查看统计信息（记录数、数据库大小）
- ✅ 删除知识（按 ID 批量删除）
- ✅ 按分类清理知识（支持预览）
- ✅ 总结知识（自动总结和提取关键点）
- ✅ 萃取关键知识（从大量记忆中提炼高价值信息）

### 💻 代码记忆

- ✅ 添加代码片段（支持文件路径、符号名、AST 类型）
- ✅ 代码语义搜索（识别代码类型和功能）
- ✅ 代码分类管理（interface, function, class 等）
- ✅ 列出代码（按重要性排序）
- ✅ 删除代码（按 ID 批量删除）

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

#### 列出知识（按重要性排序）

```bash
mh list-knowledge -c user -l 10
```

参数说明：
- `-c, --category`: 分类过滤
- `-l, --limit`: 返回结果数量（默认 10）

输出示例：
```
[1] user 重要性: 0.90
ID: gbrain-1776429063742-jfn13r
--------------------------------------------------------------------------------
用户喜欢 TypeScript 和 React 开发，偏好使用 VSCode 编辑器
来源: cli

[2] user 重要性: 0.90
ID: gbrain-1776419499506-9t9rek
--------------------------------------------------------------------------------
盟哥的用户偏好：喜欢被问候，喜欢通过企微和飞书接收通知
来源: mcp-gbrain
```

#### 总结知识（需要 OpenAI API）

```bash
mh summarize-knowledge -c user
```

功能：自动总结指定分类或关键词的相关记忆，提取关键点。

参数说明：
- `-c, --category`: 分类过滤
- `-q, --query`: 关键词搜索（可选）
- `--include-low`: 包含低重要性记录（可选）

输出示例：
```
📊 记忆总结
================================================================================

统计信息:
  总记录数: 4
  高重要性 (≥0.8): 3
  中等重要性 (0.6-0.8): 1
  低重要性 (<0.6): 0

总结:
用户盟哥的偏好包括喜欢 TypeScript 和 React 开发，偏好使用 VSCode 编辑器，并且喜欢被问候。他通过企业微信和飞书接收通知，工作产物默认保存在目标仓库中。

关键点:
  1. 名字是盟哥，喜欢被问候
  2. 偏好 TypeScript 和 React 开发
  3. 使用 VSCode 编辑器
  4. 通过企微和飞书接收通知
  5. 工作产物保存在目标仓库
```

#### 萃取关键知识（需要 OpenAI API）

```bash
mh extract-knowledge -c project -n 5 --min-importance 0.8
```

功能：从大量记忆中萃取最重要的高质量信息，自动去重。

参数说明：
- `-c, --category`: 分类过滤
- `-q, --query`: 关键词搜索（可选）
- `-n, --n`: 萃取数量（默认 10）
- `--min-importance`: 最低重要性（默认 0.7）
- `--dedup`: 是否去重（默认 true）

输出示例：
```
💎 关键知识萃取
================================================================================

萃取统计:
  处理记录数: 15
  去重删除数: 3
  萃取结果数: 5

萃取结果:
================================================================================

[1] project 重要性: 0.95
--------------------------------------------------------------------------------
MemoHub 双轨记忆系统发布完成
原因: 项目发布的重要里程碑

[2] project 重要性: 0.90
--------------------------------------------------------------------------------
MemoHub 是我的双轨记忆中心 CLI 工具
原因: 重要的系统配置
```

#### 按分类清理知识

```bash
mh clean-knowledge other --dry-run
mh clean-knowledge other
```

功能：删除指定分类的所有知识，支持预览。

参数说明：
- `<category>`: 分类名称
- `--dry-run`: 预览模式，不实际删除

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

#### OpenAI API 配置（用于总结和萃取）

总结知识和萃取关键知识有两种模式：

**模式 1: 使用 OpenAI API（推荐）**

如果配置了 OpenAI API，总结和萃取功能会自动完成：

```bash
# 方法 1：临时配置（当前会话）
export OPENAI_API_KEY="sk-xxx"
export OPENAI_BASE_URL="https://api.openai.com/v1"
export OPENAI_MODEL="gpt-4o-mini"

# 方法 2：永久配置（添加到 ~/.bashrc 或 ~/.zshrc）
echo 'export OPENAI_API_KEY="sk-xxx"' >> ~/.bashrc
echo 'export OPENAI_BASE_URL="https://api.openai.com/v1"' >> ~/.bashrc
echo 'export OPENAI_MODEL="gpt-4o-mini"' >> ~/.bashrc
source ~/.bashrc
```

**推荐模型**：
- `gpt-4o-mini`：速度快，成本低，适合总结和萃取
- `gpt-4o`：质量高，适合复杂的知识整理

**自定义 OpenAI 兼容服务**：
```bash
# 使用其他兼容 OpenAI API 的服务
export OPENAI_BASE_URL="https://your-custom-api.com/v1"
export OPENAI_API_KEY="your-api-key"
```

**模式 2: 使用 Hermes Agent（无需 API）**

如果没有配置 OpenAI API，CLI 会输出结构化的任务指令，指导 Hermes Agent 使用现有的 MCP 工具完成总结和萃取：

```bash
# 示例：总结 user 分类
mh summarize-knowledge -c user
```

输出示例：
```
📋 Hermes Agent 任务指令
================================================================================

未配置 OpenAI API，请使用以下 MCP 工具完成总结：

步骤 1: 查询知识
  调用 mcp_memohub_query_knowledge 查询知识
  参数: {
    "category": "user",
    "limit": 50
  }

步骤 2: 总结知识
  使用返回的记录，生成总结：
  - 统计高/中/低重要性记录数量
  - 生成整体总结（100-200 字）
  - 提取 3-5 个关键点

步骤 3: 保存总结
  调用 mcp_memohub_add_knowledge 保存总结
  参数: {
    "text": "生成的总结文本",
    "category": "user",
    "importance": 0.9,
    "tags": ["summary", "auto-generated"]
  }
```

Hermes Agent 可以按照这些步骤，使用 `mcp_memohub_query_knowledge` 和 `mcp_memohub_add_knowledge` 工具完成总结和萃取，无需配置 OpenAI API。

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

#### 记忆管理（新增）

```bash
# 列出所有知识（按重要性排序）
mh list-knowledge -c user -l 10

# 总结知识
mh summarize-knowledge -c user

# 萃取关键知识
mh extract-knowledge -c project -n 5 --min-importance 0.8

# 删除知识
mh delete-knowledge gbrain-id1,gbrain-id2

# 按分类清理知识
mh clean-knowledge other --dry-run
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
- `get_stats` - 获取统计信息

**ClawMem 工具**：
- `search_code` - 搜索代码
- `add_code` - 添加代码
- `list_symbols` - 列出符号

**统一工具**：
- `search_all` - 同时搜索知识和代码
- `list_prompts` - 列出可用提示词
- `get_prompt` - 获取提示词内容

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
