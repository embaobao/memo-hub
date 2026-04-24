## Context

MemoHub 当前的硬编码架构（Tracks 内部封装逻辑，配置散落在各个类中）已无法满足企业级 AI Workflow 引擎的要求。
我们需要：
1. **统一根目录**：所有的配置、缓存、日志和数据必须有一个确定性的归属地。
2. **多模型适配**：不应仅局限于一个硬编码的 `EMBEDDING_URL`，应该像 Hermes 那样支持多 Providers 列表，并通过命名 Agent（如 `summarizer`, `embedder`）灵活调用。
3. **能力解耦**：轨道（Tracks）不再是存储与解析的混合体，而纯粹是一个流向调度器（Flow）。解析、向量化、存储本身应当成为独立的原子能力（Tools）。
4. **可观测与安全性**：执行流程必须有追踪标识（TraceID），敏感配置（如 API Key）不能在反射快照中明文暴露。

## Goals / Non-Goals

**Goals:**
- **XDG 标准化与统一架构**: 将 `~/.memohub/` 确立为核心工作空间。
- **构建独立配置系统**: `@memohub/config` 支持 JSONC 解析、Schema 驱动、版本自动升级和环境变量覆叠。
- **AI-Hub 模型层解耦**: 支持多端提供商配置（Providers）和基于角色的智能体（Agents）。
- **Manifest-Based 原子化 Tools**: 工具声明其强制的 `inputSchema` 和 `outputSchema` 契约，支持静态输入输出绑定（JSONPath）。
- **Flow Engine 调度流**: 彻底废弃手动 `registerTrack` 的类架构，让 Kernel 成为 `$.step.output` 上下文变量池和流程调度的主引擎。
- **诊断溯源 Traceability**: 每步执行生成唯一 SpanID 并提供结构化 NDJSON 追踪日志。

**Non-Goals:**
- 不涉及从本地存储引擎（LanceDB/CAS）向云端数据库的迁移。
- 本次重构暂时不提供真正的“运行时沙箱隔离”（Isolates / Worker Threads），而是通过 `SafeRunner` 做逻辑隔离和超时控制。
- 暂时不实现基于内存哈希的“语义缓存”或“纯函数结果重用”，但需在 Schema 层面预留 `pure` 和 `cache` 标识。

## Decisions

### D1: 统一根目录与 JSONC 配置规范 (Config Overhaul)
所有能力都配置于 `~/.memohub/memohub.json`：
- 使用 `comment-json` 解析带有注释的配置，使用 `Zod` 进行启动拦截验证。
- **脱敏机制**: 解析后的配置对象在对外反射前，基于特定黑名单（如包含 `key`, `secret`, `token` 的字段）自动执行掩码 `***` 处理。

### D2: AI-Hub 角色分离
抽象出 `Provider`（如 OpenAI 接口兼容服务）和 `Agent`（特定任务角色）：
```jsonc
"ai": {
  "providers": [{ "id": "local", "type": "ollama", "url": "http://localhost:11434" }],
  "agents": {
    "embedder": { "provider": "local", "model": "nomic-embed-text" }
  }
}
```
**理由**: 业务逻辑（如 Tool 需要总结文本）只需请求 `agent: "summarizer"`，不必关心其底层是哪个模型哪个 URL，彻底实现关注点分离。

### D3: 原子化工具契约与数据流编排 (Tools & Flow Engine)
抛弃黑盒的 Class 方法调用，全面拥抱 **“上下文映射池 (Context Pool)”**:
- **Tool Manifest**: 规定工具的 `id`, `type` (`builtin` 或 `extension`) 以及 `inputSchema`。
- **Flow Definition**:
  ```jsonc
  "flow": [
    { "step": "ast", "tool": "ast-parser", "input": { "content": "$.payload.text" } },
    { "step": "save", "tool": "builtin:cas", "input": { "blob": "$.ast.output" } }
  ]
  ```
**理由**: 这将 MemoHub 转化为了一个低代码（Low-Code）编排引擎，为未来的可视化连线做好了底层基础。

### D4: 执行隔离与结构化诊断 (Observation Kernel)
- 每次请求分配 UUID v4 作为 `TraceID`。
- 每个 Tool 的执行通过 `SafeRunner` 包裹，记录 `start_time`, `end_time`, `latency_ms`。
- 一旦发生异常（无论如何致命），不抛到顶层进程，而是终止该步骤流向 `on_fail` 策略，并将 Error Stack 写入 `~/.memohub/logs/trace.ndjson`。

## Risks / Trade-offs

- **[风险] 系统重构带来的迁移断层** → 缓解：由于配置完全改变，我们不在系统内实现复杂的 YAML 升级代码，而是废弃旧的配置文件逻辑，强制提示用户运行新版 `memohub config --init` 并提供旧数据的物理搬移脚本。
- **[性能权衡] Zod Schema 校验损耗** → 缓解：只在启动时对整个 JSON 做全局校验；运行时的 Tool Schema 验证允许开关控制（生产环境可能只通过类型系统而非运行时）。
- **[学习曲线] 配置复杂度上升** → 缓解：提供 `getMetadata()` / `inspect()` API 快速反射出工具的要求，供用户或前端使用；核心仓库默认提供一套开箱即用的 JSONC 模板。
