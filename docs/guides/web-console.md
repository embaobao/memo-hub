# MemoHub Web Console 使用手册

## 🚀 快速启动

### 开发模式

```bash
# 方式 1: 使用启动脚本（推荐）
./scripts/dev.sh

# 方式 2: 手动启动
# 终端 1: 启动后端 API 服务器
node apps/cli/dist/index.js ui

# 终端 2: 启动前端开发服务器
cd apps/web && bun run dev
```

访问地址：
- 前端开发服务器: http://localhost:5173
- 后端 API 服务器: http://localhost:3000

### 生产模式

```bash
# 构建前端
cd apps/web && bun run build

# 启动后端（会自动服务前端静态文件）
node apps/cli/dist/index.js ui

# 访问 http://localhost:3000
```

---

## 📖 功能指南

### 1. Studio - 可视化流编排

**功能**: 将 MemoHub 的 Track 配置可视化，支持拖拽式编排。

**特性**:
- 🔵 **节点视图**: 每个工具（Tool）显示为独立节点
- 🟢 **实时脉冲**: 工具执行时节点会有绿色呼吸效果
- 🔗 **自动连线**: 根据 Flow 配置自动生成节点连接线
- 📊 **实时反馈**: 通过 WebSocket 接收内核事件并更新节点状态

**使用方法**:
1. 打开 "Studio" 标签页
2. 系统自动加载当前 Workspace 的 Track 配置
3. 查看工具编排流程，节点从上到下表示执行顺序

---

### 2. Playground - Agent 对话沙盒

**功能**: 模拟与 MemoHub 集成的 AI Agent 对话，测试记忆检索效果。

**特性**:
- 💬 **多轮对话**: 支持连续对话上下文
- 🛠️ **工具调用**: 自动调用 `/api/chat` 端点检索记忆
- 📝 **系统提示词**: 可自定义 Agent 系统提示词
- 💾 **导出功能**: 支持导出对话记录为 JSON

**使用方法**:
1. 打开 "Playground" 标签页
2. 在输入框中输入问题（如 "MemoHub 是什么？"）
3. 查看返回的回答和检索到的记忆片段
4. 点击 "Show System Prompt" 自定义 Agent 行为

---

### 3. Clarify - 冲突治理中心

**功能**: 处理 Librarian 发现的记忆冲突，支持 A/B 对比和合并决策。

**特性**:
- 🔍 **冲突检测**: 自动检测重复、矛盾、过期的记忆
- 📊 **A/B 对比**: 并排展示冲突记录的详细信息
- ⚖️ **多策略解决**: 支持保留、合并、删除等操作
- 🎯 **严重程度标记**: 根据冲突类型标记高/中/低严重性

**使用方法**:
1. 打开 "Clarify" 标签页
2. 从左侧选择一个冲突
3. 查看两个冲突记录的详细对比
4. 选择解决策略：
   - **Keep First/Second**: 保留其中一个记录
   - **Merge**: 合并两个记录的内容
   - **Delete Both**: 删除两个冲突记录

---

### 4. Matrix - 记忆资产大盘

**功能**: 浏览和搜索存储在 MemoHub 中的所有记忆资产。

**特性**:
- 📇 **卡片视图**: 以卡片形式展示记忆内容
- 🏷️ **分类显示**: 显示 Track ID、实体、时间等元数据
- 🔍 **Wiki 预览**: 点击卡片可在右侧查看详细 Wiki 预览
- 📊 **多维度筛选**: 支持 Track、时间、实体类型筛选

**使用方法**:
1. 打开 "Matrix" 标签页
2. 浏览所有记忆资产卡片
3. 点击任意卡片打开右侧 Wiki 预览面板
4. 在预览面板中切换 Content、Entities、Relations 标签

---

### 5. Logs - 实时追踪日志

**功能**: 实时查看 MemoHub 内核的执行日志。

**特性**:
- 🔴 **实时流式**: 通过 WebSocket 接收内核事件
- 🕐 **时间戳**: 每条日志显示精确时间
- 📝 **详细信息**: 包含 Track ID、Stage 等上下文

