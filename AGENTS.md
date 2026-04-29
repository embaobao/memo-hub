# AGENTS.md - MemoHub AI 协作入口

最后更新：2026-04-29

本文档是 MemoHub 仓库唯一 AI 协作入口。`AGENT.md`、`CLAUDE.md`、`GEMINI.md` 等工具入口必须软链接到本文件，不维护多份内容。

## 项目定位

MemoHub 是面向多 AI 场景的统一记忆中枢，用于整合 Agent 记忆、项目知识、代码上下文、任务脉络和外部工具写入数据。

当前对外入口：

- CLI：`memohub`
- MCP：`memohub serve`
- Agent Skill 安装源：`skills/memohub/SKILL.md`

当前核心模型：

- `CanonicalMemoryEvent`
- `MemoryObject`
- `ContextView`
- `ClarificationItem`

## 快速导航

- [文档中心](docs/README.md)
- [快速开始](docs/guides/quickstart.md)
- [配置指南](docs/guides/configuration.md)
- [接入前检查清单](docs/integration/preflight-checklist.md)
- [CLI 集成](docs/integration/cli-integration.md)
- [MCP 集成](docs/integration/mcp-integration.md)
- [Hermes 接入](docs/integration/hermes-guide.md)
- [业务链路](docs/architecture/business-workflows.md)
- [项目结构](docs/development/project-structure.md)
- [工程化底座](docs/development/engineering-foundation.md)

## 开发原则

### 统一记忆模型优先

- 核心业务逻辑围绕统一记忆模型展开，入口层只表达事件、视图、来源、项目和上下文。
- 所有外部输入必须先归一为标准事件或标准查询。
- `track` 不得作为 CLI 参数、MCP 工具输入或产品主概念扩散。

### 接口一致性

- CLI 和 MCP 必须暴露同等业务能力。
- 新能力必须先更新 `apps/cli/src/interface-metadata.ts`，再更新实现和文档。
- MCP stdio 服务不得向 stdout 输出非 JSON-RPC 内容。

### 文档一致性

- 所有业务文档放在 `docs/` 下。
- 根目录不维护独立 `guides/`。
- 变更日志只维护 `docs/CHANGELOG.md`，根目录不保留 `CHANGELOG.md` 副本。
- AI 协作文档只维护本文件，其他工具入口使用软链接。
- 变更 CLI/MCP/Skill 后必须运行 `bun run docs:generate` 和 `bun run docs:check`。

### 目录与脚本边界

- 仓库根目录只放项目入口文件、工程配置、AI 入口软链接和 README。
- 当前工程化脚本放在 `scripts/engineering/`。
- Git hook 放在 `scripts/git-hooks/`。
- 不新增根目录安装脚本、临时验证脚本、迁移试验脚本或工具本地安装目录。
- 不新增 `rulers/`、根目录 AI 规则副本或其他与 `AGENTS.md` 重复的协作说明。
- 不提交工具私有依赖目录，例如 `.opencode/node_modules`。

### 测试布局

- 测试代码必须放在 `test/` 或各包自己的 `test/` 目录。
- 不允许把测试文件散落在 `src/`。
- 使用 `bun run check:test-layout` 验证布局。

## 当前命令

构建和验证：

```bash
bun install
bun run build
bun run build:cli
bun run verify:cli
bun run check:release
```

CLI 全局注册：

```bash
bun run link:cli
memohub --version
memohub --help
```

Agent Skill 生成：

```bash
bun run skill:memohub
```

配置和 MCP 检查：

```bash
memohub config-check
memohub config
memohub mcp-tools
memohub mcp-status
memohub mcp-doctor
```

MCP 启动：

```bash
memohub serve
```

## 当前 CLI 能力

```bash
memohub inspect
memohub add "文本内容" --project memo-hub --source cli --category decision
memohub query "查询文本" --view project_context --actor hermes --project memo-hub
memohub summarize "需要总结的文本" --agent hermes
memohub clarify "需要澄清的冲突文本" --agent hermes
memohub resolve-clarification clarify_op_1 "澄清答案" --agent hermes --project memo-hub
memohub config
memohub config-check
memohub config-get mcp.logPath
memohub config-set system.lang '"zh"'
memohub config-uninstall
memohub mcp-config
memohub mcp-tools
memohub mcp-status
memohub mcp-doctor
memohub mcp-logs --tail 50
memohub serve
```

## 当前 MCP 能力

工具：

- `memohub_ingest_event`
- `memohub_query`
- `memohub_summarize`
- `memohub_clarify`
- `memohub_resolve_clarification`
- `memohub_config_get`
- `memohub_config_set`
- `memohub_config_manage`

资源：

- `memohub://tools`
- `memohub://stats`

Agent 接入后应先读取 `memohub://tools`，再选择具体工具。

## Agent Skill 约束

`skills/memohub/SKILL.md` 是仓库根目录安装源，用于：

```bash
npx skills add <repo> --skill memohub
```

该 skill 指导 Agent 完成本地 CLI 构建/链接、配置检查、MCP 启动和工具发现。MemoHub 构建脚本不得把 skill 写入本机 `.codex`、`.claude`、`.gemini` 或其他 Agent 私有目录。

## 内部处理域

当前建议围绕以下处理域演进：

| 处理域 | 用途 |
| --- | --- |
| `code-intelligence` | 代码结构、依赖、组件和 API 分析 |
| `project-knowledge` | 业务事实、决策、组件职责沉淀 |
| `task-session` | 会话、任务、活动脉络 |
| `habit-convention` | Agent 习惯、项目约定、长期偏好 |

## 禁止事项

- MCP 工具目录必须从 `apps/cli/src/interface-metadata.ts` 生成，并与 CLI 当前业务能力保持一致。
- CLI 查询入口只使用命名 `view`、`source`、`project`、`category`、`file` 等统一模型字段。
- 不要新增根目录业务文档副本。
- 不要把测试放回 `src/`。
- 不要把 Agent Skill 生成逻辑集成到 CLI 包命令里。
