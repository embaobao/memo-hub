# AGENT.md - MemoHub v1 开发规范 (Revised)

本文档定义 MemoHub v1 项目的开发规范和规则，所有协作 AI Agent 必须严格遵守。

---

## 🎯 开发原则 (V1.0.0)

### 1. 流编排优先 (Flow-Driven First)
- ✅ 核心业务逻辑应通过 `FlowEngine` 编排。
- ✅ 轨道 (Tracks) 的执行路径必须定义在 `config.jsonc` 的 `flows` 中。
- ✅ 严禁在 `MemoryKernel` 内部硬编码业务逻辑。

### 2. 原子工具解耦 (Decoupled Tools)
- ✅ 所有的原子功能（CAS, Vector, AST）必须放在 `packages/builtin-tools` 中。
- ✅ 核心包 `packages/core` 不得依赖 `builtin-tools`，必须通过 `ToolRegistry` 进行反向注册。
- ❌ 禁止引入循环依赖。

### 3. Text2Mem 协议一致性
- ✅ 所有外部请求必须转化为标准的 `Text2MemInstruction`。
- ✅ 使用 `IKernel.dispatch` 作为唯一入口。
- ✅ 必须透传 `traceId` 以保证 Web UI 的实时脉冲 (Pulsing) 功能正常。

---

## 🎨 UI/UX 规范 (Ether UI)

### 1. 审美准则
- **硬核极简 (Hardcore Minimalism)**: 仅保留必要的交互，背景必须为全黑 (#000)。
- **玻璃拟态 (Glassmorphism)**: 容器使用 `backdrop-blur-3xl` 和极细边框 (`border-white/5`)。
- **弹性反馈 (Spring Physics)**: 使用 `framer-motion` 进行 0.6s+ 的物理级平滑过渡。

---

## 📝 协作指令 (针对 AI Agent)

### 1. 解释先行 (Explain Before Acting)
- 在调用任何 `write_file` 或 `replace` 工具前，必须提供至少一行中文解释，阐述该操作的目的。

### 2. 闭环验证 (Validation Mandate)
- 修改代码后，必须至少执行一次 `bun run build` 或对应的集成测试。
- 修改 UI 后，必须手动或通过脚本核实 `apps/web/dist` 产物的有效性。

---

## 🔧 TypeScript / 构建规范

- **运行时**: 强制使用 `Bun`。
- **路径别名**: 统一使用 `@memohub/*` 引用内部包。
- **类型安全**: 严格遵守 Zod Schema 验证输入输出。

---

## 🚀 轨道注册矩阵 (V1 现状)

| 轨道 ID | 描述 | 状态 | 核心工具 |
| :--- | :--- | :--- | :--- |
| `track-insight` | 事实与偏好沉淀 | ✅ Active | `vector`, `entity-linker` |
| `track-source` | 代码 AST 深度记忆 | ✅ Active | `code-analyzer`, `graph-store` |
| `track-stream` | 会话原始记录流 | ✅ Active | `cas`, `timestamp-index` |
| `track-wiki` | 经过治理的真理库 | ✅ Active | `version-manager`, `relation-graph` |

---

**版本**: 1.0.0  
**最后更新**: 2026-04-25  
**维护者**: MemoHub 系统架构组
