## Why

MemoHub 现在已经具备统一记忆模型、CLI/MCP 双入口和多层查询能力，但“接入身份”和“渠道”仍然只是事件上的自由字符串。Hermes、IDE、Codex、Gemini 等入口虽然可以写入 `source` 和 `channel`，但系统还不能可靠回答：

- 某个 Agent 当前绑定了哪个主渠道
- 某个渠道归属哪个 Agent / project / workspace / session
- 某个渠道是正式渠道、测试渠道还是临时会话渠道
- 当前有哪些可治理渠道、最后一次活跃时间是什么
- 某个 IDE 工作区应该自动复用哪个渠道，而不是每次手动注册

如果不把渠道升级为受管理对象，MemoHub 更像“可写入的存储”，而不是“可治理的共享记忆中枢”。后续多 Agent 协同、按渠道清理、跨项目检索、adapter 接入和审计都会缺少可靠底座。

## What Changes

- 新增 channel registry 规划，把渠道从自由字符串升级为受管理的接入会话对象。
- 新增 Agent binding 规划，支持 Hermes 显式恢复/切换自己的主渠道。
- 新增 IDE auto-binding 规划，支持工作区级无感绑定，不要求每次显式注册。
- 明确 channel / scope / visibility / provenance 的职责边界，避免把渠道当成共享边界或权限边界。
- 新增治理接口规划，支持 list/status/open/close/use/cleanup 等最小闭环。
- 让 `memohub://tools` 与接入文档明确返回渠道治理说明，指导 Hermes 等 Agent 先恢复上下文，再读写记忆。

## Capabilities

### New Capabilities

- `channel-registry-governance`: 管理渠道注册、身份绑定、生命周期、默认绑定、状态查询、自动绑定和清理治理。

### Modified Capabilities

- `app-cli-entry`: 需要暴露 channel 管理命令与 MCP 工具，并让 CLI/MCP 默认上下文可继承当前渠道。
- `source-normalization`: 需要把渠道、Agent、project/workspace/session/task 的映射要求固化到标准化规则里。
- `layered-memory-query`: 需要明确 channel 只用于 provenance 与加权，不作为共享边界本身；跨项目检索仍由 self/project/global 层与 visibility 决定。
- `documentation-governance`: 需要补充 Hermes、IDE 与多 Agent 的渠道恢复、自动绑定和治理流程。

## Impact

- CLI/MCP 后续需要新增 `channel` 相关命令与工具。
- 配置系统后续需要新增 channel policy、命名规则、默认 purpose 映射和自动绑定策略。
- Hermes 最终接入流程会从“直接写入”升级成“先恢复/绑定渠道，再查询/写入”。
- IDE 接入流程会支持自动恢复 workspace 主渠道，不要求显式交互注册。
- Source adapters 后续必须输出符合 channel registry 规则的标准事件，而不是继续写裸 `channel` 字符串。
