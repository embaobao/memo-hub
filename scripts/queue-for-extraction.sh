#!/bin/bash

# 将会话文件添加到待提取队列
# 使用方法：queue-for-extraction.sh <session-file.json>

MARKER_FILE="$HOME/.hermes/.extract-pending"
SESSION_FILE="$1"

if [ -z "$SESSION_FILE" ]; then
    echo "用法: $0 <session-file.json>"
    echo ""
    echo "示例:"
    echo "  $0 ~/path/to/session.json"
    echo ""
    echo "查看队列:"
    echo "  cat $MARKER_FILE"
    echo ""
    echo "清空队列:"
    echo "  rm $MARKER_FILE"
    exit 1
fi

if [ ! -f "$SESSION_FILE" ]; then
    echo "错误: 文件不存在: $SESSION_FILE"
    exit 1
fi

# 确保标记文件存在
touch "$MARKER_FILE"

# 添加到队列
echo "$SESSION_FILE" >> "$MARKER_FILE"

# 去重和排序
sort -u "$MARKER_FILE" -o "$MARKER_FILE"

echo "✅ 会话已添加到提取队列"
echo "   文件: $SESSION_FILE"
echo ""
echo "队列中的会话数量: $(wc -l < "$MARKER_FILE")"
echo ""
echo "下次自动提取时间: 每天 21:00"
echo "或者手动触发: ~/workspace/ai/memo-hub/scripts/system-cron-extract.sh"
