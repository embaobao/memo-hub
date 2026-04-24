# MemoHub CLI 安装指南

## 📦 方式 1: npm 全局安装（推荐）

### 开发者模式（从本地安装）

在项目根目录执行：

```bash
# 1. 构建项目
bun run build

# 2. 全局链接（开发模式）
npm link --global

# 或者使用 bun
bun link --global
```

### 用户模式（从 npm 安装）

```bash
# 如果已发布到 npm
npm install -g @memohub/cli

# 或使用 bun
bun install -g @memohub/cli
```

## 🔧 方式 2: 本地安装脚本

如果不想全局安装，可以使用本地包装脚本：

```bash
./install-cli.sh
```

## ✅ 验证安装

安装后验证：

```bash
memohub --version
memohub --help
memohub list
```
