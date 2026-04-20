#!/bin/bash

# MemoHub 记忆系统自动备份脚本
# 每天备份 LanceDB 数据库到私有仓库

set -e

# ─── 配置 ───────────────────────────────────────────────

BACKUP_DIR="$HOME/.hermes/backups/memo-hub"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="memo-hub-backup-${TIMESTAMP}.tar.gz"
PRIVATE_REPO="$HOME/workspace/ai/memo-hub-private"

# 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ─── 检查数据库 ─────────────────────────────────────

log_info "检查记忆系统数据库..."

GBRAIN_DB="$HOME/.hermes/data/gbrain.lancedb"
CLAWMEM_DB="$HOME/.hermes/data/clawmem.lancedb"

if [ ! -d "$GBRAIN_DB" ]; then
    log_error "GBrain 数据库未找到: $GBRAIN_DB"
    exit 1
fi

if [ ! -d "$CLAWMEM_DB" ]; then
    log_error "ClawMem 数据库未找到: $CLAWMEM_DB"
    exit 1
fi

log_success "数据库检查通过"

# ─── 创建备份目录 ───────────────────────────────────

log_info "创建备份目录..."
mkdir -p "$BACKUP_DIR"

# ─── 统计数据 ───────────────────────────────────────

log_info "统计数据..."

GBRAIN_SIZE=$(du -sh "$GBRAIN_DB" | cut -f1)
CLAWMEM_SIZE=$(du -sh "$CLAWMEM_DB" | cut -f1)

echo ""
echo "  GBrain:   $GBRAIN_SIZE"
echo "  ClawMem:  $CLAWMEM_SIZE"
echo ""

# ─── 创建备份 ───────────────────────────────────────

log_info "创建备份: $BACKUP_NAME"

cd "$HOME/.hermes/data"

tar -czf "$BACKUP_DIR/$BACKUP_NAME" \
    gbrain.lancedb/ \
    clawmem.lancedb/

BACKUP_SIZE=$(du -sh "$BACKUP_DIR/$BACKUP_NAME" | cut -f1)

log_success "备份完成: $BACKUP_SIZE"

# ─── 推送到私有仓库（如果存在）────────────────────

if [ -d "$PRIVATE_REPO" ]; then
    log_info "推送到私有仓库..."

    mkdir -p "$PRIVATE_REPO/backups"
    cp "$BACKUP_DIR/$BACKUP_NAME" "$PRIVATE_REPO/backups/"

    cd "$PRIVATE_REPO"
    git add "backups/$BACKUP_NAME"
    git commit -m "backup: ${TIMESTAMP}" || {
        log_warning "没有新变更需要提交"
    }

    log_success "私有仓库更新完成"
else
    log_warning "私有仓库未找到: $PRIVATE_REPO"
    log_info "跳过 Git 备份"
fi

# ─── 清理旧备份（保留最近 7 天）──────────────────

log_info "清理旧备份（保留最近 7 天）..."

find "$BACKUP_DIR" -name "memo-hub-backup-*.tar.gz" -mtime +7 -delete

OLD_COUNT=$(find "$BACKUP_DIR" -name "memo-hub-backup-*.tar.gz" | wc -l)
log_success "保留备份: $OLD_COUNT 个"

# ─── 完成 ───────────────────────────────────────────

echo ""
log_success "==========================================="
log_success "备份完成！"
log_success "==========================================="
echo ""
echo "备份信息:"
echo "  文件名:    $BACKUP_NAME"
echo "  大小:      $BACKUP_SIZE"
echo "  位置:      $BACKUP_DIR"
echo "  GBrain:    $GBRAIN_SIZE"
echo "  ClawMem:   $CLAWMEM_SIZE"
echo ""
echo "下一步:"
echo "  查看备份: ls -lh $BACKUP_DIR"
echo "  恢复备份: tar -xzf $BACKUP_DIR/$BACKUP_NAME -C ~/.hermes/data/"
echo ""
