## Why

MemoHub 的第一条真实接入链路必须先让 Hermes 完成“纯记忆长期记忆闭环”。当前 CLI/MCP 已具备写入、查询、日志、渠道治理、dry-run 清理等基础能力，但对 Hermes 来说仍然偏工程接口：它需要理解 MemoHub 的命令、MCP 工具、字段挂载和治理顺序，体验不像一个可直接替换内置记忆的长期记忆系统。

本变更的核心目标是把 Hermes 作为第一个正式 Connector 接入 MemoHub，并固化后续其他 Agent / IDE / GitLab / 代码分析入口可复用的范式：

```text
Connector -> Channel -> Memory
```

- `Connector` 是外部接入形态，例如 Hermes 官方 memory provider plugin、CLI、MCP、IDE、GitLab。
- `Channel` 是运行身份和上下文挂载，例如 actor、source、project、session、purpose、test/primary。
- `Memory` 是统一记忆对象，例如偏好、习惯、近期活动、项目事实、澄清结果，后续再扩展代码记忆。

本提案不再引入额外业务抽象。`integration-hub` 只作为 Memory 内部事件归一、投影和写入实现细节，不作为外部接入层概念继续扩散。

## What Changes

- 建立 Hermes 官方 memory provider plugin 作为 `Hermes Connector`，完整对齐官方插件协议。
- 将 Hermes plugin 资产随 `memohub` CLI 一起发布，作为 MemoHub 正式安装产物的一部分。
- 新增 `memohub hermes install|doctor|uninstall`，统一负责 Hermes 接入安装、状态检查和卸载。
- 将 Hermes plugin 资产复制到 `~/.memohub/integrations/hermes/`，再由 Hermes 用户目录使用软链接消费。
- 将 Hermes Connector 最低 Python 版本要求降到 `3.9`，保证 Hermes 当前默认环境可直接接入。
- 抽出 `packages/channel`，让 channel registry 不再放在 `apps/cli`。
- 增加 `packages/memory` 作为统一 Memory 业务入口，对外承接 read/write/list/clarify/logs 等高层能力，内部可复用现有 protocol、integration-hub、storage 能力。
- 将 CLI 和 MCP 在架构定位上归类为 Connector，短期保持在 `apps/cli`，后续迁移到 `connectors/cli`、`connectors/mcp`。
- 在 `connectors/hermes` 下引入 Python + uv，只用于 Hermes 官方插件工程与协议测试，不污染 TypeScript 核心运行时。
- 固化 Hermes 首次接入链路：setup -> initialize/open channel -> prefetch -> sync_turn -> recall/list -> logs -> test dry-run clean。
- 固化 Hermes 写入类型：preference、activity、project_fact、clarification。
- 固化 Hermes 读取体验：先 actor 自己，再项目，再全局；默认输出可读摘要，不要求 Hermes 理解底层对象结构。
- 明确测试写入统一使用 `purpose=test`，清理支持按 actor/source/project/purpose/channel dry-run 和确认执行。

## Capabilities

### New Capabilities

- `connector-hermes-memory-provider`
  - MemoHub 作为 Hermes 官方 memory provider plugin 的接入能力。
- `channel-registry-core`
  - 独立 channel 包，提供注册、恢复、当前 channel、状态、列表和关闭能力。
- `memory-core-entry`
  - 独立 Memory 业务入口，提供统一写入、查询、列表、澄清、日志和清理调用边界。
- `hermes-pure-memory-loop`
  - Hermes 长期记忆闭环：偏好、习惯、近期活动、项目事实、澄清结果和治理验证。
- `connector-governance-pattern`
  - 为后续 IDE、GitLab、Gemini、Codex 等 Connector 提供统一接入范式。

### Modified Capabilities

- `cli-connector`
  - CLI 不再被视为业务核心层，只是人工和脚本接入 Connector。
- `mcp-connector`
  - MCP 不再被视为业务核心层，只是 Agent 接入 Connector。
- `channel-management`
  - channel registry 从 CLI app 下沉到独立包，供 CLI、MCP、Hermes plugin 共享。
- `memory-read-experience`
  - list/query/prefetch 输出更贴近“记忆资产”视角，而不是底层对象转储。

## Scope

本提案包含：

- Hermes 官方 memory provider plugin 的完整协议实现规划。
- Connector、Channel、Memory 三层目录和包边界调整。
- Hermes 纯记忆写入、读取、日志、清理、治理闭环。
- Hermes 官方固定目录安装链路：`~/.hermes/plugins/memohub -> ~/.memohub/integrations/hermes/plugin`。
- CLI/MCP 与 Hermes Connector 能力一致性要求。
- 接入文档、skill、验证脚本和测试规范更新。

本提案不包含：

- 旧向量库兼容迁移。
- Git、AST、依赖图、私有 npm 源、代码资产层的具体实现。
- 大规模 LLM 自动总结 Agent 编排。
- 多存储引擎重构。现阶段 storage 可继续复用现有实现，边界先收敛。
- Hermes provider 选择状态的私有内部配置直写。最终激活仍由 `hermes memory setup` 完成。

## Impact

预计主要影响：

- 新增 `connectors/hermes/`。
- 新增 `packages/channel/`。
- 新增 `packages/memory/`。
- 调整 `apps/cli` 对 channel registry 和 memory 入口的依赖。
- 更新 `apps/cli/src/interface-metadata.ts`，保证 CLI/MCP 对外描述同步。
- 更新 `apps/cli/package.json` 发布资产范围，确保 Hermes plugin 资产随 CLI 一起发。
- 更新 `docs/integration/hermes-guide.md`、`docs/architecture/business-workflows.md`、`docs/development/project-structure.md`、`skills/memohub/SKILL.md`。
- 后续可逐步把 `apps/cli` 拆成 `connectors/cli` 和 `connectors/mcp`，但不阻塞 Hermes 第一条闭环。
