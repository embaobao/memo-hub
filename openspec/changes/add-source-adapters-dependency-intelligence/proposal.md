## Why

MemoHub 已经具备统一记忆对象、分层检索、CLI/MCP 接入和代码记忆回溯能力，但 GitLab 仓库、npm 依赖、私有 registry 等外部数据仍依赖 Agent 手动读取和总结，无法稳定、持续、可追溯地沉淀为代码记忆资产。

现在需要补齐接入适配器和依赖情报层，让 Hermes 能从仓库和包管理生态中自动获取代码、API、依赖、私有源和变更上下文，并通过 `coding_context`/`project_context` 回溯查询。

## What Changes

- 新增 source adapter runtime 规划，定义外部数据源适配器的发现、配置、扫描、增量同步、事件输出和错误边界。
- 新增 code repository adapter 规划，优先覆盖 GitLab 仓库，后续可扩展 GitHub、本地文件系统、CI 产物和 IDE 工作区。
- 新增 dependency intelligence 规划，覆盖 npm 公共依赖、lockfile、workspace、私有 registry、私有包 API/README/类型定义分析。
- 明确 Hermes 使用链路：读取仓库/依赖分析结果，写入 `code-intelligence`、`dependency-intelligence`、`project-knowledge`，再通过命名视图回溯。
- 明确安全边界：token、registry auth、GitLab credential 不写入记忆对象，仅保留脱敏来源和可追溯 provenance。
- 不改变现有 CLI/MCP 基础接口，不引入旧 track 工具或旧 `memohub_add/search` 兼容面。

## Capabilities

### New Capabilities
- `source-adapter-runtime`: 统一管理 source adapters 的配置、执行、增量状态、事件输出和接入健康检查。
- `code-repository-adapter`: 将 GitLab 等代码仓库转为标准代码记忆事件，支持文件、符号、API、依赖和提交上下文。
- `dependency-intelligence`: 将 package manifest、lockfile、workspace 和 npm/private registry 元数据转为依赖记忆资产。

### Modified Capabilities
- None.

## Impact

- 未来代码位置：`packages/source-adapter-runtime`、`packages/source-adapter-gitlab`、`packages/dependency-intelligence` 或等价 workspace 包。
- CLI/MCP 后续可新增 adapter 管理命令和工具，但本提案阶段只规划契约与实现任务。
- 配置系统后续需要增加 adapters、registries、credential refs、scan policies 和 redaction 策略。
- 文档后续需要补充 Hermes GitLab 接入、npm/私有源依赖分析、增量同步、权限安全和验证链路。
