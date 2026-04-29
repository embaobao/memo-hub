# MemoHub 当前状态

最后更新：2026-04-29

## 已实现且本轮已核实的部分

- 主架构口径已切换到“统一记忆中枢”，CLI/MCP 不再注册或暴露 `track-*` 入口。
- CLI 当前对外命令是 `inspect`、`add`、`query`、`summarize`、`clarify`、`resolve-clarification`、`config`、`mcp-config`、`mcp-tools`、`mcp-status`、`mcp-logs`、`serve`。
- `serve` 是当前正式的 MCP 启动命令，`mcp` 是启动别名。
- MCP 当前推荐工具是 `memohub_ingest_event`、`memohub_query`、`memohub_summarize`、`memohub_clarify`、`memohub_resolve_clarification`、`memohub_config_get`、`memohub_config_set` 和 `memohub_config_manage`。
- MCP 资源入口为 `memohub://stats` 和 `memohub://tools`。
- 配置系统已接入新架构运行时，CLI/MCP 从 `storage`、`ai`、`mcp`、`memory` 配置解析存储路径、模型、日志、资源和视图能力。
- MCP stdio 启动不向 stdout 输出非 JSON 内容，服务状态和日志通过 `mcp-status`、`mcp-logs` 与 `memohub://stats` 维护。
- `cli add` 和 MCP `memohub_ingest_event` 复用统一运行时写入路径：event -> canonical event -> MemoryObject -> storage projection。
- `file_path`、`category` 作为统一记忆内容元数据保留。
- 仓库中散落在 `src/` 下的测试文件已全部迁移到各包自己的 `test/` 目录，并更新了对应引用。
- `MemoryObject` 与 `CanonicalMemoryEvent` 已成为产品层模型，Text2Mem 保留为内部执行协议。
- Query Planner 已提供 `self/project/global` 三层召回、默认 `self > project > global` 权重、命名视图和评分解释。
- 治理最小模型已落地：`raw/curated/conflicted/archived` 状态、`ClarificationItem`、`MemoryArtifact`、domain policy 和 archived 默认隐藏。
- Agent Memory Operation 已提供 `summarize/extract/annotate/clarify/review` 合同与 deterministic MVP，输出保留 input/output IDs、provider/model、confidence、review state 和 provenance。

## 当前真实接口面

### CLI

```bash
memohub inspect
memohub add "文本内容" --project memo-hub --source cli --category decision
memohub query "Hermes habits" --view agent_profile --actor hermes --project memo-hub
memohub summarize "Hermes 最近完成了查询链路收敛" --agent hermes
memohub clarify "项目约定存在冲突" --agent hermes
memohub resolve-clarification clarify_op_1 "以新架构为准" --agent hermes --project memo-hub
memohub config
memohub mcp-config
memohub mcp-tools
memohub mcp-status
memohub mcp-doctor
memohub mcp-logs --tail 50
memohub serve
```

开发态也可以直接运行源码入口：

```bash
bun apps/cli/src/index.ts inspect
bun apps/cli/src/index.ts add "文本内容"
bun apps/cli/src/index.ts query "当前项目上下文" --view project_context --project memo-hub
bun apps/cli/src/index.ts summarize "近期活动文本" --agent hermes
bun apps/cli/src/index.ts clarify "冲突文本" --agent hermes
bun apps/cli/src/index.ts resolve-clarification clarify_op_1 "澄清答案" --agent hermes --project memo-hub
bun apps/cli/src/index.ts mcp-tools
bun apps/cli/src/index.ts mcp-doctor
bun apps/cli/src/index.ts serve
```

### MCP

推荐工具：

- `memohub_ingest_event`
- `memohub_query`
- `memohub_summarize`
- `memohub_clarify`
- `memohub_resolve_clarification`

资源：

- `memohub://stats`
- `memohub://tools`

## 当前主要问题

### 1. 文档与代码曾长期漂移

历史文档里曾出现以下过度承诺：

- CLI 文档列出了 `list`、`delete`、`add-code`、`search-code`、`search-all` 等当前仓库并未提供的命令
- README 里写了 `ui`、`ingest`、`query` 等当前源码入口并不存在的命令
- MCP 文档里曾把规划态工具和当前已实现工具混写

本轮已把接入文档更新为“代码当前实际提供的接口”，并删除根目录重复 `guides/`。

### 2. 测试基础设施仍需继续统一

虽然测试文件位置已经收口到 `test/`，但测试运行方式还没有完全统一：

- 有的测试直接跑源码
- 有的测试隐含依赖工作区包解析
- 有的测试仍然依赖未完全收敛的 mock 和 runner

### 3. OpenSpec 提案需要持续归档

OpenSpec 是提案维护区，当前有效方向以 `unified-memory-hub-model` 和 `engineering-foundation-governance` 为准。完成实现后应及时同步规格并归档。

## 建议的下一步待办

1. 先把 `packages/config`、`packages/core`、`packages/builtin-tools` 的构建链修平。
2. 统一 test runner，明确是全部收敛到 `bun:test`，还是保留 `vitest` 并补依赖。
3. 将 `summarize/clarify` 从 explicit text MVP 接入已召回的 MemoryObject 集合和可选 Agent 后台任务。
4. 继续清理剩余文档里对未实现功能的描述。

## 本轮验证

已通过的针对性测试：

- `apps/cli/test/unit/memory-interface.test.ts`
- `packages/integration-hub/test/projector.test.ts`
- `apps/cli/test/unit/mcp/integration.test.ts`
- `apps/cli/test/unit/mcp/tools/query.test.ts`
- `packages/protocol/test/unit/governance.test.ts`
- `packages/core/test/unit/query-planner.test.ts`
- `packages/core/test/unit/agent-memory-operations.test.ts`

额外抽样通过：

- `packages/ai-provider/test/index.test.ts`
- `packages/protocol/test/index.test.ts`
- `packages/storage-flesh/test/index.test.ts`

当前边界说明：

- `MemoryKernel` 与内部处理切片仍存在于仓库中供包级测试和后续代码迁移参考，但不属于 CLI/MCP 业务链路。

## 工程化底座进度

已新增 `engineering-foundation-governance` OpenSpec 变更，并开始落地工程化门禁。

新增命令：

- `bun run check:test-layout`
- `bun run check:deps`
- `bun run docs:generate`
- `bun run docs:check`
- `bun run test:unit`
- `bun run test:integration`
- `bun run bench`
- `bun run check`
- `bun run check:release`

当前验证状态：

- `bun run check:test-layout`：通过。
- `bun run check:deps`：通过。
- `bun run docs:check`：通过。
- `bun run bench`：通过，当前单事件摄取 P99 约 `13.11ms`。
- `bun run typecheck`：通过。
- `bun run test:unit`：通过，当前 `106 pass / 0 fail` 的目标单元测试已覆盖协议、IntegrationHub、Core、CLI/MCP。
- `bun run test:integration`：通过，当前 `36 pass / 0 fail`。
- `bun run check:release`：通过，覆盖 `test layout`、`dependency boundaries`、`build`、`typecheck`、`unit tests`、`docs check`、`integration tests`、`api docs`、`generated docs`、`benchmarks`。

详见 [工程化底座](engineering-foundation.md)。
