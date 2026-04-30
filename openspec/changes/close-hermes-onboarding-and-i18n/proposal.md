## Why

MemoHub 今天的首要目标不是继续扩展能力面，而是把 Hermes 的首次真实接入闭环做扎实，并把 CLI 的基础体验和治理能力收口到可以长期维护的状态。

当前仍有四个直接阻塞真实接入的问题：

- `system.lang=auto` 在 macOS 中文系统下不稳定，当前实现过度依赖 shell 环境变量，容易出现“系统是中文、CLI 却显示英文”。
- Hermes 已经可以通过 MCP/CLI 写入和查询，但“治理自己的渠道与记忆”还没有提升为一等能力；现有清理和治理操作仍偏向底层 `channelId`，而不是 Agent 自治理语义。
- 测试和真实接入写入还没有完全按 `test` 渠道/用途隔离，后续排障、清理和回归验证的边界不够清晰。
- 现有 CLI 对人工用户已经更可读，但标准业务链路、问题定位链路和 Hermes 自治理链路还没有被固化成统一入口与文档。
- 如果继续为了旧存量库兼容把治理和接入逻辑做成分支叠加，MemoHub 会再次回到“底层存储工具”而不是“统一记忆中枢”的路径上。

如果不先把这些问题收口，后续继续做 adapter、GitLab、依赖分析、TUI 或多 Agent 协同时，会不断受到接入流程不稳定、语言表现不一致和治理边界不清晰的影响。

## What Changes

- 修复 `system.lang=auto` 的语义和实现，明确 `zh | en | auto`，并让 `auto` 优先尊重 macOS 系统语言偏好，而不是仅依赖 shell locale。
- 把 Hermes 的“自治理自己的渠道与记忆”提升为正式能力：Hermes 应能查看、恢复、筛选、测试、清理自己归属的渠道，而不是被迫拿单个 `channelId` 低层操作。
- 固定采用 `actor-first` 方案：`actor` 是默认治理主体，`agent` 只是执行实例；本轮直接重命名 channel registry、CLI、MCP 和 session context 的内部字段，不保留旧 `ownerAgentId` 兼容层。
- 统一上下文绑定模型，解决不同来源对同一项目、仓库、分支、session、文件路径命名不一致的问题；治理默认按高层主体聚合，存储保留更细绑定键。
- 固化测试渠道规范：所有测试/验证写入默认使用 `purpose=test` 或等价测试用途，并支持按 actor / project / purpose 进行 dry-run 和清理验证。
- 收口 CLI 的标准业务链路表达：`channel -> add/query -> clarification -> logs -> data -> mcp/config` 成为统一推荐链路，`inspect` 和 `summarize` 下沉为辅助能力。
- 新增最小诊断/追踪治理面，用于让 Hermes 或人工快速定位“我现在绑定了哪些渠道、最近写了什么、最近查了什么、日志里发生了什么”。
- 对 `rebuild-schema` 仅保留统一治理接口，不引入旧向量库兼容分支逻辑。旧存量库的迁移/适配交给后续 adapter 或接入层处理，不污染当前新架构。
- 明确治理边界：本变更只做“够用的自治理能力”，不把 channel registry 演化成第二套复杂后台系统。
- 明确写入规则：任何记忆写入都必须显式挂载渠道，或继承当前已绑定渠道；不再鼓励自由写入未挂载记忆。
- 明确字段分层：`actor` 是默认治理主体，`agent` 是执行实例，`session/channel` 是运行挂载，`project/repo/workspace/task/file/git/workflow` 属于上下文绑定层。
- 不做兼容性保留：旧命令参数、旧 MCP 入参、旧 registry 字段和旧文档术语一次性切换到新模型。

## Capabilities

### New Capabilities

- `hermes-onboarding-closure`: 固化 Hermes 首次真实接入、主渠道恢复、测试渠道验证、写入/查询/日志/清理的标准闭环。
- `cli-i18n-auto-resolution`: 管理 `system.lang=auto` 的平台语言探测、默认语言回退和 CLI/MCP 输出一致性。

### Modified Capabilities

- `app-cli-entry`: 需要新增或收口 Agent 自治理渠道、测试渠道清理选择器、可读诊断入口和标准业务链路帮助顺序。
- `documentation-governance`: 需要同步 Hermes 接入、测试渠道使用、语言配置和问题定位流程。
- `layered-memory-query`: 需要保证 Hermes 写入后可稳定通过 `agent_profile/recent_activity/project_context/coding_context` 读回，并提供更清晰的排障说明。

## Impact

- CLI 命令面需要加强“按 actor / purpose / project 治理”的选择器能力，减少对单个 `channelId` 的依赖。
- CLI/MCP/adapter 后续都需要按统一上下文绑定模型写入，避免 `projectId`、`repo`、`workspace`、`branch`、`filePath` 等字段各自生成规则不一致。
- Hermes 接入文档、skill 和 `memohub://tools` 需要明确表达“MemoHub 是 Hermes 可自治理的记忆中心”。
- 测试和验证流程需要统一使用 `test` 渠道或等价测试用途，并支持后续安全清理。
- 本提案不处理旧向量库兼容路径；只保留统一的新架构治理接口与诊断提示。
- 本提案明确 channel 只用于治理、绑定、追踪和清理，不作为 visibility 或共享边界。
- 本提案要求 channel registry 状态模型、MCP session context 和治理选择器全部 actor 化，不保留字段别名或迁移兼容逻辑。
