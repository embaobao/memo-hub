#!/bin/bash

# MemoHub 回滚脚本
# 用途：回滚到分散的 MCP 服务器配置

set -e

# ─── 配置 ───────────────────────────────────────────────

HERMES_CONFIG="$HOME/.hermes/config.yaml"
BACKUP_DIR="$1"

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

# ─── 检查参数 ─────────────────────────────────────────

if [ -z "$BACKUP_DIR" ]; then
    log_error "请指定备份目录"
    echo "用法: $0 <backup-dir>"
    echo "示例: $0 ~/.hermes/data/memory-system/mcp-servers-backup-20260417"
    exit 1
fi

if [ ! -d "$BACKUP_DIR" ]; then
    log_error "备份目录不存在: $BACKUP_DIR"
    exit 1
fi

log_info "回滚到备份: $BACKUP_DIR"

# ─── 步骤 1：恢复配置 ─────────────────────────────

log_info "步骤 1: 恢复 Hermes 配置..."

if [ -f "$BACKUP_DIR/config.yaml.backup" ]; then
    cp "$BACKUP_DIR/config.yaml.backup" "$HERMES_CONFIG"
    log_success "Hermes 配置已恢复"
else
    log_error "备份配置未找到: $BACKUP_DIR/config.yaml.backup"
    exit 1
fi

# ─── 步骤 2：恢复 MCP 服务器 ─────────────────────

log_info "步骤 2: 恢复 MCP 服务器..."

# 恢复 mcp-gbrain
if [ -d "$BACKUP_DIR/mcp-gbrain" ]; then
    log_info "恢复 mcp-gbrain..."
    mkdir -p "$HOME/.hermes/data/memory-system/mcp-servers"
    rm -rf "$HOME/.hermes/data/memory-system/mcp-servers/mcp-gbrain"
    cp -r "$BACKUP_DIR/mcp-gbrain" "$HOME/.hermes/data/memory-system/mcp-servers/"
    log_success "mcp-gbrain 已恢复"
else
    log_warning "mcp-gbrain 备份未找到，跳过恢复"
fi

# 恢复 mcp-clawmem
if [ -d "$BACKUP_DIR/mcp-clawmem" ]; then
    log_info "恢复 mcp-clawmem..."
    mkdir -p "$HOME/.hermes/data/memory-system/mcp-servers"
    rm -rf "$HOME/.hermes/data/memory-system/mcp-servers/mcp-clawmem"
    cp -r "$BACKUP_DIR/mcp-clawmem" "$HOME/.hermes/data/memory-system/mcp-servers/"
    log_success "mcp-clawmem 已恢复"
else
    log_warning "mcp-clawmem 备份未找到，跳过恢复"
fi

# ─── 步骤 3：验证恢复 ─────────────────────────────

log_info "步骤 3: 验证恢复..."

if grep -q "mcp-gbrain:" "$HERMES_CONFIG" && grep -q "mcp-clawmem:" "$HERMES_CONFIG"; then
    log_success "配置验证通过"
else
    log_error "配置验证失败"
    exit 1
fi

# ─── 步骤 4：重启 Hermes ─────────────────────────

log_info "步骤 4: 重启 Hermes..."

log_warning "请手动重启 Hermes 以应用配置"
log_info "运行以下命令："
echo "  hermes restart"
echo "  hermes logs"

# ─── 完成 ─────────────────────────────────────────────

echo ""
log_success "==========================================="
log_success "回滚完成！"
log_success "==========================================="
echo ""
log_info "已恢复到分散的 MCP 服务器配置"
echo "  - mcp-gbrain: 已恢复"
echo "  - mcp-clawmem: 已恢复"
echo ""
log_info "下一步："
echo "  1. 重启 Hermes: hermes restart"
echo "  2. 查看日志: hermes logs"
echo ""
log_success "完成！"
