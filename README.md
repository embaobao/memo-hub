# Memory System CLI

独立的双轨记忆系统 CLI 工具 - GBrain (通用知识) + ClawMem (代码记忆)

## 特性

- 🧠 **双轨记忆系统**: GBrain (通用知识) + ClawMem (代码记忆)
- 🔍 **语义搜索**: 基于向量的语义搜索
- ⚡ **高性能**: LanceDB 向量数据库，快速检索
- 🔧 **灵活配置**: 支持配置文件和环境变量
- 🚀 **独立运行**: 无需 Hermes，完全独立的 CLI 工具
- 📊 **完整功能**: 添加、搜索、统计等完整功能

## 安装

```bash
# 克隆仓库
git clone https://github.com/your-username/memory-system-cli.git
cd memory-system-cli

# 安装依赖
bun install

# 构建项目
bun run build

# 全局安装（可选）
npm link
```

## 快速开始

### 1. 配置

复制配置文件并修改为你的配置：

```bash
cp config/config.example.yaml config/config.yaml
```

### 2. 验证嵌入模型

确保 Ollama 正在运行并安装了嵌入模型：

```bash
# 检查 Ollama 是否运行
curl http://localhost:11434/api/tags

# 安装嵌入模型（如果还没有）
ollama pull nomic-embed-text-v2-moe
```

### 3. 使用 CLI

```bash
# 添加知识
memory add-knowledge "盟哥喜欢用 Bun 作为运行时" -c user -i 0.9

# 搜索知识
memory search-knowledge "盟哥的运行时偏好"

# 添加代码
memory add-code "function hello() { return 'world'; }" -l javascript -a function

# 搜索代码
memory search-code "hello world" -l javascript

# 查看统计信息
memory stats

# 验证配置
memory config --validate
```

## 命令参考

### 添加知识

```bash
memory add-knowledge <text> [options]
```

选项:
- `-c, --category <category>`: 分类 (默认: other)
- `-i, --importance <importance>`: 重要性 0-1 (默认: 0.5)
- `-t, --tags <tags>`: 标签 (逗号分隔)

示例:
```bash
memory add-knowledge "盟哥喜欢被问候 😊" -c user -i 0.9
memory add-knowledge "使用 Node.js v22 和 Bun" -c env -t "runtime,node,bun"
```

### 搜索知识

```bash
memory search-knowledge <query> [options]
```

选项:
- `-l, --limit <limit>`: 结果数量 (默认: 5)
- `-c, --category <category>`: 分类过滤

示例:
```bash
memory search-knowledge "盟哥"
memory search-knowledge "技术栈" -c env -l 10
```

### 添加代码

```bash
memory add-code <text> [options]
```

选项:
- `-l, --language <language>`: 语言 (默认: typescript)
- `-a, --ast-type <ast-type>`: AST 类型 (默认: unknown)
- `-s, --symbol-name <symbol-name>`: 符号名称
- `-f, --file-path <file-path>`: 文件路径
- `-i, --importance <importance>`: 重要性 0-1 (默认: 0.5)
- `-t, --tags <tags>`: 标签 (逗号分隔)

示例:
```bash
memory add-code "export function hello() { return 'world'; }" \
  -l typescript -a function -s hello -i 0.8
```

### 搜索代码

```bash
memory search-code <query> [options]
```

选项:
- `-l, --limit <limit>`: 结果数量 (默认: 5)
- `--language <language>`: 语言过滤
- `--ast-type <ast-type>`: AST 类型过滤

示例:
```bash
memory search-code "hello world"
memory search-code "interface" --ast-type interface -l 10
```

### 统计信息

```bash
memory stats
```

显示 GBrain 和 ClawMem 的统计信息。

### 配置管理

```bash
# 查看当前配置
memory config

# 验证配置
memory config --validate
```

## 配置文件

配置文件位于 `config/config.yaml`，支持以下配置项：

