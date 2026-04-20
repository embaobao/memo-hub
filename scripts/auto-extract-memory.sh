#!/bin/bash

# 自动记忆提取脚本
# 定期从 Hermes 会话中提取重要信息到 MemoHub

set -e

# 配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
EXTRACTOR_CLI="$PROJECT_DIR/plugins/auto-memory-extractor/dist/cli.js"
SESSIONS_DIR="${SESSIONS_DIR:-$HOME/.hermes/data/sessions}"
LOG_FILE="$HOME/.hermes/logs/auto-extract-memory.log"

# 颜色输出
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 日志函数
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${timestamp} [${level}] ${message}" >> "$LOG_FILE"
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $*"
    log "INFO" "$*"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $*"
    log "INFO" "$*"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $*"
    log "WARN" "$*"
}

# 检查依赖
check_dependencies() {
    log_info "检查依赖..."

    if [ ! -f "$EXTRACTOR_CLI" ]; then
        log_warn "提取器 CLI 不存在，尝试构建..."
        cd "$PROJECT_DIR"
        bun run build:plugins
    fi

    if [ ! -d "$SESSIONS_DIR" ]; then
        log_warn "会话目录不存在: $SESSIONS_DIR"
        return 1
    fi

    log_success "依赖检查完成"
}

# 获取最近修改的会话文件
get_recent_sessions() {
    local minutes="${1:-30}"  # 默认检查最近30分钟修改的文件
    local cutoff_time=$(date -v-${minutes}M +%Y%m%d%H%M.%S 2>/dev/null || date -d "-${minutes} minutes" +%Y%m%d%H%M.%S 2>/dev/null)

    find "$SESSIONS_DIR" -name "*.json" -type f -newermt "$cutoff_time" 2>/dev/null | sort
}

# 运行自动提取
run_extraction() {
    log_info "开始自动记忆提取..."

    # 检查依赖
    check_dependencies || return 1

    # 获取最近修改的会话文件
    local recent_sessions=$(get_recent_sessions "${EXTRACT_MINUTES:-60}")
    local session_count=$(echo "$recent_sessions" | grep -c . || echo 0)

    if [ "$session_count" -eq 0 ]; then
        log_info "没有发现新的会话文件"
        return 0
    fi

    log_info "发现 $session_count 个最近修改的会话文件"

    # 处理每个会话文件
    local processed=0
    local extracted=0
    local errors=0

    while IFS= read -r session_file; do
        if [ -z "$session_file" ]; then
            continue
        fi

        local session_name=$(basename "$session_file" .json)
        log_info "处理会话: $session_name"

        # 调用提取器
        if node "$EXTRACTOR_CLI" "$session_file" 2>&1 | tee -a "$LOG_FILE"; then
            ((processed++))
            log_success "会话 $session_name 处理完成"
        else
            ((errors++))
            log_warn "会话 $session_name 处理失败"
        fi
    done <<< "$recent_sessions"

    # 汇总报告
    echo ""
    log_success "自动提取完成"
    echo "  处理会话数: $processed"
    echo "  提取条目数: $extracted"
    echo "  错误数: $errors"
    echo ""

    # 记录到日志
    log "INFO" "提取完成 - 处理: $processed, 提取: $extracted, 错误: $errors"
}

# 主函数
main() {
    local action="${1:-extract}"

    case "$action" in
        extract)
            run_extraction
            ;;
        recent)
            local minutes="${2:-30}"
            log_info "显示最近 ${minutes} 分钟修改的会话文件:"
            get_recent_sessions "$minutes"
            ;;
        check)
            check_dependencies
            ;;
        *)
            echo "用法: $0 {extract|recent|check} [参数]"
            echo ""
            echo "命令:"
            echo "  extract           - 运行自动提取（默认）"
            echo "  recent [minutes]   - 显示最近修改的会话文件（默认30分钟）"
            echo "  check             - 检查依赖"
            echo ""
            echo "环境变量:"
            echo "  SESSIONS_DIR      - 会话目录（默认: ~/.hermes/data/sessions）"
            echo "  EXTRACT_MINUTES   - 检查最近多少分钟的会话（默认: 60）"
            exit 1
            ;;
    esac
}

# 运行主函数
main "$@"
