# MemoHub Web Console 故障排除指南

## 🐛 页面显示问题排查

### 当前状态
- ✅ 构建文件正确（2105 模块，220KB）
- ✅ 所有组件已集成（Studio, Playground, Clarify, Matrix, Logs）
- ✅ API 正常工作（返回 200 状态码）
- ✅ 静态资源正常加载（HTML, CSS, JS）

### 可能的原因

#### 1. 浏览器缓存问题
**症状**: 页面显示旧版本内容
**解决**:
```
1. 强制刷新: Ctrl+Shift+R (Windows/Linux) 或 Cmd+Shift+R (Mac)
2. 清除缓存: F12 → Application → Clear storage → Clear site data
3. 无痕模式: 打开新的无痕窗口测试
```

#### 2. JavaScript 执行错误
**症状**: 页面部分显示，功能异常
**检查**:
```
1. 打开浏览器开发者工具 (F12)
2. 查看 Console 标签页
3. 寻找红色错误信息
```

**常见错误**:
- `ReferenceError`: 组件未定义
- `TypeError`: API 响应格式错误
- `SyntaxError`: 代码语法问题

#### 3. API 连接失败
**症状**: 页面一直显示 "Booting Memory OS..."
**检查**:
```bash
# 测试 API 端点
curl http://localhost:3000/api/inspect
curl http://localhost:3000/api/workspaces
curl http://localhost:3000/api/assets
```

**解决**:
- 确认后端服务运行: `ps aux | grep node.*index.js ui`
- 检查后端日志: `cat /tmp/memohub-api-final.log`
- 重启后端服务: `pkill -f "node.*index.js ui" && node apps/cli/dist/index.js ui`

#### 4. React 渲染问题
**症状**: 页面只显示基本结构，缺少内容
**原因**: API 返回的数据导致组件无法渲染

**当前 API 状态**:
```json
{
  "tracks": [
    { "id": "track-insight", "flows": {} },  // 空 flows
    { "id": "track-source", "flows": {} },   // 空 flows
    { "id": "track-stream", "flows": {} },   // 空 flows
    { "id": "track-wiki", "flows": {} }      // 空 flows
  ]
}
```

**影响**: Studio 页面的流程图会显示为空（因为没有 flow 数据）

---

## 🔧 快速修复步骤

### 步骤 1: 清除浏览器缓存
1. 打开 http://localhost:3000
2. 按 `Ctrl+Shift+R` 强制刷新
3. 如果仍然有问题，进入步骤 2

### 步骤 2: 检查浏览器控制台
1. 按 `F12` 打开开发者工具
2. 点击 `Console` 标签页
3. 查找错误信息
4. 如果有错误，记录下来并继续

### 步骤 3: 验证 API 服务
```bash
# 运行诊断脚本
./tests/web/diagnose_page.sh

# 或手动测试
curl http://localhost:3000/api/inspect | jq '.tracks | length'
# 应该返回: 4
```

### 步骤 4: 重启服务
```bash
# 停止旧服务
pkill -f "node.*index.js ui"

# 重新启动
node apps/cli/dist/index.js ui

# 等待 5 秒后访问
sleep 5
open http://localhost:3000
```

---

## 📊 预期页面结构

### 正常情况下应该看到：

**左侧导航栏**:
- 🔵 Studio
- 🟣 Playground
- 🟠 Clarify
- 🔵 Matrix
- 🔴 Logs

**顶部标题栏**:
- MemoHub 标志
- Workspaces / 当前工作区
- ➕ 新增按钮

**主内容区** (根据选择的标签):
- **Studio**: 流程图（可能为空，如果没有配置 flow）
- **Playground**: 对话界面
- **Clarify**: 冲突列表
- **Matrix**: 资产卡片
- **Logs**: 实时日志

---

## 🚨 如果还是无法显示

### 收集诊断信息

```bash
# 1. 保存当前页面
curl -s http://localhost:3000 > /tmp/current_page.html

# 2. 检查 JS 文件
curl -s http://localhost:3000/assets/index-*.js > /tmp/current_js.js

# 3. 检查 API 响应
curl -s http://localhost:3000/api/inspect > /tmp/api_response.json

# 4. 检查后端日志
tail -50 /tmp/memohub-api-final.log > /tmp/backend_log.txt

# 5. 查看进程状态
ps aux | grep "node.*index.js ui" > /tmp/process_status.txt
```

### 提交问题报告

请提供以下信息：
1. 截图（当前页面显示）
2. 浏览器控制台错误（F12 → Console）
3. 网络请求状态（F12 → Network）
4. 上述诊断文件

---

## 💡 临时解决方案

### 如果急需使用功能，可以：

#### 方案 1: 使用开发模式
```bash
# 终端 1: 启动后端
node apps/cli/dist/index.js ui

# 终端 2: 启动前端开发服务器
cd apps/web && bun run dev

# 访问: http://localhost:5173
```

#### 方案 2: 直接使用 CLI
```bash
# 使用 CLI 命令而不是 Web UI
node apps/cli/dist/index.js add "test memory"
node apps/cli/dist/index.js query "test"
```

---

## 📞 获取帮助

如果问题持续存在：

1. **查看日志**: `cat /tmp/memohub-api-final.log`
2. **运行诊断**: `./tests/web/diagnose_page.sh`
3. **检查文档**: `docs/guides/web-console.md`
4. **提交 Issue**: 包含上述诊断信息

---

**最后更新**: 2026-04-27
**状态**: 等待用户反馈页面实际显示内容