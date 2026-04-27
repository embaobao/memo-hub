#!/bin/bash
# Web Console 功能验证测试

echo "🧪 验证 Web Console 功能..."

GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

total=0
passed=0

test_feature() {
    local name="$1"
    local url="$2"
    local pattern="$3"
    
    total=$((total + 1))
    echo -n "测试 $total: $name ... "
    
    if curl -s "$url" | grep -q "$pattern"; then
        echo -e "${GREEN}✅ PASS${NC}"
        passed=$((passed + 1))
    else
        echo -e "${RED}❌ FAIL${NC}"
    fi
}

echo ""
echo -e "${BLUE}=== 页面基础功能 ===${NC}"

# 页面加载
test_feature "页面标题" "http://localhost:3000" "MemoHub"

# 关键资源
test_feature "CSS 资源" "http://localhost:3000/assets/index-BlfPEPrE.css" "glass"
test_feature "JS 模块" "http://localhost:3000/assets/index-uMwohtob.js" "React"

echo ""
echo -e "${BLUE}=== API 端点 ===${NC}"

test_feature "系统信息 API" "http://localhost:3000/api/inspect" "tracks"
test_feature "工作区列表 API" "http://localhost:3000/api/workspaces" "workspaces"
test_feature "资产列表 API" "http://localhost:3000/api/assets" "items"

echo ""
echo -e "${BLUE}=== 特殊组件验证 ===${NC}"

# 检查是否包含新组件的引用
test_feature "WikiPreview 组件" "http://localhost:3000/assets/index-uMwohtob.js" "WikiPreview"
test_feature "ClarifyCenter 组件" "http://localhost:3000/assets/index-uMwohtob.js" "ClarifyCenter"
test_feature "AgentPlayground 组件" "http://localhost:3000/assets/index-uMwohtob.js" "AgentPlayground"

echo ""
echo "================================"
echo "测试结果: $passed / $total 通过"
echo "================================"

if [ $passed -eq $total ]; then
    echo -e "${GREEN}🎉 所有功能正常！${NC}"
    echo ""
    echo "📱 访问地址:"
    echo "   - 生产环境: http://localhost:3000"
    echo "   - 开发环境: http://localhost:5173"
    echo ""
    echo "✨ 可用功能:"
    echo "   - Studio: 可视化流编排"
    echo "   - Playground: Agent 对话沙盒"
    echo "   - Clarify: 冲突治理中心"
    echo "   - Matrix: 记忆资产大盘"
    echo "   - Logs: 实时追踪日志"
    exit 0
else
    echo -e "${RED}⚠️  有 $((total - passed)) 个测试失败${NC}"
    exit 1
fi
