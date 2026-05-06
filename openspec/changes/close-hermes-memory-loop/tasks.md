## 1. Proposal Convergence

- [x] 1.1 将提案主链路收敛为 `Connector -> Channel -> Memory`。
- [x] 1.2 删除 Hermes 额外中间层等旧业务概念。
- [x] 1.3 明确 `integration-hub` 只作为 Memory 内部归一和投影实现细节。
- [x] 1.4 明确 Hermes 是第一个真实 Connector，CLI/MCP 也是 Connector。
- [x] 1.5 明确本提案不处理旧向量库兼容、Git、AST、代码资产层。

## 2. Package And Directory Refactor Plan

- [x] 2.1 新增 `packages/channel`。
- [x] 2.1.1 从 `apps/cli/src/channel-registry.ts` 迁移 channel registry 实现。
- [x] 2.1.2 提供 `channel-types.ts`、`channel-defaults.ts`、`channel-registry.ts`。
- [x] 2.1.3 迁移 channel registry 单测到 `packages/channel/test/`。
- [x] 2.1.4 更新 CLI/MCP 引用，禁止 CLI app 内再维护 channel registry 业务实现。
- [x] 2.2 新增 `packages/memory`。
- [x] 2.2.1 提供 `MemoryService` 作为 read/write/list/clarify/logs/clean 统一入口。
- [x] 2.2.2 内部复用现有 protocol、integration-hub、storage 实现。
- [x] 2.2.3 将 `integration-hub` 从外部接入概念降级为 Memory 内部实现依赖。
- [x] 2.2.4 增加 Memory service 单测，覆盖写入、查询、列表、澄清、日志。
- [x] 2.3 保留 `apps/cli` 当前构建位置，但将其架构定位改为 CLI Connector。
- [x] 2.4 保留 MCP 当前实现位置，但将其架构定位改为 MCP Connector。
- [x] 2.5 更新 `docs/development/project-structure.md`，固化新目录职责。

## 3. Hermes Connector Scaffold

- [x] 3.1 新增 `connectors/hermes`。
- [x] 3.1.1 增加 `pyproject.toml`，使用 uv 管理 Hermes 插件依赖和测试。
- [x] 3.1.2 增加 `memohub_provider/plugin.yaml`。
- [x] 3.1.3 增加 `memohub_provider/provider.py`，承载 Hermes 官方插件类。
- [x] 3.1.4 增加 `config.py`、`client.py`、`extractor.py`、`formatter.py`。
- [x] 3.1.5 增加 `connectors/hermes/test/`，只放 Hermes 插件测试。
- [x] 3.2 根目录脚本增加 Hermes Connector 工程命令。
- [x] 3.2.1 `connector:hermes:sync` 执行 uv sync。
- [x] 3.2.2 `connector:hermes:test` 执行 pytest。
- [x] 3.2.3 `connector:hermes:lint` 执行 ruff。
- [x] 3.2.4 `connector:hermes:check` 串联 lint 和 test。

## 4. Hermes Official Plugin Contract

- [x] 4.1 实现 `name`。
- [x] 4.2 实现 `is_available()`，检查 memohub 命令、配置、数据目录和 MCP/CLI 可用性。
- [x] 4.3 实现 `get_config_schema()`，覆盖默认 project、language、memohub command、test validation。
- [x] 4.4 实现 `save_config(values, hermes_home)`，只写 Hermes 插件私有配置，不复制 MemoHub 数据源。
- [x] 4.5 实现 `initialize(session_id, **kwargs)`，恢复或创建 Hermes primary channel。
- [x] 4.6 实现 `queue_prefetch(query)`。
- [x] 4.7 实现 `prefetch(query)`，返回 actor/project/global 聚合摘要。
- [x] 4.8 实现 `sync_turn(user_message, assistant_message, metadata)`，写入候选长期记忆。
- [x] 4.9 实现 `on_pre_compress(messages)`，压缩前沉淀高价值信息。
- [x] 4.10 实现 `on_session_end(messages)`，写入会话活动摘要。
- [x] 4.11 实现 `on_memory_write(action, target, content)`，镜像 Hermes 手动记忆写入。
- [x] 4.12 实现 `shutdown()`。
- [x] 4.13 实现 `get_tool_schemas()` 和 `handle_tool_call(name, args)`。
- [x] 4.14 增加官方协议契约测试，逐项验证方法存在、返回结构、异常处理。

## 5. Channel Governance

- [x] 5.1 定义并实现 Hermes channel 默认字段。
- [x] 5.1.1 `actorId = hermes`。
- [x] 5.1.2 `source = hermes`。
- [x] 5.1.3 `purpose = primary | test`。
- [x] 5.1.4 `sessionId` 来自 Hermes `initialize(session_id)`。
- [x] 5.1.5 `projectId` 来自 Hermes metadata、cwd 解析或配置。
- [x] 5.2 支持 Hermes 查询自己的 channel 状态。
- [x] 5.3 支持按 actor/source/project/session/purpose/channel 列表和过滤。
- [x] 5.4 支持按 actor/source/project/session/purpose/channel clean dry-run。
- [x] 5.5 清理执行必须二次确认，禁止插件默认执行高风险清理。

## 6. Memory Read Loop

