# MemoHub v1 项目结构说明

## 📁 Monorepo 架构

MemoHub v1 使用 **Bun Workspace Monorepo** 架构，模块化设计，清晰分离关注点。

```
memohub/
├── apps/                         # 📱 应用层
│   └── cli/                      # CLI 应用 + MCP Server
│       ├── src/                  #   源代码
│       │   ├── index.ts          #   CLI 主入口
│       │   └── mcp.ts            #   MCP 服务器实现
│       ├── dist/                 #   编译产物
│       │   └── index.js          #   可执行文件 ⭐
│       └── package.json
│
├── packages/                     # 📦 核心层
│   ├── protocol/                 #   Text2Mem 协议 (零依赖)
│   ├── core/                     #   MemoryKernel 总线
│   ├── ai-provider/              #   AI 适配器 (Ollama)
│   ├── storage-flesh/            #   CAS 内容寻址存储
│   ├── storage-soul/             #   LanceDB 向量索引
│   └── librarian/                #   检索流水线 + 治理
│
├── tracks/                       # 🛤️ 轨道层
│   ├── track-insight/            #   知识/事实记忆
│   ├── track-source/             #   代码/AST 记忆
│   └── track-stream/             #   会话上下文 (预留)
│
├── docs/                         # 📚 文档
├── guides/                       # 📚 指南
├── config/                       # ⚙️ 配置文件
│
├── .deprecated/                  # 🗃️ 归档区
│   ├── v2-src/                   #   旧的 v2 源代码
│   ├── plugins/                  #   旧的插件
│   └── docs/                     #   旧文档
│
├── HERMES_INTEGRATION_GUIDE.md  # 📖 Hermes 完整集成指南
├── HERMES_QUICKSTART.md         # 📖 Hermes 快速开始
├── README.md                     # 📖 项目说明
├── CLAUDE.md                     # 📖 开发指南
└── package.json                  # 项目配置
```

## 🎯 设计原则

### 依赖方向

```
apps/cli → tracks/* → packages/core → packages/protocol
```

**规则**：
- ✅ 依赖单向，禁止循环
- ✅ tracks 只依赖 protocol
- ✅ apps 依赖所有需要的包
- ❌ packages 不能依赖 apps 或 tracks

### 包职责

| 包 | 职责 | 大小 |
|---|------|------|
| **apps/cli** | CLI 入口 + MCP Server | 92K |
| **packages/protocol** | Text2Mem 协议定义 | - |
| **packages/core** | MemoryKernel 总线 | - |
| **packages/ai-provider** | AI 适配器 | - |
| **packages/storage-flesh** | CAS 内容存储 | - |
| **packages/storage-soul** | 向量索引存储 | - |
| **packages/librarian** | 检索流水线 | - |
| **tracks/track-insight** | 知识记忆轨道 | - |
| **tracks/track-source** | 代码记忆轨道 | - |
| **tracks/track-stream** | 会话上下文轨道 | - |

## 🚀 构建流程

```bash
# 构建所有包
bun run build

# 构建特定包
bun run --filter @memohub/cli build
bun run --filter @memohub/protocol build

# 构建所有 apps
bun run --filter './apps/*' build

# 构建所有 packages
bun run --filter './packages/*' build

# 构建所有 tracks
bun run --filter './tracks/*' build
```

## 📊 目录大小统计

| 目录 | 大小 | 说明 |
|------|------|------|
| `apps/` | 92K | 应用入口 |
| `packages/` | 620K | 核心包 |
| `tracks/` | 96K | 轨道实现 |
| `.deprecated/` | 1.4M | 已归档代码 |

**总计**: ~2.2M (不含 node_modules)

## 🎨 MCP 服务器架构

### 集成方式

MemoHub v1 的 MCP 服务器通过 **CLI 暴露**，符合 monorepo 最佳实践：

```
用户调用
  ↓
Hermes
  ↓
node apps/cli/dist/index.js serve
  ↓
apps/cli/src/mcp.ts
  ↓
MemoryKernel + Tracks
```

### 优势

- ✅ 统一入口：CLI 和 MCP 共享代码
- ✅ 模块化：清晰的包依赖关系
- ✅ 可维护：独立的包版本管理
- ✅ 可扩展：轻松添加新的轨道
- ✅ 类型安全：TypeScript 严格模式

---

**文档版本**: 3.0.0
**最后更新**: 2026-04-24
