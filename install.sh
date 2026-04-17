#!/bin/bash

# MemoHub 安装脚本
# 用途：快速安装 MemoHub

set -e

echo "🚀 MemoHub 安装脚本"
echo "===================="
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装"
    echo "请访问 https://nodejs.org/ 安装 Node.js >= 22.0.0"
    exit 1
fi

NODE_VERSION=$(node --version)
echo "✓ Node.js: $NODE_VERSION"

# 检查 Bun（可选）
if command -v bun &> /dev/null; then
    BUN_VERSION=$(bun --version)
    echo "✓ Bun: $BUN_VERSION"
    USE_BUN=true
else
    echo "⚠ Bun 未安装，将使用 npm"
    USE_BUN=false
fi

# 检查 Ollama
if ! command -v ollama &> /dev/null; then
    echo "❌ Ollama 未安装"
    echo "请访问 https://ollama.com/ 安装 Ollama"
    exit 1
fi

OLLAMA_VERSION=$(ollama --version 2>/dev/null || echo "unknown")
echo "✓ Ollama: $OLLAMA_VERSION"

echo ""
echo "📦 开始安装..."

# 检查是否在项目目录中
if [ -f "package.json" ]; then
    echo "✓ 检测到项目目录"

    # 安装依赖
    if [ "$USE_BUN" = true ]; then
        echo "使用 Bun 安装依赖..."
        bun install
    else
        echo "使用 npm 安装依赖..."
        npm install
    fi

    # 构建项目
    echo "构建项目..."
    if [ "$USE_BUN" = true ]; then
        bun run build
    else
        npm run build
    fi

    # 创建配置文件
    if [ ! -f "config/config.yaml" ]; then
        echo "创建配置文件..."
        cp config/config.example.yaml config/config.yaml
    fi

    echo ""
    echo "✅ 安装完成！"
    echo ""
    echo "使用方法："
    echo "  node dist/cli/index.js --help"
    echo ""
    echo "或者全局安装："
    if [ "$USE_BUN" = true ]; then
        echo "  bun run prepack"
        echo "  npm install -g ."
    else
        echo "  npm install -g ."
    fi

else
    echo "❌ 未找到 package.json"
    echo "请确保在 MemoHub 项目目录中运行此脚本"
    exit 1
fi

echo ""
echo "🎉 安装成功！开始使用 MemoHub 吧！"
