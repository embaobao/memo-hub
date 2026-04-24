# Web Orchestration UI 任务清单 (Tasks)

## Phase 1: 基础设施与后端网桥 (Foundation)
- [ ] 1.1 初始化 `apps/web`：采用 Vite + React 19 + TypeScript + TailwindCSS
- [ ] 1.2 搭建 Ether UI 核心基础：配置深浅双色主题、iOS 级 Glassmorphism 样式类
- [ ] 1.3 增强 `apps/cli` API：基于 Fastify 挂载 REST 服务（处理配置、资产 API）
- [ ] 1.4 实现 WebSocket Trace 通道：将 `ObservationKernel` 事件广播至前端
- [ ] 1.5 实现“影子配置”内存同步逻辑：支持 `PUT /api/config/shadow`

## Phase 2: 可视化编排工作室 (Flow Studio)
- [ ] 2.1 引入 Reactflow：实现 JSONC 到画布节点/连线的双向转换
- [ ] 2.2 实现 Property Panel：根据 Tool Manifest 自动生成 Zod 校验表单
- [ ] 2.3 实现实时脉冲动画：根据 WS 信号触发节点呼吸/发光效果
- [ ] 2.4 实现跨 Workspace 切换器：带有 3D 转换动画的项目导航

## Phase 3: 全域资产与调试沙盒 (Asset & Debug)
- [ ] 3.1 实现 Command K 全局搜索栏：对接 LightRAG 检索流
- [ ] 3.2 实现记忆资产大盘：支持 Faceted 筛选与多选聚合
- [ ] 3.3 实现 Wiki 沉浸式预览：支持 Markdown 与实体关系图渲染
- [ ] 3.4 实现 CLARIFY 治理中心：提供 A/B Diff 视图与合并裁决
- [ ] 3.5 实现 MCP Agent Playground：内置 MCP Client 对话沙盒

## Phase 4: 交付与文档
- [ ] 4.1 编写 Web 使用手册：包含编排技巧与调试说明
- [ ] 4.2 进行全量 E2E 验证：模拟多空间高频编排场景
