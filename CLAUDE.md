# CLAUDE.md - MemoHub v3 AI 协作指南

这是 **MemoHub v3** 的 AI 协作入口。本文档为 AI Agent (如 Claude Code) 提供项目概览和文档导航。

---

## 🎯 快速导航

### 📚 完整文档中心
- **[文档首页](docs/README.md)** - 所有文档的索引
- **[快速开始](docs/guides/quickstart.md)** - 5 分钟上手
- **[Hermes 集成](docs/integration/hermes-guide.md)** - 与 Hermes AI 集成

### 🤖 开发规范
- **[AGENT.md](AGENT.md)** - 项目开发规范 (必读)
- **[贡献指南](docs/development/contributing.md)** - 如何贡献代码

### 🏗️ 架构文档
- **[项目结构](docs/development/project-structure.md)** - Monorepo 结构
- **[架构概览](docs/architecture/overview.md)** - 系统设计
- **[Text2Mem 协议](docs/architecture/text2mem-protocol.md)** - 协议规范

---

## 📋 项目概述

### 核心信息
- **项目名称**: MemoHub v3
- **架构**: Bun Workspace Monorepo
- **协议**: Text2Mem (12 原子操作)
- **存储**: CAS (内容) + LanceDB (向量)
- **轨道**: track-insight (知识) + track-source (代码)

### 技术栈
- **语言**: TypeScript 5.9.3
- **运行时**: Node.js >= 22.0.0, Bun >= 1.3.0
- **数据库**: LanceDB 0.26.2
- **嵌入**: Ollama (本地模型)
- **协议**: MCP (Model Context Protocol)

---

## 🚀 快速命令

### 构建和测试
```bash
# 构建所有包
bun run build

# 测试
bun run test

# 开发模式
bun run dev

# 代码检查
bun run lint
```

### 单包操作
```bash
# 构建特定包
bun run --filter @memohub/cli build
bun run --filter @memohub/protocol build

# 测试特定包
bun run --filter @memohub/cli test
```

---

## 📁 Monorepo 结构

```
memohub/
├── apps/                    # 应用层
│   └── cli/               # CLI + MCP Server ⭐
├── packages/              # 核心层
│   ├── protocol/          # Text2Mem 协议
│   ├── core/              # MemoryKernel
│   ├── ai-provider/       # AI 适配器
│   ├── storage-flesh/     # CAS 存储
│   ├── storage-soul/      # 向量存储
│   └── librarian/         # 检索流水线
├── tracks/                # 轨道层
│   ├── track-insight/     # 知识轨道
│   └── track-source/      # 代码轨道
└── docs/                  # 文档中心
```

### 依赖规则
```
apps/cli → tracks/* → packages/core → packages/protocol
```

**重要**: 依赖单向，禁止循环依赖

---

## 🛠️ 常见任务

### 添加新的轨道
1. 在 `tracks/` 下创建新目录
2. 实现 `ITrackProvider` 接口
3. 在 `apps/cli/src/index.ts` 中注册
4. 添加相应的 MemoOp 处理逻辑

### 添加新的 AI Provider
1. 在 `packages/ai-provider/src/` 下创建适配器
2. 实现 `IEmbedder` 和/或 `ICompleter` 接口
3. 在 `AIProviderRegistry` 中注册
4. 更新配置文件

### 修改 Text2Mem 协议
1. 修改 `packages/protocol/src/types.ts`
2. 更新 `packages/protocol/src/schema.ts`
3. 添加测试用例
4. 更新所有 Track 实现

---

## 📊 文档链接

### 用户文档
- [快速开始](docs/guides/quickstart.md) - 5 分钟上手
- [配置指南](docs/guides/configuration.md) - 详细配置

### 集成文档
- [Hermes 集成指南](docs/integration/hermes-guide.md) - 完整集成
- [Hermes 快速开始](docs/integration/hermes-quickstart.md) - 3 分钟集成
- [MCP API 参考](docs/api/reference.md) - 工具文档

### 开发文档
- [项目结构](docs/development/project-structure.md) - 架构说明
- [贡献指南](docs/development/contributing.md) - 贡献流程
- [测试指南](docs/development/testing.md) - 测试规范

### 架构文档
- [架构概览](docs/architecture/overview.md) - 系统设计
- [Text2Mem 协议](docs/architecture/text2mem-protocol.md) - 协议规范
- [存储架构](docs/architecture/storage.md) - 存储设计

---

## 🎯 开发规范

### 必须遵守的规则

1. **依赖方向**: apps → tracks → packages
2. **类型安全**: 使用 TypeScript 严格模式
3. **测试覆盖**: 新功能必须有测试
4. **文档更新**: 修改功能时更新相关文档
5. **代码风格**: 使用 ESLint 和 Prettier

### 代码质量

- **协议定义**: 只在 `packages/protocol` 中
- **轨道实现**: 只依赖 `protocol`，不依赖具体存储
- **错误处理**: 统一使用 `Text2MemResult` 返回
- **日志输出**: 使用 `kernel.event` 机制

---

## 🔍 故障排除

### 构建失败
```bash
# 清理并重新构建
rm -rf node_modules apps/*/dist packages/*/dist tracks/*/dist
bun install
bun run build
```

### 测试失败
- 确保 Ollama 服务运行: `ollama serve`
- 检查嵌入模型: `ollama list`
- 验证数据库路径: `ls -la ~/.hermes/data/`

### 类型错误
- 检查依赖方向
- 确保导出/导入一致
- 运行 `bun run lint`

---

## 🤖 AI Agent 使用建议

### 当你被要求添加功能时
1. 先阅读 [AGENT.md](AGENT.md) 了解开发规范
2. 查看相关文档了解架构
3. 遵循 Monorepo 依赖规则
4. 添加相应测试
5. 更新相关文档

### 当你被要求修复 Bug 时
1. 使用 systematic-debugging skill
2. 查看相关测试用例
3. 确保修复不破坏现有功能
4. 添加回归测试

### 当你被要求重构代码时
1. 先理解现有架构
2. 遵循依赖规则
3. 保持向后兼容
4. 更新相关文档

---

## 📝 重要提醒

### ⚠️ 不要做的事
- ❌ 违反依赖方向
- ❌ 在 protocol 包中添加外部依赖
- ❌ 破坏向后兼容性
- ❌ 忽略测试
- ❌ 跳过文档更新

### ✅ 应该做的事
- ✅ 遵循 Monorepo 架构
- ✅ 保持类型安全
- ✅ 添加完整测试
- ✅ 更新相关文档
- ✅ 遵循代码规范

---

## 🎓 学习路径

### 新手入门
1. 阅读 [快速开始](docs/guides/quickstart.md)
2. 了解 [项目结构](docs/development/project-structure.md)
3. 查看 [AGENT.md](AGENT.md) 开发规范

### 进阶开发
1. 深入 [Text2Mem 协议](docs/architecture/text2mem-protocol.md)
2. 学习 [架构设计](docs/architecture/overview.md)
3. 研究 [检索流水线](docs/architecture/retrieval-pipeline.md)

### 高级优化
1. 性能优化技巧
2. 扩展存储后端
3. 自定义嵌入模型

---

## 📞 获取帮助

- **文档中心**: [docs/README.md](docs/README.md)
- **开发规范**: [AGENT.md](AGENT.md)
- **贡献指南**: [docs/development/contributing.md](docs/development/contributing.md)

---

**文档版本**: 3.0.0  
**最后更新**: 2026-04-24  
**维护者**: 开发团队
