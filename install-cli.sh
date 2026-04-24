#!/bin/bash
# MemoHub v1 CLI 安装脚本

set -e

PROJECT_DIR="/Users/embaobao/workspace/ai/memo-hub"
INSTALL_DIR="/usr/local/bin"
CLI_PATH="$PROJECT_DIR/apps/cli/dist/index.js"

echo "🚀 安装 MemoHub v1 CLI..."

# 检查 CLI 是否存在
if [ ! -f "$CLI_PATH" ]; then
    echo "❌ CLI 文件不存在: $CLI_PATH"
    echo "请先运行: bun run build"
    exit 1
fi

# 创建包装脚本
cat << 'SCRIPT' | sudo tee "$INSTALL_DIR/memohub" > /dev/null
#!/bin/bash
cd /Users/embaobao/workspace/ai/memo-hub
node apps/cli/dist/index.js "$@"
SCRIPT

# 设置可执行权限
sudo chmod +x "$INSTALL_DIR/memohub"

echo "✅ MemoHub v1 CLI 安装成功！"
echo ""
echo "🎯 现在可以使用 memohub 命令："
echo "  memohub add '知识内容'"
echo "  memohub search '查询'"
echo "  memohub list"
echo "  memohub --help"
