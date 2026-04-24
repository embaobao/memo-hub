# MemoHub v1.0.0 发布指南

> **✅ 第一个正式版本**: 多轨道动态矩阵架构的 Agent 记忆内核

---

## 📋 发布前检查

### 1. 版本更新

**所有版本已更新为 1.0.0**:
- ✅ 根目录 `package.json`: `1.0.0`
- ✅ `apps/cli/package.json`: `1.0.0`

### 2. 包内容验证

**打包结果**:
```bash
npm notice Tarball Contents
npm notice 164B dist/index.d.ts
npm notice 16.3kB dist/index.js
npm notice 90B dist/mcp.d.ts
npm notice 3.1kB dist/mcp.js
npm notice 247B dist/update.d.ts
npm notice 2.3kB dist/update.js
npm notice 11.9kB memohub-cli-1.0.0.tgz
```

**包内容验证**:
- ✅ 只包含 `dist/` 编译后的文件
- ✅ 只包含 `package.json`
- ✅ **不包含** `src/` 源代码
- ✅ **不包含** 测试文件
- ✅ **不包含** 配置文件

---

## 🚀 发布方式

### 方式 1: GitHub Actions 自动发布（推荐）

**配置文件**: `.github/workflows/ci-cd.yml`

**触发方式**: 创建 GitHub Release

**步骤**:

1. **创建 GitHub Release**
   - 进入 GitHub 仓库
   - 点击 "Releases"
   - 点击 "Draft a new release"
   - 选择标签 `v1.0.0`
   - 填写发布说明
   - 点击 "Publish release"

2. **自动发布**
   - GitHub Actions 自动触发
   - 运行测试
   - 构建项目
   - 发布到 npm

**优势**:
- ✅ 自动化流程
- ✅ 运行测试
- ✅ 验证构建
- ✅ 自动发布

---

### 方式 2: 手动发布

**步骤**:

1. **构建项目**
   ```bash
   bun run build
   ```

2. **打包**
   ```bash
   cd apps/cli
   npm pack
   ```

3. **发布**
   ```bash
   npm publish --access public
   ```

---

## 🔐 发布前准备

### 1. npm 账号

**确保有 npm 账号**:
- 注册: https://www.npmjs.com/signup

**创建 Access Token**:
- 登录 npm
- 进入 Access Tokens
- 创建新 token
- 选择 "Automation"
- 复制 token

### 2. GitHub 配置

**添加 Secret**:
- 进入 GitHub 仓库
- Settings → Secrets and variables → Actions
- 添加 `NPM_TOKEN`
- 粘贴 npm Access Token

---

## 📦 包信息

### 包名

**@memohub/cli**

### 版本

**1.0.0**

### 依赖

**生产依赖**:
```json
{
  "@memohub/core": "workspace:*",
  "@memohub/protocol": "workspace:*",
  "@memohub/track-insight": "workspace:*",
  "@memohub/track-source": "workspace:*",
  "@memohub/librarian": "workspace:*",
  "@memohub/ai-provider": "workspace:*",
  "@memohub/storage-flesh": "workspace:*",
  "@memohub/storage-soul": "workspace:*",
  "@modelcontextprotocol/sdk": "^1.29.0",
  "commander": "^12.1.0",
  "chalk": "^5.3.0",
  "ora": "^8.1.0",
  "yaml": "^2.6.0",
  "zod": "^3.23.8"
}
```

**注意**: workspace 依赖会被解析为 peerDependencies

---

## 📊 包大小

| 文件 | 大小 |
|------|------|
| `dist/index.js` | 16.3 kB |
| `dist/mcp.js` | 3.1 kB |
| `dist/update.js` | 2.3 kB |
| **总计** | **11.9 kB** |

---

## 🎯 发布检查清单

- [ ] 版本号已更新为 1.0.0
- [ ] 构建成功
- [ ] 测试通过
- [ ] 包内容正确（只包含 dist/ 和 package.json）
- [ ] .npmignore 配置正确
- [ ] GitHub Actions 配置正确
- [ ] npm Access Token 已配置
- [ ] 发布说明已准备

---

## 📝 发布说明模板

```markdown
## MemoHub v1.0.0 - 第一个正式版本

MemoHub 是一个基于 **多轨道动态矩阵架构** 的 Agent 记忆内核。

### 核心特性

- 🧠 **多轨道架构**: Source、Insight、Stream、Wiki 等专业轨道
- 📦 **Monorepo 架构**: 模块化、可维护、可扩展
- 🔌 **MCP 协议**: 完全支持 Model Context Protocol
- 🤖 **AI 友好**: 专为 AI Agent 设计的接口
- 💾 **灵肉分离**: CAS 内容存储 + 向量索引
- 📊 **Text2Mem 协议**: 12 个原子操作指令
- 🔧 **治理能力**: 去重、蒸馏、澄清环节

### 安装

```bash
npm install -g @memohub/cli
```

### 使用

```bash
memohub add "知识内容" -c category
memohub search "查询"
memohub config --validate
```

### 文档

- [完整文档](https://github.com/embaobao/memo-hub/tree/main/docs)
- [集成指南](https://github.com/embaobao/memo-hub/blob/main/docs/integration/index.md)
- [配置指南](https://github.com/embaobao/memo-hub/blob/main/docs/guides/configuration.md)

### 更新日志

- ✅ 多轨道动态矩阵架构
- ✅ MCP 协议支持
- ✅ CLI 工具完整实现
- ✅ 配置统一管理
- ✅ 完整文档

---

**感谢使用 MemoHub！**
```

---

## 🚀 发布后验证

### 1. 验证安装

```bash
# 安装最新版本
npm install -g @memohub/cli@latest

# 验证版本
memohub --version
# 应该输出: 1.0.0
```

### 2. 验证功能

```bash
# 验证配置
memohub config --validate

# 测试添加
memohub add "测试知识" -c test
```

---

## 📚 相关文档

- [GitHub Actions 配置](../.github/workflows/ci-cd.yml) - CI/CD 工作流
- [.npmignore 配置](../.npmignore) - 打包排除规则
- [集成指南](../docs/integration/index.md) - 集成方式
- [配置指南](../docs/guides/configuration.md) - 完整配置

---

**版本**: 1.0.0
**发布日期**: 2026-04-24
**状态**: ✅ 准备就绪
