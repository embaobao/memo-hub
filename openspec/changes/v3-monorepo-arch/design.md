## Context

MemoHub 当前是一个单体 TypeScript 项目，核心代码在 `src/` 目录下：
- `src/core/` — 配置管理 (config.ts)、嵌入器 (embedder.ts)、CAS 存储 (cas.ts)
- `src/lib/` — GBrain 和 ClawMem 两个硬编码的记忆轨道类
- `src/pipeline/` — 已有管道引擎 (engine.ts)、轨道注册表 (track-registry.ts)、路由器 (router.ts)、事件总线 (event-bus.ts)
- `src/librarian/` — 已有治理模块 (distill.ts, ingest-git.ts, runtime.ts)
- `src/cli/` — Commander.js CLI 入口
- `mcp-server/` — 独立的 MCP Server

当前架构已有管道和注册机制的雏形 (pipeline/)，但轨道仍然是硬编码的，协议层缺失，存储层未分离。本次重构将利用已有的管道基础，将其提升为正式的协议和内核层。

**技术栈**: Bun runtime、TypeScript、LanceDB (向量存储)、Commander.js (CLI)、MCP SDK、Tree-sitter (AST 解析)、Zod (验证)。

## Goals / Non-Goals

**Goals:**
- 建立 Bun Workspace Monorepo 结构，实现包级别的物理隔离
- 定义 Text2Mem 五元 JSON 契约，作为所有操作的统一协议
- 实现灵肉分离：storage-flesh (CAS 物理文件) + storage-soul (LanceDB 向量索引)
- 实现 MemoryKernel 调度总线，支持轨道插件的动态注册与卸载
- 迁移现有 GBrain → track-insight、ClawMem → track-source
- 将 AI 适配器抽象为可插拔接口，支持运行时切换
- 为异步治理 (librarian) 建立独立包，实现 Sleeptime 模式

**Non-Goals:**
- 不实现 Web UI (apps/web 预留但不实现)
- 不实现 track-stream (会话上下文轨道) — 仅预留目录结构
- 不重写 Tree-sitter 相关的解析逻辑 — 复用现有 text-entities.ts 和 AST 工具
- 不改变底层数据格式 (仍然是 768 维向量 + 余弦距离)
- 不做向后兼容的 CLI 命令别名 — v3 作为新的主要版本

## Decisions

### D1: Bun Workspace Monorepo (非 Turborepo/Nx)

**选择**: 使用 Bun 原生 workspace 管理，不用 Turborepo 或 Nx。

**理由**: 项目已使用 Bun runtime，Bun workspace 原生支持即可满足需求。包数量有限 (~12 个)，不需要复杂的构建编排。避免引入额外依赖和配置复杂度。

**替代方案**: Turborepo (过重)、pnpm workspace (不使用 pnpm)。

### D2: Text2Mem 五元契约作为协议核心

**选择**: 所有内存操作通过 `{op, trackId, payload, context, meta}` 五元 JSON 契约表达。

**理由**: 这将协议与实现完全解耦。只要 op 和 trackId 的定义不变，内部存储、索引、AI 模型都可以独立升级。Agent 通过 MCP 调用时也是操作这份契约，无需了解内部实现。

**12 原子操作**: ADD, RETRIEVE, UPDATE, DELETE, MERGE, CLARIFY, LIST, EXPORT, DISTILL, ANCHOR, DIFF, SYNC

### D3: 灵肉分离 — 双存储引擎

**选择**: storage-flesh (CAS) 存储原始内容为物理文件，storage-soul (LanceDB) 仅存索引和向量。

**理由**: 借鉴 ReMe 的"文件即记忆"理念。原始文本以 `.memohub/blobs/{sha256}` 存储，用户可直接打开文件查看和裁决冲突。LanceDB 仅存储元数据和向量索引，保持轻量。向量索引的 hash 字段指向 CAS blob，实现双向关联。

**替代方案**: 全部存在 LanceDB (无法直接查看)、Git 对象存储 (过于复杂)。

### D4: 轨道插件通过 ITrackProvider 接口注册

**选择**: 每个轨道是一个独立的 package，通过 `ITrackProvider` 接口向 MemoryKernel 注册。

```typescript
interface ITrackProvider {
  id: string;
  name: string;
  initialize(kernel: IKernel): Promise<void>;
  execute(instruction: Text2MemInstruction): Promise<any>;
}
```

**理由**: 允许第三方开发轨道插件。轨道只依赖 protocol 包（零外部依赖），不依赖具体存储或 AI 实现。通过 kernel 注入所需的能力。

### D5: AI 适配器插件化

**选择**: `IEmbedder` 和 `ICompleter` 接口，首个实现为 Ollama 适配器。

**理由**: 当前仅使用 Ollama，但接口允许未来接入 OpenAI、Azure、本地模型等。适配器通过 kernel 的配置系统加载。

### D6: 治理层异步执行 (Sleeptime 模式)

**选择**: librarian 作为后台守护进程运行，在系统空闲时执行语义去重、冲突检测、Wiki 化改写。

**理由**: 借鉴 Letta 的 Sleeptime 哲学。Agent 交互时追求极低延迟（仅 RETRIEVE/ADD），复杂治理操作全部放在后台。发现冲突时通过 CLARIFY 指令通知用户或 Agent。

### D7: 数据迁移策略 — 一次性脚本

**选择**: 提供独立的数据迁移脚本，将现有 GBrain/ClawMem LanceDB 数据导入新 schema。

**理由**: v3 是破坏性变更，一次性迁移比在线双写更简单可靠。迁移脚本读取旧表 → 按 hash 存入 CAS → 按新 schema 写入 storage-soul。

### D8: 包依赖方向严格单向

**选择**: 依赖方向为 `apps → tracks → core → protocol`，`core → {storage-*, ai-provider}`。

**理由**: 防止循环依赖，确保 protocol 包零外部依赖（纯类型定义）。tracks 只依赖 protocol 接口，不依赖具体存储实现（通过 kernel 注入）。

## Risks / Trade-offs

**[风险] Monorepo 构建复杂度增加** → 缓解：Bun workspace 原生支持增量构建；包数量有限 (~12 个)，构建图简单。每个包独立 `tsconfig.json`，支持并行构建。

**[风险] 数据迁移可能导致数据丢失** → 缓解：迁移脚本先备份原数据库；提供 dry-run 模式；迁移后校验记录数和向量一致性。

**[风险] 轨道插件接口设计不足，需要频繁变更** → 缓解：参考 Text2Mem 的 12 原子操作设计接口，覆盖增删改查合并澄清等全场景。v3 阶段仅实现 2 个内置轨道，验证接口设计。

**[风险] CAS 物理文件管理复杂（大文件、垃圾回收）** → 缓解：v3 阶段仅存储文本内容（平均 < 10KB），不做文件分块。后续版本可引入 Git LFS 风格的大文件策略。

**[权衡] 不做向后兼容 CLI 命令** → v3 作为主要版本升级，用户需更新命令行用法。通过迁移指南和 CHANGELOG 降低升级成本。

**[风险] 异步治理 (librarian) 的触发时机难以确定** → 缓解：v3 阶段采用手动触发 + 定时器模式，不实现复杂的系统空闲检测。
