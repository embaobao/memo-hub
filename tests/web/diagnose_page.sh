#!/bin/bash
# Web Console 页面诊断脚本

echo "🔍 MemoHub Web Console 诊断"
echo ""

echo "📋 基本信息:"
echo "   - 构建时间: $(ls -l /Users/embaobao/workspace/ai/memo-hub/apps/web/dist/assets/index-BgFtGbJT.js | awk '{print $6, $7, $8}')"
echo "   - 文件大小: $(ls -lh /Users/embaobao/workspace/ai/memo-hub/apps/web/dist/assets/index-BgFtGbJT.js | awk '{print $5}')"
echo ""

echo "🧪 API 测试:"
echo -n "   /api/inspect: "
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/inspect)
if [ "$API_STATUS" = "200" ]; then
    echo "✅ $API_STATUS"
    TRACKS=$(curl -s http://localhost:3000/api/inspect | jq '.tracks | length')
    echo "   └─ 返回 $TRACKS 个 tracks"
else
    echo "❌ $API_STATUS"
fi

echo -n "   /api/workspaces: "
WS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/workspaces)
[ "$WS_STATUS" = "200" ] && echo "✅ $WS_STATUS" || echo "❌ $WS_STATUS"

echo ""

echo "📦 静态资源:"
echo "   - HTML: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)"
echo "   - JS 模块: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/assets/index-BgFtGbJT.js)"
echo "   - CSS: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/assets/index-CfnuNQvv.css)"
echo ""

echo "🔧 组件检查:"
echo "   检查构建文件中的关键组件:"
for component in "Studio" "Playground" "Clarify" "Matrix" "Logs"; do
    count=$(grep -o "$component" /Users/embaobao/workspace/ai/memo-hub/apps/web/dist/assets/index-BgFtGbJT.js | wc -l | tr -d ' ')
    if [ "$count" -gt 0 ]; then
        echo "   ✅ $component: $count 次引用"
    else
        echo "   ❌ $component: 未找到"
    fi
done
echo ""

echo "🐛 可能的问题:"
echo "   1. 浏览器缓存: 尝试 Ctrl+Shift+R 强制刷新"
echo "   2. JavaScript 错误: 打开浏览器开发者工具查看 Console"
echo "   3. API 连接: 检查后端日志 /tmp/memohub-api-final.log"
echo ""

echo "💡 建议操作:"
echo "   1. 清除浏览器缓存并刷新页面"
echo "   2. 打开浏览器开发者工具 (F12)"
echo "   3. 查看 Console 标签页是否有错误信息"
echo "   4. 查看 Network 标签页确认资源加载状态"
echo ""

echo "🚀 访问地址: http://localhost:3000"
