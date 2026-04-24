# MemoHub v3

## 🧠 Personal Agent Memory System

基于 **Text2Mem 协议**的智能记忆管理系统，采用 **Bun Workspace Monorepo** 架构，为 AI Agent 提供持久化记忆能力。

---

## ✨ 核心特性

- 🧠 **多轨道动态矩阵**: Source、Insight、Stream、Wiki 等多个专业轨道
- 📦 **Monorepo 架构**: 模块化、可维护、可扩展
- 🔌 **MCP 协议**: 完全支持 Model Context Protocol
- 🤖 **AI 友好**: 专为 AI Agent 设计的接口
- 💾 **灵肉分离**: CAS 内容存储 + 向量索引
- 📊 **Text2Mem 协议**: 12 个原子操作指令
- 🔧 **治理能力**: 去重、蒸馏、澄清环节

---

## 🚀 快速开始

### 构建项目

```bash
cd /path/to/memo-hub
bun install && bun run build
```

### 集成方式

选择适合你的集成方式：

- 📖 [集成指南首页](docs/integration/index.md) - 选择适合的集成方式
- 🔌 [MCP 协议集成](docs/integration/mcp-integration.md) - 标准协议，适用于所有 AI Agent
- 💻 [CLI 命令集成](docs/integration/cli-integration.md) - 命令行使用
- 🤖 [Hermes AI 集成](docs/integration/hermes-guide.md) - Hermes 特定集成

### 全局安装 CLI

```bash
cd apps/cli
npm link
memohub --version
```

---

## 📚 文档导航

### 🚀 快速上手
- [快速开始指南](docs/guides/quickstart.md) - 5 分钟上手
- [配置指南](docs/guides/configuration.md) - 详细配置说明

### 🔌 集成方式
- [集成指南首页](docs/integration/index.md) - 所有集成方式概览
- [MCP 协议集成](docs/integration/mcp-integration.md) - 标准 MCP 协议
- [CLI 命令集成](docs/integration/cli-integration.md) - 命令行集成
- [Hermes AI 集成](docs/integration/hermes-guide.md) - Hermes 特定集成

### 🏗️ 架构文档
- [架构概览](docs/architecture/overview.md) - 系统架构设计
- [框架流程图](docs/architecture/framework-flow.md) - 完整流程图
- [设计与代码映射](docs/architecture/design-code-mapping.md) - 设计到代码映射
- [记忆流程图](docs/architecture/memory-flow.md) - 记忆读写流程
- [实现验证报告](docs/architecture/implementation-verification.md) - 架构验证报告
- [验证总结](docs/architecture/verification-summary.md) - 验证结果总结

### 📖 开发文档
- [项目结构](docs/development/project-structure.md) - Monorepo 结构
- [贡献指南](docs/development/contributing.md) - 如何贡献代码
- [测试指南](docs/development/testing.md) - 测试规范

---

## 📁 项目结构

```
memohub/
├── apps/              # 应用层
│   └── cli/          # CLI + MCP Server
├── packages/         # 核心包
│   ├── protocol/     # Text2Mem 协议
│   ├── core/         # MemoryKernel
│   ├── ai-provider/  # AI 适配器
│   ├── storage-flesh/  # CAS 存储
│   ├── storage-soul/   # 向量存储
│   └── librarian/    # 检索流水线
├── tracks/           # 轨道层
│   ├── track-insight/  # 逻辑沉淀轨道（知识、事实、偏好）
│   ├── track-source/   # 静态资产轨道（代码、AST）
│   └── track-stream/   # 时序流轨道（对话历史，计划中）
└── docs/             # 文档中心
```

---

## 🛠️ CLI 命令

```bash
# 知识管理
memohub add "知识内容" -c <分类> -t <标签>
memohub search "查询" -l <结果数>
memohub list
memohub delete --ids <id1,id2>

# 代码管理
memohub add-code <文件> -l <语言>
memohub search-code "查询" -l <结果数>

# 统一检索
memohub search-all "查询" -l <结果数>

# 治理功能
memohub dedup --track track-insight
memohub distill --track track-insight

# 配置
memohub config --validate
memohub serve  # 启动 MCP 服务器
```

---

## 🔌 MCP 工具

MemoHub MCP Server 提供 7 个工具：

### 知识管理
- `add_knowledge` - 添加知识
- `query_knowledge` - 查询知识
- `delete_knowledge` - 删除知识
- `list_categories` - 列出分类

### 代码管理
- `add_code` - 添加代码
- `search_code` - 搜索代码

### 统计信息
- `get_stats` - 获取统计信息

**详细文档**: [MCP 集成指南](docs/integration/mcp-integration.md)

---

## 🎯 技术栈

- **语言**: TypeScript 5.9.3
- **运行时**: Node.js >= 22.0.0, Bun >= 1.3.0
- **包管理**: Bun Workspace
- **数据库**: LanceDB 0.26.2
- **嵌入**: Ollama (nomic-embed-text-v2-moe)
- **协议**: MCP (Model Context Protocol)

---

## 🏗️ Text2Mem 协议

MemoHub v3 基于 **Text2Mem 协议**，提供 12 个原子操作：

### 写入操作
- `ADD` - 添加记录
- `UPDATE` - 更新记录
- `DELETE` - 删除记录
- `MERGE` - 合并记录

### 读取操作
- `RETRIEVE` - 检索记录
- `LIST` - 列出记录
- `GET` - 获取单个

### 元数据操作
- `CLARIFY` - 澄清记录
- `ANCHOR` - 锚定记录

### 治理操作
- `DISTILL` - 蒸馏知识
- `DEDUP` - 去重扫描
- `SYNC` - 同步记录

**详细文档**: [Text2Mem 协议](docs/architecture/text2mem-protocol.md)

---

## 📊 架构验证

✅ **所有核心问题已验证通过**

- ✅ CLI 多轨机制流转
- ✅ Agent 调用路由机制
- ✅ MCP 协议符合性
- ✅ 数据入库完整性
- ✅ Hermes 集成可靠性

**详细报告**: [架构验证报告](docs/architecture/implementation-verification.md)

---

## 🤝 贡献指南

欢迎贡献代码！请阅读 [贡献指南](docs/development/contributing.md)。

### 开发规范

- 遵循 [AGENT.md](AGENT.md) 开发规范
- 保持 Monorepo 依赖单向
- 添加完整测试
- 更新相关文档

---

## 📄 许可证

MIT License

---

## 🔗 相关链接

- [文档中心](docs/README.md)
- [GitHub Issues](https://github.com/your-repo/issues)
- [更新日志](CHANGELOG.md)

---

**版本**: 3.0.0
**最后更新**: 2026-04-24
