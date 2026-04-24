# MemoHub Web UI 架构设计 (Design)

## Context
MemoHub 目前是一个基于流编排的个人记忆内核。我们需要构建一个 Web 界面来降低编排门槛，增强可观测性，并提供直观的记忆管理。

## Goals
- **实时编排**: 拖拽式 Flow 编辑，支持 JSONPath 自动映射。
- **动态追踪**: 节点级执行状态流式显示。
- **全域管理**: 跨轨道的记忆资产 Faceted Search。
- **极简设计**: 遵循 Linear/Vercel 风格，深度集成动画。

---

## Architecture

### 1. 技术栈 (Tech Stack)
- **Frontend**: Vite + React 19 + TailwindCSS。
- **Flow Engine**: Reactflow (处理 DAG 图渲染与交互)。
- **Animation**: Framer Motion (处理页面过渡与节点脉冲)。
- **State Management**: 
  - Zustand: 全局 UI 状态。
  - TanStack Query: 服务端数据同步。
## Architecture

### 1. 技术栈 (Tech Stack)
... (保持不变) ...

### 2. 核心模块设计

#### M1: Flow 画布 (Orchestrator Canvas)
- **Shadow Config (影子配置)**: 引入内存缓存层。编排更改立即作用于内核内存实例，支持“热预览”而无需同步写入磁盘。
- **Variable-Sync**: 自动识别 `$.nodes.xxx` 并建立视觉连线（Edges）。
- **Property-Panel**: 点击节点，侧边栏滑出 Zod 生成的配置表单。

#### M2: 跨 Workspace 聚合 (Workspace Aggregator)
- **Virtual Bus**: 支持在 UI 侧多选 Workspace。
- **Parallel Dispatch**: 检索请求并行发送至选中的所有 Workspace 内核。
- **Result Fusion**: 使用 `builtin:aggregator` 对跨空间结果进行去重与归一化评分。

#### M3: 实时可观测面板 (Live Trace)
... (保持不变) ...

---

## Decisions

### D1: 内存优先，后台持久化 (Memory-First Sync)
编排过程中的更改优先更新内存中的 Flow Registry。
- **理由**: 规避物理磁盘 IO 延迟，提供毫秒级交互响应。
- **机制**: 引入 `dirty` 状态，支持手动/自动触发 `flush-to-disk`。

### D2: 跨空间总线 (Cross-Workspace Bus)
- **理由**: 满足跨项目检索需求，同时保持物理存储的独立性与安全性。

### D2: 混合通讯模式 (REST + WS)
使用 REST 处理 CRUD，使用 WS 处理高频 Trace。
- **理由**: REST 易于测试和缓存；WS 适合实时反馈。

### D3: 采用 Zod-to-UI 自动表单
前端根据 Tool 的 `inputSchema` 自动生成属性编辑表单。
- **理由**: 减少前端开发量，新增 Tool 无需修改前端代码。

## Risks
- **[风险] 复杂流的布局**: 深度嵌套的流可能在画布上乱作一团。
  - **缓解**: 引入自动布局算法（如 dagre）。
- **[风险] 配置保存冲突**: CLI 和 Web 同时修改配置。
  - **缓解**: 后端引入文件监听（Watch）机制，Web 端在写前检查 hash。
