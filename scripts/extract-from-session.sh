#!/bin/bash

# 手动从指定会话文件中提取知识到 MemoHub

set -e

# 配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
EXTRACTOR_CLI="$PROJECT_DIR/plugins/auto-memory-extractor/dist/cli.js"

# 颜色输出
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 显示使用方法
if [ $# -eq 0 ]; then
    echo -e "${BLUE}手动记忆提取工具${NC}"
    echo ""
    echo "用法: $0 <session-file.json>"
    echo ""
    echo "示例:"
    echo "  $0 ~/.hermes/sessions/session-xxx.json"
    echo "  $0 /path/to/session-file.json"
    echo ""
    exit 0
fi

SESSION_FILE="$1"

# 检查文件是否存在
if [ ! -f "$SESSION_FILE" ]; then
    echo -e "${RED}错误: 会话文件不存在${NC}"
    echo "  文件: $SESSION_FILE"
    exit 1
fi

# 检查提取器是否存在
if [ ! -f "$EXTRACTOR_CLI" ]; then
    echo -e "${YELLOW}提取器不存在，正在构建...${NC}"
    cd "$PROJECT_DIR"
    bun run build:plugins
    if [ ! -f "$EXTRACTOR_CLI" ]; then
        echo -e "${RED}错误: 提取器构建失败${NC}"
        exit 1
    fi
fi

# 显示会话信息
echo -e "${BLUE}开始处理会话...${NC}"
echo "  文件: $SESSION_FILE"
echo "  大小: $(du -h "$SESSION_FILE" | cut -f1)"
echo ""

# 运行提取器
if node "$EXTRACTOR_CLI" "$SESSION_FILE"; then
    echo ""
    echo -e "${GREEN}✅ 记忆提取完成${NC}"

    # 显示更新后的统计
    echo ""
    echo "记忆系统统计:"
    mh stats 2>/dev/null || echo "  （无法获取统计信息）"

    exit 0
else
    echo ""
    echo -e "${RED}❌ 记忆提取失败${NC}"
    exit 1
fi