**使用方法**:
1. 打开 "Logs" 标签页
2. 实时查看内核事件流
3. 日志按时间倒序排列（最新在最前）

---

## 🎨 界面特色

### Glassmorphism 设计
- 所有面板采用毛玻璃效果（`backdrop-blur-3xl`）
- 极简黑白配色，配合蓝色高亮
- 圆角设计统一使用 `rounded-[1.5rem]` / `rounded-[2.5rem]`

### 动画效果
- 页面切换使用 Framer Motion 淡入淡出
- 卡片加载有顺序淡入和上移动画
- 交互元素有 Hover 状态过渡

### 响应式布局
- 侧边栏固定宽度 280px
- 主内容区自适应剩余空间
- 支持 Workspace 切换并重新加载数据

---

## 🔧 开发指南

### API 端点

后端 API 服务器运行在 `http://localhost:3000`，主要端点：

- `GET /api/inspect` - 获取系统信息（Tracks、Tools、Config）
- `GET /api/workspaces` - 获取所有 Workspace 列表
- `POST /api/workspace/switch` - 切换当前 Workspace
- `GET /api/assets` - 获取记忆资产列表
- `POST /api/chat` - Agent 对话接口
- `POST /api/search` - 搜索记忆
- `WS /ws/trace` - WebSocket 追踪日志流

### WebSocket 连接

```javascript
const ws = new WebSocket('ws://localhost:3000/ws/trace');
ws.onmessage = (e) => {
  const data = JSON.parse(e.data);
  if (data.type === 'KERNEL_EVENT') {
    console.log('Kernel event:', data.payload);
  }
};
```

### 添加新功能

1. 在 `apps/web/src/components/` 创建新组件
2. 在 `App.tsx` 中添加新标签页：
   ```tsx
   {id: 'myfeature', icon: <Icon />, label: 'My Feature'}
   ```
3. 在渲染部分添加组件引用：
   ```tsx
   {activeTab === 'myfeature' && <MyFeature />}
   ```

---

## 🐛 故障排除

### 前端无法连接后端

**问题**: 浏览器控制台显示 API 请求失败

**解决**:
1. 检查后端是否运行：`curl http://localhost:3000/api/inspect`
2. 检查 Vite 代理配置是否正确
3. 确保防火墙未阻止端口 3000 和 5173

### WebSocket 连接失败

**问题**: Logs 页面没有实时更新

**解决**:
1. 检查后端日志是否显示 WebSocket 连接
2. 确保使用 `ws://` 而非 `wss://`（开发模式）
3. 检查浏览器 WebSocket 连接状态

### 构建失败

**问题**: `bun run build` 报错

**解决**:
1. 清理 dist 目录：`rm -rf apps/web/dist`
2. 重新安装依赖：`bun install`
3. 检查 TypeScript 错误：`bun run --filter @memohub/web build`

---

## 📚 进阶主题

### 自定义 Workspace 切换

Workspace 切换时，前端会：
1. 调用 `POST /api/workspace/switch`
2. 重新调用 `GET /api/inspect` 获取新 Workspace 的配置
3. 重新加载 Flow 图表

### 影子同步（Shadow Sync）

编辑 Flow 后，更改先保存到内存（Shadow），不会立即写入磁盘：
- 前端调用 `PUT /api/config/shadow`
- 后端更新内存中的 Config
- 可手动调用 `POST /api/config/commit` 提交到磁盘

---

## 🎯 最佳实践

1. **开发时**：使用 `bun run dev` 启动 Vite 开发服务器，支持热重载
2. **测试时**：使用生产构建（`bun run build`）验证真实性能
3. **调试时**：同时打开浏览器开发者工具和后端日志，对比请求响应
4. **部署时**：确保前端构建产物路径正确（`base: './'`）

---

**文档版本**: 1.0.0
**最后更新**: 2026-04-27
**维护者**: MemoHub 开发团队