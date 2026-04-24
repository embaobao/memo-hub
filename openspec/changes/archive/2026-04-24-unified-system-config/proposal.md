## Why

MemoHub 需要从“零散的脚本工具”进化为“工业级记忆操作系统内核”。
当前的配置（YAML）和架构（硬编码的 Track 组装）在面对未来复杂的 Web 端可视化编排、多 Agent 集成、以及复杂的上下文数据传递时，显得捉襟见肘。
为了实现“配置即流程”、“能力即插即用”以及“全链路可观测”，我们需要对配置系统、能力抽象（Tools & AI）和调度流（Flow）进行一次彻底的重构。

## What Changes

- **统一存储与 XDG 规范**: 所有配置、数据、插件默认存放于 `~/.memohub/`。
- **JSONC 与强类型契约**: 配置文件转向 `memohub.json`（支持注释），使用 Zod 进行 Schema 校验与配置版本化 (`$schema`, `version`)。
- **AI-Hub 多供应商架构**: 废弃硬编码的单模型调用，配置层支持注册多个 Providers（OpenAI, Ollama 等）并抽象为命名的 Agents（如 `embedder`, `summarizer`）。
- **工具原子化与契约化 (Manifest)**: 所有的能力（包括内置的存储、向量化）抽象为独立的 Tools，强制声明 `inputSchema` 和 `outputSchema`。
- **流式编排 (Track as Flow)**: 轨道不再是固化的类，而是由原子 Tools 组成的逻辑管道，通过 JSONPath (`$.step.output`) 实现上下文变量传递。
- **安全与可观测性**: 实现配置层凭据脱敏（Secret Masking），并为每个 Flow 步骤引入 TraceID 和结构化追踪日志。
- **BREAKING**: 废弃原有的 `config.yaml` 格式、硬编码的 `MemoryKernel` 注册逻辑以及原有的 `Router`。

## Capabilities

### New Capabilities
- `config-kernel`: JSONC 解析、多源合并、Zod 校验、凭据脱敏与跨平台路径归一化。
- `ai-hub`: 多供应商管理与按名调用的 Agent 角色抽象。
- `tool-registry`: 基于 Manifest (I/O Schema) 的工具注册中心。
- `flow-engine`: 负责上下文池（Context Pool）管理、变量映射与步骤执行的调度器。
- `observation-kernel`: 提供 TraceID 生成、沙箱/异常隔离与结构化诊断日志。

### Modified Capabilities
- `app-cli-entry`: 移除内部 `loadConfig` 和 `createKernel` 的硬编码装配，改为声明式加载。

## Impact

- **架构颠覆**: 系统从“命令式装配”完全转向“声明式数据流驱动”，为未来的 Web 可视化节点连线打下底层基础。
- **核心库**: `packages/core` 将被大幅重构，剥离配置逻辑，引入 Flow 调度引擎。
- **包结构**: 新增 `packages/config`，并规划 `tools/` 目录用于存放原子工具包。
- **开发者体验**: 错误将在启动时通过 Schema 校验被拦截；运行时异常将被限制在单个 Tool 步骤内，不致系统崩溃。
