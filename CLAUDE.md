# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

MemoHub 是一个基于向量嵌入的智能记忆管理 CLI 工具,采用**双轨记忆架构**:

- **GBrain (通用知识轨道)**: 存储事实、概念、用户偏好等通用性知识
- **ClawMem (代码记忆轨道)**: 存储代码片段、API 使用、架构设计等技术性记忆

两条轨道共享嵌入器,但独立管理数据库,通过语义搜索实现智能检索。

## 开发命令

### 构建与开发
```bash
# 构建主项目
bun run build

# 构建插件系统
bun run build:plugins

# 开发模式(热重载)
bun run dev

# 运行测试
bun test

# 代码检查
bun run lint
bun run format
```

### CLI 命令(构建后)
```bash
# 添加知识
mh add-knowledge "知识内容" -c <分类> -i <重要性> -t <标签>

# 搜索知识
mh search-knowledge "查询" -l <结果数>

# 添加代码
mh add-code "代码" -l <语言> -a <AST类型> -s <符号名> -f <文件路径>

# 搜索代码
mh search-code "查询" -l <结果数>

# 查看统计
mh stats

# 验证配置
mh config --validate
```

### MCP 服务器
```bash
cd mcp-server
bun run build
bun run start
```

## 核心架构

### 双轨设计原则
- **独立性**: GBrain 和 ClawMem 各自有数据库和表结构,互不干扰
- **共享性**: 共享 Embedder 实例和配置管理
- **统一性**: 通过 MCP 服务器提供统一接口

### 目录结构
```
src/
├── core/
│   ├── config.ts      # 配置管理器(YAML + 环境变量)
│   └── embedder.ts    # 嵌入器(调用 Ollama API)
├── lib/
│   ├── gbrain.ts      # GBrain 核心类
│   └── clawmem.ts     # ClawMem 核心类
└── cli/
    └── index.ts       # CLI 入口(Commander.js)

mcp-server/
└── index.ts           # MCP 服务器(统一接口)

plugins/
├── auto-memory-extractor/  # 自动记忆提取器
└── memory-injection/       # 记忆注入器
```

### 数据模型

**GBrain 记录结构**:
- `id`: 唯一标识符 (格式: `gbrain-{timestamp}-{random}`)
- `text`: 知识文本
- `vector`: 嵌入向量 (768维)
- `category`: 分类 (user, memory, system, project-catalog 等)
- `scope`: 作用域 (通常为 "global")
- `importance`: 重要性评分 (0.0-1.0)
- `tags`: 标签数组
- `timestamp`: 创建时间
- `source`: 来源 (cli, memohub-mcp 等)

**ClawMem 记录结构**:
- `id`: 唯一标识符 (格式: `clawmem-{timestamp}-{random}`)
- `text`: 代码文本
- `vector`: 嵌入向量 (768维)
- `ast_type`: AST 类型 (interface, function, class, unknown 等)
- `symbol_name`: 符号名
- `parent_symbol`: 父符号 (预留字段,当前为 null)
- `file_path`: 文件路径
- `language`: 编程语言
- `importance`: 重要性评分 (0.0-1.0)
- `tags`: 标签数组
- `timestamp`: 创建时间
- `source`: 来源

### 配置系统

配置优先级: 环境变量 > YAML 配置文件 > 默认值

**关键环境变量**:
- `EMBEDDING_URL`: 嵌入服务 URL (默认: `http://localhost:11434/v1`)
- `EMBEDDING_MODEL`: 嵌入模型 (默认: `nomic-embed-text-v2-moe`)
- `GBRAIN_DB_PATH`: GBrain 数据库路径
- `CLAWMEM_DB_PATH`: ClawMem 数据库路径

**配置文件**: `config/config.yaml`
- 示例配置: `config/config.example.yaml`
- 生产配置不提交到 Git (见 `.gitignore`)

## MCP 服务器集成

### MCP 工具列表

**GBrain 工具** (4 个):
- `query_knowledge`: 语义搜索知识
- `add_knowledge`: 添加知识记录
- `list_categories`: 列出分类及计数
- `delete_knowledge`: 批量删除知识

**ClawMem 工具** (3 个):
- `search_code`: 语义搜索代码
- `add_code`: 添加代码记录
- `list_symbols`: 列出符号(类、函数等)

**统一工具** (2 个):
- `get_stats`: 获取双轨数据库统计
- `search_all`: 同时搜索知识和代码

### 与 Hermes 集成

在 `~/.hermes/config.yaml` 中配置:

```yaml
mcpServers:
  memohub:
    command: node
    args: ["/path/to/memo-hub/mcp-server/dist/index.js"]
    env:
      GBRAIN_DB_PATH: ~/.hermes/data/gbrain.lancedb
      CLAWMEM_DB_PATH: ~/.hermes/data/clawmem.lancedb
      EMBEDDING_URL: http://localhost:11434/v1
      EMBEDDING_MODEL: nomic-embed-text-v2-moe
```

## 技术细节

### 嵌入向量
- **模型**: nomic-embed-text-v2-moe (Ollama 本地)
- **维度**: 768
- **相似度**: 余弦距离 (LanceDB `distanceType("cosine")`)
- **超时**: 30 秒

### LanceDB 操作
- **连接**: `lancedb.connect(dbPath)`
- **创建表**: 使用 seed 记录初始化 schema,然后删除 seed
- **搜索**: `table.vectorSearch(vector).distanceType("cosine").limit(n)`
- **过滤**: `.where("category = 'user' AND language = 'typescript'")`

### 初始化流程
1. 连接数据库路径
2. 检查表是否存在
3. 如不存在,创建表 (使用 seed 记录)
4. 删除 seed 记录 (仅保留 schema)

## 开发注意事项

### 类型安全
- 所有类型定义在 `src/types/index.ts`
- 使用 TypeScript 严格模式
- MCP 服务器使用 Zod 进行运行时验证

### 错误处理
- 配置加载失败时使用默认配置
- 嵌入 API 失败时返回零向量 (避免阻塞)
- 数据库操作失败时抛出异常

### 隐私与安全
- 配置文件 (`config/config.yaml`) 在 `.gitignore` 中
- 数据库文件 (`*.lancedb/`) 不提交
- 敏感环境变量不写入代码
- 支持 Hermes 数据库共享 (通过配置路径)

### 性能考虑
- 向量搜索默认限制 5 条结果
- 批量操作使用 `table.add([records])`
- 列表查询限制 10000 条 (`limit(10000)`)

## 测试

当前项目使用 Bun 测试框架:
```bash
bun test
```

测试文件应与源文件放在同一目录,使用 `.test.ts` 后缀。

## 发布检查清单

发布前确保:
- [ ] 运行 `bun run build` 成功
- [ ] 运行 `bun test` 通过
- [ ] 运行 `mh config --validate` 通过
- [ ] `.gitignore` 包含 `config/config.yaml` 和数据库文件
- [ ] 版本号更新 (`package.json` 和 README.md)
- [ ] CHANGELOG.md 更新
- [ ] MCP 服务器构建成功 (`cd mcp-server && bun run build`)

## 相关文档

- [快速开始](guides/quickstart.md)
- [配置指南](guides/configuration.md)
- [MCP 服务器文档](mcp-server/README.md)
- [集成报告](INTEGRATION_REPORT.md)
- [部署指南](DEPLOYMENT_GUIDE.md)