```yaml
# 嵌入模型配置
embedding:
  url: "http://localhost:11434/v1"
  model: "nomic-embed-text-v2-moe"
  dimensions: 768
  timeout: 30

# GBrain 配置
gbrain:
  db_path: "~/.hermes/data/gbrain.lancedb"
  table_name: "gbrain"
  default_category: "other"
  default_importance: 0.5

# ClawMem 配置
clawmem:
  db_path: "~/.hermes/data/clawmem.lancedb"
  table_name: "clawmem"
  default_language: "typescript"
  default_importance: 0.5

# 搜索配置
search:
  default_sources: ["gbrain", "clawmem"]
  default_limit: 5
  parallel: true
  cache_enabled: true
  cache_path: "~/.hermes/cache/memory-search"

# 同步配置
sync:
  editor_memory_paths:
    - "~/.claude-code/memory"
    - "~/.opencode/memory"
    - "~/.trae/memory"
  interval: 3600
  cloud:
    enabled: false
    provider: "github"
    repo: "your-username/memory-backup"
    branch: "main"

# 日志配置
logging:
  level: "info"
  file: "~/.hermes/logs/memory-cli.log"
  console: true

# MCP 服务器配置
mcp_server:
  enabled: true
  port: 3000
  transport: "stdio"
  timeout: 30
```

## 环境变量

支持通过环境变量覆盖配置：

```bash
export EMBEDDING_URL="http://localhost:11434/v1"
export EMBEDDING_MODEL="nomic-embed-text-v2-moe"
export GBRAIN_DB_PATH="~/.hermes/data/gbrain.lancedb"
export CLAWMEM_DB_PATH="~/.hermes/data/clawmem.lancedb"
export MEMORY_LOG_LEVEL="debug"
```

## 架构

```
memory-system-cli/
├── config/                  # 配置文件
│   └── config.example.yaml
├── src/
│   ├── cli/                # CLI 命令
│   │   └── index.ts
│   ├── core/               # 核心组件
│   │   ├── config.ts       # 配置管理
│   │   └── embedder.ts     # 嵌入向量生成
│   ├── lib/                # 记忆系统
│   │   ├── gbrain.ts       # GBrain 实现
│   │   └── clawmem.ts      # ClawMem 实现
│   └── types/
│       └── index.ts        # 类型定义
└── package.json
```

## 与 Hermes 集成

这个 CLI 工具完全独立运行，但也与 Hermes 记忆系统兼容：

### 共享数据库

默认情况下，CLI 工具使用与 Hermes 相同的数据库路径：
- GBrain: `~/.hermes/data/gbrain.lancedb`
- ClawMem: `~/.hermes/data/clawmem.lancedb`

这意味着你在 CLI 中添加的记忆可以在 Hermes 中使用，反之亦然。

### 配置 Hermes MCP

在 Hermes 配置文件 (`~/.hermes/config.yaml`) 中：

```yaml
mcp_servers:
  gbrain:
    command: "bun"
    args: ["run", "~/.hermes/data/memory-system/mcp-servers/mcp-gbrain/index.ts"]
    timeout: 30
  clawmem:
    command: "bun"
    args: ["run", "~/.hermes/data/memory-system/mcp-servers/mcp-clawmem/index.ts"]
    timeout: 30
```

## 开发

```bash
# 安装依赖
bun install

# 开发模式（带监听）
bun run dev

# 构建
bun run build

# 测试
bun test

# 代码检查
bun run lint

# 格式化代码
bun run format
```

## 故障排查

### 问题: 嵌入向量生成失败

**解决方案**:
1. 检查 Ollama 是否运行: `curl http://localhost:11434/api/tags`
2. 确认嵌入模型已安装: `ollama list`
3. 安装模型: `ollama pull nomic-embed-text-v2-moe`

### 问题: 数据库连接失败

**解决方案**:
1. 检查配置文件中的数据库路径
2. 确保数据库路径存在且有读写权限
3. 查看日志文件: `~/.hermes/logs/memory-cli.log`

### 问题: 搜索结果为空

**解决方案**:
1. 检查数据库中是否有记录: `memory stats`
2. 验证嵌入向量是否正确生成
3. 尝试使用不同的搜索查询

## 许可证

MIT License

## 作者

盟哥 & AI Assistant

## 贡献

欢迎提交 Issue 和 Pull Request！

## 相关项目

- [Hermes](https://github.com/your-username/hermes) - AI Agent 框架
- [LanceDB](https://github.com/lancedb/lancedb) - 向量数据库
- [Ollama](https://github.com/ollama/ollama) - 本地大模型运行时
