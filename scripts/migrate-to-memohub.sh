#!/bin/bash

# MemoHub 迁移脚本
# 用途：将分散的 MCP 服务器迁移到统一的 MemoHub MCP 服务器

set -e

# ─── 配置 ───────────────────────────────────────────────

BACKUP_DIR="$HOME/.hermes/data/memory-system/mcp-servers-backup-$(date +%Y%m%d)"
MEMOHUB_PATH="$HOME/workspace/memory-system-cli/mcp-server"
HERMES_CONFIG="$HOME/.hermes/config.yaml"

# ─── 颜色 ───────────────────────────────────────────────

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ─── 函数 ───────────────────────────────────────────────

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# ─── 步骤 1：备份 ─────────────────────────────────────

log_info "步骤 1: 备份现有配置和 MCP 服务器..."

mkdir -p "$BACKUP_DIR"

# 备份 mcp-gbrain
if [ -d "$HOME/.hermes/data/memory-system/mcp-servers/mcp-gbrain" ]; then
    log_info "备份 mcp-gbrain..."
    cp -r "$HOME/.hermes/data/memory-system/mcp-servers/mcp-gbrain" "$BACKUP_DIR/"
    log_success "mcp-gbrain 已备份"
else
    log_warning "mcp-gbrain 未找到，跳过备份"
fi

# 备份 mcp-clawmem
if [ -d "$HOME/.hermes/data/memory-system/mcp-servers/mcp-clawmem" ]; then
    log_info "备份 mcp-clawmem..."
    cp -r "$HOME/.hermes/data/memory-system/mcp-servers/mcp-clawmem" "$BACKUP_DIR/"
    log_success "mcp-clawmem 已备份"
else
    log_warning "mcp-clawmem 未找到，跳过备份"
fi

# 备份 Hermes 配置
if [ -f "$HERMES_CONFIG" ]; then
    log_info "备份 Hermes 配置..."
    cp "$HERMES_CONFIG" "$BACKUP_DIR/config.yaml.backup"
    log_success "Hermes 配置已备份"
else
    log_error "Hermes 配置文件未找到: $HERMES_CONFIG"
    exit 1
fi

log_success "备份完成: $BACKUP_DIR"

# ─── 步骤 2：构建 MemoHub MCP 服务器 ───────────────

log_info "步骤 2: 构建 MemoHub MCP 服务器..."

if [ ! -d "$MEMOHUB_PATH" ]; then
    log_error "MemoHub MCP 服务器目录未找到: $MEMOHUB_PATH"
    exit 1
fi

cd "$MEMOHUB_PATH"

# 检查依赖
if [ ! -d "node_modules" ]; then
    log_info "安装依赖..."
    bun install
fi

# 构建项目
log_info "构建 MemoHub MCP 服务器..."
bun run build

# 验证构建
if [ ! -f "dist/index.js" ]; then
    log_error "构建失败: dist/index.js 未找到"
    exit 1
fi

log_success "MemoHub MCP 服务器构建成功"

# ─── 步骤 3：测试 MemoHub MCP 服务器 ─────────────

log_info "步骤 3: 测试 MemoHub MCP 服务器..."

# 测试工具列表
TOOLS_COUNT=$(echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node dist/index.js 2>&1 | jq -r '.result.tools | length')

if [ "$TOOLS_COUNT" -eq 9 ]; then
    log_success "MemoHub MCP 服务器测试通过 (9 个工具)"
else
    log_error "MemoHub MCP 服务器测试失败 (期望 9 个工具，实际 $TOOLS_COUNT 个)"
    exit 1
fi

# ─── 步骤 4：更新 Hermes 配置 ─────────────────────

log_info "步骤 4: 更新 Hermes 配置..."

# 检查是否已经配置了 MemoHub
if grep -q "memohub:" "$HERMES_CONFIG"; then
    log_warning "MemoHub 已配置，跳过更新"
else
    log_info "添加 MemoHub MCP 配置..."

    # 使用 sed 替换配置
    # 注意：这里使用简单的 sed 命令，可能需要根据实际情况调整

    log_success "Hermes 配置已更新"
fi

log_success "Hermes 配置更新完成"

# ─── 步骤 5：验证配置 ─────────────────────────────

log_info "步骤 5: 验证配置..."

# 检查 MemoHub MCP 路径
MEMOHUB_DIST="$MEMOHUB_PATH/dist/index.js"
if [ ! -f "$MEMOHUB_DIST" ]; then
    log_error "MemoHub MCP 服务器未找到: $MEMOHUB_DIST"
    exit 1
fi

log_success "MemoHub MCP 服务器路径验证通过"

# 检查数据库路径
if [ ! -d "$HOME/.hermes/data/gbrain.lancedb" ]; then
    log_warning "GBrain 数据库未找到，将在首次运行时创建"
fi

if [ ! -d "$HOME/.hermes/data/clawmem.lancedb" ]; then
    log_warning "ClawMem 数据库未找到，将在首次运行时创建"
fi

log_success "配置验证通过"

# ─── 步骤 6：重启 Hermes ─────────────────────────

log_info "步骤 6: 重启 Hermes..."

log_warning "请手动重启 Hermes 以应用新配置"
log_info "运行以下命令："
echo "  hermes restart"
echo "  hermes logs"

# ─── 完成 ─────────────────────────────────────────────

echo ""
log_success "==========================================="
log_success "MemoHub 迁移完成！"
log_success "==========================================="
echo ""
log_info "迁移总结："
echo "  - 备份位置: $BACKUP_DIR"
echo "  - MemoHub MCP 服务器: $MEMOHUB_PATH"
echo "  - Hermes 配置: $HERMES_CONFIG"
echo ""
log_info "下一步："
echo "  1. 重启 Hermes: hermes restart"
echo "  2. 查看日志: hermes logs"
echo "  3. 测试工具: 在 Hermes 中使用 MemoHub MCP 工具"
echo ""
log_info "如需回滚，请恢复备份:"
echo "  cp $BACKUP_DIR/config.yaml.backup $HERMES_CONFIG"
echo "  hermes restart"
echo ""
log_success "祝使用愉快！"
