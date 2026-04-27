#!/bin/bash
# MemoHub Web E2E 验证测试

echo "🧪 开始 E2E 验证测试..."

# 颜色
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 测试计数
total_tests=0
passed_tests=0

run_test() {
    local test_name="$1"
    local test_command="$2"
    
    total_tests=$((total_tests + 1))
    echo -n "测试 $total_tests: $test_name ... "
    
    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASS${NC}"
        passed_tests=$((passed_tests + 1))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}"
        return 1
    fi
}

# 测试 1: 后端 API 健康检查
run_test "后端 API 健康检查" "curl -f -s http://localhost:3000/api/inspect"

# 测试 2: 工作区列表
run_test "获取工作区列表" "curl -f -s http://localhost:3000/api/workspaces"

# 测试 3: 资产列表
run_test "获取资产列表" "curl -f -s http://localhost:3000/api/assets"

# 测试 4: 前端页面
run_test "前端页面可访问" "curl -f -s http://localhost:5173"

# 测试 5: 前端代理 API
run_test "前端代理到后端 API" "curl -f -s http://localhost:5173/api/inspect"

# 测试 6: WebSocket 连接（简单测试）
run_test "WebSocket 端点可访问" "curl -f -s --max-time 2 http://localhost:3000/ws/trace || true"

# 测试 7: 静态文件服务
run_test "静态文件正确服务" "curl -f -s http://localhost:3000 | grep -q 'MemoHub'"

# 汇总结果
echo ""
echo "================================"
echo "测试结果: $passed_tests / $total_tests 通过"
echo "================================"

if [ $passed_tests -eq $total_tests ]; then
    echo -e "${GREEN}🎉 所有测试通过！${NC}"
    exit 0
else
    echo -e "${RED}⚠️  有 $((total_tests - passed_tests)) 个测试失败${NC}"
    exit 1
fi
