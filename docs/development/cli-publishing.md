# MemoHub v1 CLI 发布和安装指南

## 📦 发布流程

### 准备发布

1. **更新版本号**
   ```bash
   # 更新 apps/cli/package.json 中的版本号
   "version": "3.0.1"
   ```

2. **构建项目**
   ```bash
   bun run build
   ```

3. **测试打包**
   ```bash
   cd apps/cli
   npm pack
   ```

4. **发布到 npm**
   ```bash
   # 登录 npm（如果未登录）
   npm login

   # 发布包
   npm publish --access public
   ```

### 开发者本地测试

```bash
# 1. 构建项目
bun run build

# 2. 全局链接（开发模式）
cd apps/cli
npm link

# 3. 验证
memohub --version
memohub --help
```

---

## 🚀 安装方式

### 方式 1: npm 全局安装（推荐）

#### 从 npm 安装（稳定版）

```bash
npm install -g @memohub/cli
```

#### 从本地开发版本安装

```bash
# 1. 在项目根目录
cd /Users/embaobao/workspace/ai/memo-hub

# 2. 构建项目
bun run build

# 3. 全局链接
npm link --global
```

#### 使用 bun 安装

```bash
# npm 安装
bun install -g @memohub/cli

# 本地链接
bun link --global
```

### 方式 2: 使用打包文件

```bash
# 1. 打包
cd apps/cli
npm pack

# 2. 全局安装
npm install -g memohub-cli-3.0.0.tgz
```

### 方式 3: 本地包装脚本

```bash
./install-cli.sh
```

---

## ✅ 验证安装

安装完成后验证：

```bash
# 检查版本
memohub --version

# 查看帮助
memohub --help

# 测试命令
memohub list
```

---

## 🔧 开发流程

### 本地开发

```bash
# 1. 修改代码
vim apps/cli/src/index.ts

# 2. 重新构建
bun run --filter @memohub/cli build

# 3. 全局链接（重新安装）
npm link --global

# 4. 测试
memohub --version
```

### 发布新版本

```bash
# 1. 更新版本号
npm version patch  # 3.0.0 -> 3.0.1
npm version minor  # 3.0.0 -> 3.1.0
npm version major  # 3.0.0 -> 4.0.0

# 2. 构建
bun run build

# 3. 发布
npm publish
```

---

## 📋 版本管理

### 语义化版本

- **主版本** (Major): 不兼容的 API 变更
- **次版本** (Minor): 向下兼容的功能新增
- **修订版本** (Patch): 向下兼容的问题修复

### 示例

```json
{
  "name": "@memohub/cli",
  "version": "3.0.0",
  "bin": {
    "memohub": "dist/index.js"
  }
}
```

---

## 🚨 常见问题

### 问题 1: npm link 失败

**症状**: `EACCES: permission denied`

**解决**:
```bash
# 使用 sudo
sudo npm link --global

# 或者使用 bun
bun link --global
```

### 问题 2: 命令未找到

**症状**: `memohub: command not found`

**解决**:
```bash
# 检查安装
npm list -g @memohub/cli

# 重新安装
npm install -g @memohub/cli

# 或使用完整路径
node /Users/embaobao/workspace/ai/memo-hub/apps/cli/dist/index.js
```

### 问题 3: 依赖问题

**症状**: 运行时缺少依赖

**解决**:
```bash
# 确保依赖已安装
cd apps/cli
bun install

# 重新构建
bun run build
```

---

## 📚 相关文档

- **[项目结构](docs/development/project-structure.md)**
- **[开发规范](AGENT.md)**
- **[CLAUDE.md](CLAUDE.md)**

---

**发布版本**: 3.0.0  
**最后更新**: 2026-04-24
