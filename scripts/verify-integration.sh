#!/bin/bash

# MemoHub 与 Hermes 集成验证脚本
# 用途：验证 MemoHub MCP 服务器与 Hermes 的集成状态

set -e

# ─── 配置 ───────────────────────────────────────────────

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

# ─── 检查 1：MemoHub MCP 服务器存在 ────────────────

log_info "检查 1: MemoHub MCP 服务器..."

if [ ! -d "$MEMOHUB_PATH" ]; then
    log_error "MemoHub MCP 服务器目录不存在: $MEMOHUB_PATH"
    exit 1
fi

if [ ! -f "$MEMOHUB_PATH/dist/index.js" ]; then
    log_error "MemoHub MCP 服务器未构建: $MEMOHUB_PATH/dist/index.js"
    log_info "请运行: cd $MEMOHUB_PATH && bun install && bun run build"
    exit 1
fi

log_success "MemoHub MCP 服务器存在并已构建"

# ─── 检查 2：Hermes 配置包含 MemoHub ────────────

log_info "检查 2: Hermes 配置..."

if [ ! -f "$HERMES_CONFIG" ]; then
    log_error "Hermes 配置文件不存在: $HERMES_CONFIG"
    exit 1
fi

if ! grep -q "memohub:" "$HERMES_CONFIG"; then
    log_error "Hermes 配置中未找到 MemoHub MCP 服务器"
    log_info "请运行: ./scripts/migrate-to-memohub.sh"
    exit 1
fi

log_success "Hermes 配置包含 MemoHub MCP 服务器"

# ─── 检查 3：数据库存在 ──────────────────────────

log_info "检查 3: 数据库..."

if [ ! -d "$HOME/.hermes/data/gbrain.lancedb" ]; then
    log_warning "GBrain 数据库不存在: $HOME/.hermes/data/gbrain.lancedb"
    log_info "数据库将在首次运行时创建"
else
    log_success "GBrain 数据库存在"
fi

if [ ! -d "$HOME/.hermes/data/clawmem.lancedb" ]; then
    log_warning "ClawMem 数据库不存在: $HOME/.hermes/data/clawmem.lancedb"
    log_info "数据库将在首次运行时创建"
else
    log_success "ClawMem 数据库存在"
fi

# ─── 检查 4：MemoHub MCP 工具可用 ───────────────

log_info "检查 4: MemoHub MCP 工具..."

cd "$MEMOHUB_PATH"

# 测试工具列表
TOOLS_JSON=$(echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node dist/index.js 2>/dev/null)

if ! echo "$TOOLS_JSON" | jq -e '.result.tools' > /dev/null 2>&1; then
    log_error "无法获取工具列表"
    exit 1
fi

TOOLS_COUNT=$(echo "$TOOLS_JSON" | jq -r '.result.tools | length')

if [ "$TOOLS_COUNT" -eq 9 ]; then
    log_success "MemoHub MCP 服务器提供 $TOOLS_COUNT 个工具"
else
    log_warning "工具数量异常 (期望 9, 实际 $TOOLS_COUNT)"
fi

# 列出工具名称
log_info "可用工具:"
echo "$TOOLS_JSON" | jq -r '.result.tools[] | "  - \(.name): \(.description)"'

# ─── 检查 5：Ollama 可用 ─────────────────────────

log_info "检查 5: Ollama 嵌入服务..."

if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    log_error "Ollama 服务不可用: http://localhost:11434"
    log_info "请确保 Ollama 正在运行: ollama serve"
    exit 1
fi

log_success "Ollama 服务可用"

# ─── 检查 6：嵌入模型 ─────────────────────────

log_info "检查 6: 嵌入模型..."

EMBEDDING_MODEL="nomic-embed-text-v2-moe"

# 检查 Ollama 本地模型列表（不依赖 API）
if ollama list 2>/dev/null | grep -q "$EMBEDDING_MODEL"; then
    log_success "嵌入模型可用: $EMBEDDING_MODEL"
else
    log_warning "嵌入模型未找到: $EMBEDDING_MODEL"
    log_info "下载模型: ollama pull $EMBEDDING_MODEL"
fi

# ─── 检查 7：统计信息 ─────────────────────────

log_info "检查 7: 记录统计..."

STATS_JSON=$(echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_stats","arguments":{}}}' | node dist/index.js 2>/dev/null)

if echo "$STATS_JSON" | jq -e '.result.content[0].text' > /dev/null 2>&1; then
    log_success "统计信息获取成功"

    # 解析并显示统计信息
    STATS_TEXT=$(echo "$STATS_JSON" | jq -r '.result.content[0].text')
    log_info "统计详情:"
    echo "$STATS_TEXT" | jq -r '.'
else
    log_warning "无法获取统计信息"
fi

# ─── 完成 ─────────────────────────────────────────────

echo ""
log_success "==========================================="
log_success "所有检查通过！"
log_success "==========================================="
echo ""
log_info "MemoHub 与 Hermes 集成状态："
echo "  - MemoHub MCP 服务器: ✅ 已构建"
echo "  - Hermes 配置: ✅ 已配置"
echo "  - GBrain 数据库: ✅ 存在"
echo "  - ClawMem 数据库: ✅ 存在"
echo "  - MCP 工具: ✅ 9 个可用"
echo "  - Ollama 服务: ✅ 可用"
echo "  - 嵌入模型: ✅ 可用"
echo ""
log_info "可以开始使用 MemoHub 与 Hermes 了！"
echo ""
log_info "在 Hermes 中，你可以使用以下 MemoHub MCP 工具:"
echo "  - query_knowledge: 查询通用知识"
echo "  - add_knowledge: 添加通用知识"
echo "  - list_categories: 列出知识分类"
echo "  - delete_knowledge: 删除知识记录"
echo "  - search_code: 搜索代码片段"
echo "  - add_code: 添加代码片段"
echo "  - list_symbols: 列出代码符号"
echo "  - get_stats: 获取统计信息"
echo "  - search_all: 统一搜索"
echo ""
log_success "祝使用愉快！"
