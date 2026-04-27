# MemoHub Architecture Overview (v1.0.0)

MemoHub 采用 **多轨道动态矩阵架构 (Multi-Track Dynamic Matrix)**，是一个基于“流编排”逻辑的 Agent 记忆操作系统。

---

## 🏗️ 核心架构图

```
┌──────────────────────────────────────────────────────────┐
│             Ether UI (React Flow Console)                │
├──────────────────────────────────────────────────────────┤
│    Studio      |     Sandbox      |      Matrix          │
└───────────────┬──────────────────────────┬───────────────┘
                │                          │
        (WebSocket/REST)           (CLI / MCP)
                │                          │
┌───────────────▼──────────────────────────▼───────────────┐
│                    Memory Kernel (Orchestrator)          │
├──────────────────────────────────────────────────────────┤
│  Flow Engine (n8n Style)  |    Tool Registry (Decoupled) │
├──────────────────────────────────────────────────────────┤
│   Track Insight  |  Track Source  | Track Stream | Wiki  │
└──────────────────────────┬───────────────────────────────┘
                           │
                 (Text2Mem Protocol)
                           │
┌──────────────────────────▼───────────────────────────────┐
│                   Storage Layers (Flesh & Soul)          │
├──────────────────────────┬───────────────────────────────┤
│   CAS Content Store      │   LanceDB Vector Storage      │
└──────────────────────────┴───────────────────────────────┘
```

---

## 🧩 关键组件详解

### 1. Memory Kernel (调度内核)
内核是 MemoHub 的大脑。在 V1.0.0 中，它已进化为**纯粹的调度器**：
- **不持有具体逻辑**: 所有记忆操作通过 `FlowEngine` 执行。
- **事件驱动**: 继承 `EventEmitter`，实时发射 `dispatch` 事件，驱动 UI 脉冲动画。
- **插件化注册**: 通过 `ToolRegistry` 挂载原子工具，通过 `registerTrack` 挂载业务轨道。

### 2. Flow Engine (编排引擎)
这是 V1 的核心突破。它允许通过 `config.jsonc` 动态定义记忆流水线：
- **原子工具调用**: 如 `builtin:cas`, `builtin:vector`, `builtin:code-analyzer`。
- **多级跳跃**: 一个 ADD 操作可以被编排为：`提取实体 -> 写入 CAS -> 写入向量库 -> 建立关联`。
- **影子同步**: UI 修改的 Flow 会立即加载到内核内存中（Shadow Config），无需重启。

### 3. Decoupled Registry (解耦注册表)
- **Built-in Tools**: 位于 `packages/builtin-tools`，与内核物理隔离，避免循环依赖。
- **Tracks**: 四大核心轨道已全面就绪：
  - `track-insight`: 逻辑与事实沉淀。
  - `track-source`: 源代码 AST 深度解析。
  - `track-stream`: 原始会话流记录。
  - `track-wiki`: 经过治理的真理库。

### 4. Storage Architecture (灵肉分离)
- **Flesh (CAS)**: 基于 `packages/storage-flesh`，确保存储的物理去重。
- **Soul (Vector)**: 基于 `packages/storage-soul` (LanceDB)，提供毫秒级的语义召回能力。

---

## 📜 Text2Mem 协议

所有组件通信严格遵循 Text2Mem 协议，该协议定义了 12 个原子操作（如 `ADD`, `RETRIEVE`, `DELETE`, `VERSION` 等）。
- **统一接口**: 无论后端是代码还是文档，前端只需发送标准的 `Instruction`。
- **元数据透传**: 自动携带 `traceId` 和 `trackId`，实现全链路链路追踪。

---

## 🎨 设计哲学

1. **灵肉分离**: 内容与索引解耦，确保数据的一致性与可移植性。
2. **编排优先**: 拒绝硬编码，逻辑交给 Flow。
3. **硬核极简**: UI 必须在提供强大功能的同时，保持 iOS 级的视觉纯净度。

---

**版本**: 1.0.0  
**更新日期**: 2026-04-25  
**维护者**: MemoHub Core Team