- [x] 6.1 实现 actor 视角读取，返回 Hermes 自己的偏好、习惯、近期活动。
- [x] 6.2 实现 project 视角读取，返回当前项目事实和约定。
- [x] 6.3 实现 global 视角读取，返回必要共享记忆。
- [x] 6.4 实现 `listMemory` 默认概览：按 actor 显示数量、最近写入和筛选提示。
- [x] 6.5 实现 Hermes prefetch 输出格式。
- [x] 6.5.1 输出 `channel`。
- [x] 6.5.2 输出 `actorSummary`。
- [x] 6.5.3 输出 `projectSummary`。
- [x] 6.5.4 输出 `globalHints`。
- [x] 6.5.5 输出 `conflictsOrGaps`。
- [x] 6.5.6 输出 `nextActions`。
- [x] 6.6 确保 CLI、MCP、Hermes Connector 读取同一 Memory service。

## 7. Memory Write Loop

- [x] 7.1 实现 `preference` 写入。
- [x] 7.2 实现 `habit` 写入。
- [x] 7.3 实现 `activity` 写入。
- [x] 7.4 实现 `project_fact` 写入。
- [x] 7.5 实现 `clarification` 写入。
- [x] 7.6 实现 deterministic extractor。
- [x] 7.6.1 中文偏好、习惯、默认规则触发。
- [x] 7.6.2 中文活动、阻塞、下一步规则触发。
- [x] 7.6.3 中文项目事实、架构决定、约定规则触发。
- [x] 7.6.4 中文澄清、纠正、不是、应该是规则触发。
- [x] 7.6.5 补充英文 `prefer/always/working on/decision/clarify` 等基础触发。
- [x] 7.7 实现最小 dedupe。
- [x] 7.8 实现最小 conflict detection。
- [x] 7.9 冲突不静默覆盖，生成 clarification 或冲突状态。

## 8. CLI And MCP Alignment

- [x] 8.1 更新 `apps/cli/src/interface-metadata.ts`，补齐 Connector/Channel/Memory 新描述。
- [x] 8.2 CLI help 中按业务链路排序：setup/status/channel/list/query/add/logs/clean/mcp。
- [x] 8.3 MCP tools 描述必须说明 Hermes 如何查询自己的记忆、channel 和日志。
- [x] 8.4 `memohub://tools` 暴露 Hermes 首次接入建议顺序。
- [x] 8.5 确保 MCP stdio 不输出非 JSON-RPC 内容。
- [x] 8.6 确保 CLI/MCP 高层能力等价：channel、memory read/write/list、logs、data clean dry-run。

## 9. Documentation And Skill

- [x] 9.1 更新 `docs/architecture/business-workflows.md`。
- [x] 9.1.1 固化 `Connector -> Channel -> Memory`。
- [x] 9.1.2 明确治理视角 actor/project/global。
- [x] 9.1.3 明确 Channel 不是共享边界。
- [x] 9.2 更新 `docs/development/project-structure.md`。
- [x] 9.2.1 标注 `connectors/`、`packages/channel`、`packages/memory`。
- [x] 9.2.2 标注 `integration-hub` 的内部实现定位。
- [x] 9.3 更新 `docs/integration/hermes-guide.md`。
- [x] 9.3.1 增加 Hermes 官方插件接入流程。
- [x] 9.3.2 增加首次真实接入话术。
- [x] 9.3.3 增加 setup、prefetch、sync_turn、query、logs、clean dry-run 验证。
- [x] 9.4 更新 `skills/memohub/SKILL.md`，让 Agent 明确 MemoHub 是共享长期记忆中心。
- [x] 9.5 更新 `AGENTS.md`，禁止把额外中间层作为顶层业务概念重新引入。
- [x] 9.6 运行 `bun run docs:generate` 和 `bun run docs:check`。

## 10. Verification

- [x] 10.1 TypeScript 构建验证：`bun run build`。
- [x] 10.2 CLI 构建验证：`bun run build:cli`。
- [x] 10.3 CLI 业务验证：`bun run verify:cli`。
- [x] 10.4 测试布局验证：`bun run check:test-layout`。
- [x] 10.5 Hermes Connector 依赖验证：`bun run connector:hermes:sync`。
- [x] 10.6 Hermes Connector 测试：`bun run connector:hermes:test`。
- [x] 10.7 Hermes Connector 完整检查：`bun run connector:hermes:check`。
- [x] 10.8 实机接入验证，使用 `purpose=test`。
- [x] 10.8.1 setup 保存配置。
- [x] 10.8.2 initialize 创建/恢复 channel。
- [x] 10.8.3 prefetch 返回空库或已有摘要。
- [x] 10.8.4 sync_turn 写入 preference/activity/project_fact/clarification。
- [x] 10.8.5 query/list 能读回写入数据。
- [x] 10.8.6 logs 能看到调用链路。
- [x] 10.8.7 clean dry-run 能定位 test 数据。
- [x] 10.8.8 clean 确认执行后只删除 test 数据。

## 11. Release Readiness

- [x] 11.1 OpenSpec 验证通过。
- [x] 11.2 文档、skill、CLI/MCP 工具描述同步。
- [x] 11.3 Hermes 首次接入报告归档到 docs。
- [x] 11.4 当前变更提交并推送远程。
- [x] 11.5 后续代码资产层、Git、AST、npm 私有源分析保持在独立提案，不混入本闭环。
