# MemoHub Architecture Overview (v1.1.0)

MemoHub 采用 **多轨道动态矩阵架构 (Multi-Track Dynamic Matrix)**，并在 V1.1 版本完成了向**极简工业级内核**的重构。系统摒弃了脆弱的 JSONC 流程编排，转向基于**状态机**和**极简依赖注入 (DI)** 的纯代码驱动架构。

---

## 🏗️ 核心架构图

```text
┌──────────────────────────────────────────────────────────┐
│              Client Layer (CLI / MCP / Daemon)           │
└───────────────┬──────────────────────────┬───────────────┘
                │ Text2Mem Protocol        │
┌───────────────▼──────────────────────────▼───────────────┐
│                    Memory Kernel                         │
├──────────────────────────────────────────────────────────┤
│ State Machine Dispatcher  |    Tool Registry (Decoupled) │
├──────────────────────────────────────────────────────────┤
│   Track Insight  |  Track Source  | Track Stream | Wiki  │
└──────────────────────────┬───────────────────────────────┘
                           │
             (Manual DI: Soul, Flesh, AI)
                           │
┌──────────────────────────▼───────────────────────────────┐
│                   Storage Layers                         │
├──────────────────────────┬───────────────────────────────┤
│   CAS (storage-flesh)    │   LanceDB (storage-soul)      │
└──────────────────────────┴───────────────────────────────┘
```

---

## 🧩 关键工程化组件详解

### 1. Observability (统一可观测性)
在 `protocol` 层定义了“宪法级”的统一错误码（如 `ERR_TRACK_NOT_FOUND`, `ERR_CAS_CORRUPT`, `ERR_AI_TIMEOUT`）。
无论是 CLI 报错、日志打印，还是 MCP 返回给外部 Agent，均使用这套标准错误对象，消除了字符串报错带来的不确定性。

### 2. State Machine (状态机驱动的指令流)
一条 `Text2MemInstruction` 进入 Kernel 后，其生命周期被严格追踪：
`RECEIVED` -> `PARSED` -> `HASHED` -> `INDEXED` -> `COMMITTED`
如果中间出现异常，状态流转会记录在 `Text2MemResult.meta.state` 中，确保操作的原子性与可恢复性。

### 3. Lightweight DI (极简依赖注入)
摒弃了复杂的 DI 框架。在 CLI/Daemon 启动时，手动初始化 `ContentAddressableStorage` (Flesh)、`VectorStorage` (Soul) 和 `OllamaAdapter` (AI)，并通过 `kernel.setComponents()` 显式注入。这使得内核与具体的基础设施实现完全物理隔离。

### 4. Testability (接口驱动的自动化测试)
每一个 `track-*` 插件都自带一套标准测试（如 `track-insight/src/index.test.ts`）。
通过注入 `MockCAS`, `MockVectorStorage`, `MockEmbedder`，在无任何真实外部依赖的情况下，输入 Mock 负载，即可预期输出确定的 Hash 与 Vector。这是保证动态注册制不崩盘的基石。

### 5. Track-Tool Direct (代码级直接编排)
废弃了原有的 `FlowEngine` 与 JSONC 编排逻辑。
现在，轨道内部拥有自主权，通过 `this.kernel.getTool('builtin:cas').execute(...)` 直接获取并调用原子工具，利用 TypeScript 的强类型确保逻辑严密。

---

## 📜 核心工作流：从启动到落盘

1. **Boot**: `apps/cli/src/index.ts` 读取 `config.jsonc`。
2. **DI**: 实例化 `Soul` 和 `Flesh`，注入到 `MemoryKernel`。
3. **Register**: `ToolRegistry` 注册原子工具，`Kernel` 挂载业务轨道。
4. **Dispatch**: 接收 `ADD` 指令，状态变为 `RECEIVED`。
5. **Execute**: 轨道内部直接调用 `builtin:cas` 计算文本 Hash，调用 `builtin:embedder` 生成向量。
6. **Commit**: 调用 `builtin:vector` 落盘，状态变为 `COMMITTED`，返回包含 `traceId` 和延迟的响应。

---

## 🎨 设计哲学

1. **代码即逻辑**: 拒绝外部 JSON 编排，业务逻辑必须在 TS 源码中强类型闭环。
2. **灵肉分离**: 内容与索引解耦，CAS 确保数据物理去重，LanceDB 确保毫秒级召回。
3. **全栈单出口**: 基于 Bun 的 `build --compile` 与 `external` 机制，实现包含所有工作区源码的单二进制分发。

---

**版本**: 1.1.0  
**更新日期**: 2026-04-25  
**维护者**: MemoHub Core Team
