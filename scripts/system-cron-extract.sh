#!/bin/bash

# 系统级自动记忆提取任务
# 使用 cron 定期执行：每天 21:00

# 使用方法：
# 1. 编辑 crontab: crontab -e
# 2. 添加以下行：
#    0 21 * * * /Users/embaobao/workspace/ai/memo-hub/scripts/system-cron-extract.sh >> ~/.hermes/logs/cron-extract.log 2>&1

set -e

# 配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
EXTRACTOR_DIR="$PROJECT_DIR/plugins/auto-memory-extractor/dist"
LOG_FILE="$HOME/.hermes/logs/cron-extract.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# 进入项目目录（确保可以访问本地依赖）
cd "$PROJECT_DIR"

# 输出日志
echo "[$TIMESTAMP] ===== 开始自动记忆提取 =====" >> "$LOG_FILE"

# 检查提取器是否存在
if [ ! -f "$EXTRACTOR_DIR/cli.js" ]; then
    echo "[$TIMESTAMP] 错误: 提取器 CLI 不存在，尝试构建..." >> "$LOG_FILE"
    bun run build:plugins >> "$LOG_FILE" 2>&1
fi

# 由于没有集中的 sessions 目录，我们创建一个标记文件
# 当有新会话需要提取时，创建这个标记文件
MARKER_FILE="$HOME/.hermes/.extract-pending"

if [ ! -f "$MARKER_FILE" ]; then
    echo "[$TIMESTAMP] 没有待提取的会话（标记文件不存在）" >> "$LOG_FILE"
    echo "[$TIMESTAMP] 要触发提取，创建标记文件: touch $MARKER_FILE" >> "$LOG_FILE"
    echo "[$TIMESTAMP] ===== 提取完成 =====" >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"
    exit 0
fi

# 读取标记文件中的会话路径列表
SESSION_FILES=$(cat "$MARKER_FILE" 2>/dev/null || true)

if [ -z "$SESSION_FILES" ]; then
    echo "[$TIMESTAMP] 没有待提取的会话" >> "$LOG_FILE"
    rm -f "$MARKER_FILE"
    echo "[$TIMESTAMP] ===== 提取完成 =====" >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"
    exit 0
fi

# 处理每个会话文件
echo "[$TIMESTAMP] 找到待提取的会话：" >> "$LOG_FILE"
echo "$SESSION_FILES" | while IFS= read -r session_file; do
    if [ -n "$session_file" ] && [ -f "$session_file" ]; then
        echo "[$TIMESTAMP] - 处理: $session_file" >> "$LOG_FILE"

        # 调用提取器
        if node "$EXTRACTOR_DIR/cli.js" "$session_file" >> "$LOG_FILE" 2>&1; then
            echo "[$TIMESTAMP] ✓ 成功: $session_file" >> "$LOG_FILE"
        else
            echo "[$TIMESTAMP] ✗ 失败: $session_file" >> "$LOG_FILE"
        fi
    fi
done

# 删除标记文件
rm -f "$MARKER_FILE"

# 显示更新后的统计
echo "[$TIMESTAMP]" >> "$LOG_FILE"
echo "[$TIMESTAMP] 记忆系统统计:" >> "$LOG_FILE"
mh stats >> "$LOG_FILE" 2>&1

echo "[$TIMESTAMP] ===== 提取完成 =====" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"
