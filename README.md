# 🧠 MemoHub v1.0.0
> **The First Memory-First Orchestration OS for Personal Agents.**

MemoHub 是一个专为个人 Agent 打造的数字记忆操作系统。它将碎片化的信息通过 **Text2Mem 协议** 转化为结构化的、可编排的记忆资产，并提供 iOS 级审美的 **Ether UI** 可视化控制台。

![V1 Status](https://img.shields.io/badge/Status-v1.0.0_Ready-emerald?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Stack-Bun_|_TS_|_LanceDB-blue?style=for-the-badge)

---

## 💎 核心特性

- **Flow-Driven 编排**: 采用 n8n/Dify 风格的流引擎，支持通过 `config.jsonc` 动态定义记忆的存取逻辑。
- **Ether UI 控制台**: 极致简约的拟态设计（Hardcore Minimalism）。
  - **Flow Studio**: 可视化编排记忆轨道，实时热生效。
  - **Memory Matrix**: 跨轨道记忆资产大盘，支持多维检索。
  - **Agent Sandbox**: 集成记忆感知能力的智能对话调试环境。
- **Text2Mem 协议**: 统一的 12 项原子操作，抹平不同类型知识（代码、语义、流）的存取差异。
- **全栈 Monorepo**: 基于 Bun Workspaces 构建，模块化程度高，核心、工具、轨道完全解耦。

---

## 🚀 快速开始

### 1. 环境准备
确保您的系统已安装 [Bun](https://bun.sh/) 运行时。

```bash
# 克隆并安装依赖
bun install
bun run build
```

### 2. 启动控制台
```bash
bun apps/cli/src/index.ts ui
```
访问 `http://localhost:3000` 进入可视化界面。

### 3. 命令行操作
```bash
# 注入一条记忆（新方式：推荐）
bun apps/cli/src/index.ts ingest --source hermes --channel session-123 --project my-project "MemoHub V1 采用极简设计语言"

# 语义检索（新方式：推荐）
bun apps/cli/src/index.ts query --type memory --project my-project "设计语言是什么？"

# 启动 MCP 服务供 Claude 使用
bun apps/cli/src/index.ts mcp
```

### 4. Integration Hub (新增)
MemoHub v1.0.0 引入了 **Integration Hub**，支持外部系统的标准化事件摄取：

```bash
# 使用 MCP 工具摄取事件
{
  "event": {
    "source": "hermes",
    "channel": "session-123",
    "kind": "memory",
    "projectId": "my-project",
    "confidence": "reported",
    "payload": {
      "text": "事件内容",
      "kind": "memory"
    }
  }
}

# 查询事件
{
  "type": "memory",
  "projectId": "my-project",
  "query": "查询内容",
  "limit": 10
}
```

详见 [Integration Hub 文档](docs/integration/architecture.md)。

---

## 🏗️ 架构概览

- **MemoryKernel**: 纯粹的调度器，通过 `FlowEngine` 执行工作流。
- **ToolRegistry**: 原子工具（CAS, Vector, AST）的注册中心。
- **Track System**: 业务轨道（Insight, Source, Stream, Wiki）高度热插拔。
- **Storage**: 
  - **Flesh (CAS)**: 内容寻址存储，确保数据去重与一致性。
  - **Soul (LanceDB)**: 向量化长期记忆，支持毫秒级语义检索。

---

## 📚 深入阅读

- [架构设计详解](docs/architecture/overview.md)
- [Text2Mem 协议规范](docs/architecture/text2mem-protocol.md)
- [轨道开发指南](docs/development/contributing.md)
- [配置说明](docs/guides/configuration.md)

---

**MemoHub 让 Agent 拥有灵魂。**  
Made with ❤️ for the AI Era.
