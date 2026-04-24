# Contributing to MemoHub

感谢你考虑为 MemoHub 做贡献！本指南将帮助你快速上手。

---

## 📋 目录

- [行为准则](#行为准则)
- [如何贡献](#如何贡献)
- [开发环境设置](#开发环境设置)
- [代码规范](#代码规范)
- [提交指南](#提交指南)
- [Pull Request 流程](#pull-request-流程)
- [问题报告](#问题报告)
- [功能请求](#功能请求)

---

## 🤝 行为准则

参与本项目即表示你同意遵守我们的行为准则：

- 尊重所有贡献者
- 欢迎不同观点
- 专注于最有益于社区的事情
- 对不同意见保持同理心

---

## 🚀 如何贡献

### 报告 Bug

1. 检查 [Issue Tracker](https://github.com/your-username/memohub/issues) 确认 Bug 未被报告
2. 创建新 Issue，使用 Bug 模板
3. 提供详细的复现步骤
4. 包含环境信息（OS、Node.js 版本等）

### 建议新功能

1. 检查 [Issue Tracker](https://github.com/your-username/memohub/issues) 确认功能未被建议
2. 创建新 Issue，使用 Feature Request 模板
3. 详细描述功能需求
4. 说明使用场景和价值

### 提交代码

1. Fork 项目
2. 创建特性分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

### 改进文档

1. 发现文档错误或不足
2. Fork 项目
3. 修复或改进文档
4. 提交 Pull Request

---

## 🛠️ 开发环境设置

### 前置条件

- Node.js >= 22.0.0
- Bun >= 1.3.0
- Ollama 服务（用于测试）

### 安装步骤

```bash
# 1. Fork 并克隆仓库
git clone https://github.com/your-username/memohub.git
cd memohub

# 2. 安装依赖
bun install

# 3. 构建项目
bun run build

# 4. 配置文件
cp config/config.example.yaml config/config.jsonc

# 5. 测试安装
node dist/cli/index.js --help
```

### 开发模式

```bash
# 使用热重载
bun run dev

# 或者手动构建
bun run build
```

### 运行测试

```bash
# 运行所有测试
bun test

# 运行特定测试
bun test test/unit/track-insight.test.ts
```

### 代码格式化

```bash
# 格式化所有代码
bun run format

# 检查代码风格
bun run lint
```

---

## 📝 代码规范

### TypeScript

- 使用 TypeScript 严格模式
- 所有公共 API 必须有类型注解
- 使用接口定义数据结构
- 避免使用 `any` 类型

```typescript
// ✅ 好
interface User {
  id: string;
  name: string;
  email: string;
}

async function getUser(id: string): Promise<User> {
  // ...
}

// ❌ 不好
function getUser(id) {
  // ...
}
```

### 命名规范

- 文件名：kebab-case (例如 `config-manager.ts`)
- 类名：PascalCase (例如 `ConfigManager`)
- 函数/变量：camelCase (例如 `getConfig`)
- 常量：UPPER_SNAKE_CASE (例如 `DEFAULT_PORT`)
- 私有成员：下划线前缀 (例如 `_privateField`)

### 注释

- 公共 API 必须有 JSDoc 注释
- 复杂逻辑必须有解释性注释
- 避免无意义的注释

```typescript
// ✅ 好
/**
 * 获取配置信息
 * @returns {MemoryConfig} 配置对象
 */
function getConfig(): MemoryConfig {
  return config;
}

// ❌ 不好
// 获取配置
function getConfig() {
  return config;
}
```

### 错误处理

- 使用 try-catch 捕获异常
- 提供有意义的错误消息
- 使用自定义错误类型

```typescript
// ✅ 好
try {
  await track-insight.add(record);
} catch (error) {
  if (error instanceof MemoHubError) {
    console.error(`错误: ${error.message}`);
  }
}

// ❌ 不好
await track-insight.add(record);
```

---

## 📦 提交指南

### 提交消息格式

使用 [Conventional Commits](https://www.conventionalcommits.org/) 格式：

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 类型 (type)

- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更改
- `style`: 代码格式（不影响功能）
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具相关

### 示例

```bash
# 新功能
git commit -m "feat(track-insight): add export functionality"

# Bug 修复
git commit -m "fix(track-source): resolve duplicate record issue"

# 文档
git commit -m "docs(readme): update installation instructions"

# 重构
git commit -m "refactor(embedder): improve error handling"
```

### 提交频率

- 频繁提交，小步迭代
- 每个提交应该是一个完整的功能或修复
- 不要包含未完成的代码

---

## 🔀 Pull Request 流程

### 创建 PR 前检查清单

- [ ] 代码通过所有测试
- [ ] 代码已格式化 (`bun run format`)
- [ ] 代码已通过 lint 检查 (`bun run lint`)
- [ ] 已更新相关文档
- [ ] 提交消息符合规范
- [ ] PR 描述清晰详细

### PR 描述模板

```markdown
## 描述
<!-- 简短描述此 PR 的目的 -->

## 更改类型
<!-- 选择适用的类型 -->
- [ ] Bug 修复
- [ ] 新功能
- [ ] 破坏性更改
- [ ] 文档更新
- [ ] 性能优化
- [ ] 代码重构

## 相关 Issue
<!-- 引用相关的 Issue -->
Closes #123

## 测试
<!-- 描述如何测试此更改 -->
- [ ] 单元测试
- [ ] 集成测试
- [ ] 手动测试

## 截图（如果适用）
<!-- 添加截图展示更改 -->

## 检查清单
- [ ] 代码通过测试
- [ ] 代码已格式化
- [ ] 文档已更新
- [ ] 提交消息符合规范
```

### PR 审查流程

1. 自动化检查（CI/CD）
2. 代码审查（至少一名维护者）
3. 反馈和修改
4. 最终批准
5. 合并到主分支

---

## 🐛 问题报告

### Bug 报告模板

```markdown
## Bug 描述
<!-- 清晰描述问题 -->

## 复现步骤
<!-- 详细复现步骤 -->
1.
2.
3.

## 期望行为
<!-- 描述期望的行为 -->

## 实际行为
<!-- 描述实际发生的行为 -->

## 环境信息
- OS: [e.g. macOS 14.0]
- Node.js: [e.g. 22.2.0]
- MemoHub: [e.g. 1.0.0]
- Ollama: [e.g. 0.1.0]

## 额外信息
<!-- 任何其他相关信息 -->
- 日志
- 截图
- 配置文件（去除敏感信息）
```

---

## 💡 功能请求

### Feature Request 模板

```markdown
## 功能描述
<!-- 清晰描述你希望的功能 -->

## 问题背景
<!-- 此功能解决什么问题 -->

## 建议的解决方案
<!-- 详细描述你的建议 -->

## 替代方案
<!-- 其他可能的解决方案 -->

## 额外背景
<!-- 任何其他相关信息 -->
```

---

## 🎯 优先级标签

- `priority: critical` - 阻塞性问题，需要立即修复
- `priority: high` - 重要问题，优先处理
- `priority: medium` - 一般问题，按计划处理
- `priority: low` - 低优先级，有时间时处理

---

## 🏷️ 标签说明

- `bug` - Bug 报告
- `enhancement` - 功能增强
- `documentation` - 文档相关
- `good first issue` - 适合新手的 Issue
- `help wanted` - 需要帮助
- `wontfix` - 不会修复
- `duplicate` - 重复的 Issue

---

## 📖 资源

- [项目文档](docs/)
- [API 文档](docs/api.md)
- [FAQ](docs/faq.md)
- [代码风格指南](https://github.com/airbnb/javascript)
- [TypeScript 最佳实践](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)

---

## ❓ 获取帮助

如果你需要帮助：

1. 查看 [文档](docs/)
2. 搜索 [Issue Tracker](https://github.com/your-username/memohub/issues)
3. 在 [GitHub Discussions](https://github.com/your-username/memohub/discussions) 提问
4. 联系维护者

---

## 📄 许可证

通过贡献代码，你同意你的贡献将在 [MIT License](LICENSE) 下发布。

---

再次感谢你的贡献！🎉
