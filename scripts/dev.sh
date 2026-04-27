#!/bin/bash
# MemoHub Web 开发环境启动脚本 v2.0

set -e

echo "🚀 启动 MemoHub Web 开发环境 v2.0..."

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 清理函数
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 正在停止服务...${NC}"

    # 杀死后端进程
    if [ ! -z "$API_PID" ] && ps -p $API_PID > /dev/null 2>&1; then
        kill $API_PID 2>/dev/null || true
        echo -e "${GREEN}✅ 后端服务已停止${NC}"
    fi

    # 杀死前端进程
    if [ ! -z "$WEB_PID" ] && ps -p $WEB_PID > /dev/null 2>&1; then
        kill $WEB_PID 2>/dev/null || true
        echo -e "${GREEN}✅ 前端服务已停止${NC}"
    fi

    # 清理端口（以防万一）
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    lsof -ti:5173 | xargs kill -9 2>/dev/null || true

    exit 0
}

# 设置退出时清理
trap cleanup INT TERM EXIT

# 检查端口是否被占用
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo -e "${YELLOW}⚠️  端口 $port 已被占用，尝试清理...${NC}"
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
        sleep 1
    fi
}

# 清理端口
check_port 3000
check_port 5173

# 检查是否在项目根目录
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ 错误: 请在项目根目录运行此脚本${NC}"
    exit 1
fi

# 构建项目
echo -e "${BLUE}📦 构建项目...${NC}"
bun run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 构建失败，请检查错误信息${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 构建完成${NC}"

# 启动后端 API 服务器
echo -e "${BLUE}🔧 启动后端 API 服务器 (端口 3000)...${NC}"
node apps/cli/dist/index.js ui > /tmp/memohub-api.log 2>&1 &
API_PID=$!

# 等待后端启动
sleep 3

# 检查后端是否启动成功
if ! ps -p $API_PID > /dev/null 2>&1; then
    echo -e "${RED}❌ 后端启动失败，查看日志:${NC}"
    cat /tmp/memohub-api.log
    exit 1
fi

# 测试 API 连接
if ! curl -s http://localhost:3000/api/inspect > /dev/null 2>&1; then
    echo -e "${RED}❌ 后端 API 无响应，查看日志:${NC}"
    tail -20 /tmp/memohub-api.log
    exit 1
fi

echo -e "${GREEN}✅ 后端 API 服务器已启动 (PID: $API_PID)${NC}"

# 启动前端开发服务器
echo -e "${BLUE}🎨 启动前端开发服务器 (端口 5173)...${NC}"
cd apps/web
bun run dev > /tmp/memohub-web.log 2>&1 &
WEB_PID=$!

# 等待前端启动
sleep 3

# 检查前端是否启动成功
if ! ps -p $WEB_PID > /dev/null 2>&1; then
    echo -e "${RED}❌ 前端启动失败，查看日志:${NC}"
    cat /tmp/memohub-web.log
    cleanup
    exit 1
fi

# 测试前端连接
if ! curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo -e "${RED}❌ 前端服务无响应，查看日志:${NC}"
    tail -20 /tmp/memohub-web.log
    cleanup
    exit 1
fi

echo -e "${GREEN}✅ 前端开发服务器已启动 (PID: $WEB_PID)${NC}"

# 返回根目录
cd - > /dev/null

echo ""
echo -e "${GREEN}🎉 MemoHub Web 开发环境启动完成！${NC}"
echo ""
echo "📍 访问地址："
echo -e "   - 前端: ${BLUE}http://localhost:5173${NC}"
echo -e "   - 后端: ${BLUE}http://localhost:3000${NC}"
echo ""
echo "📝 日志文件："
echo "   - 后端: /tmp/memohub-api.log"
echo "   - 前端: /tmp/memohub-web.log"
echo ""
echo "🔧 进程信息："
echo "   - 后端 PID: $API_PID"
echo "   - 前端 PID: $WEB_PID"
echo ""
echo -e "${YELLOW}💡 提示: 使用 Ctrl+C 停止所有服务${NC}"
echo ""

# 保持脚本运行
wait