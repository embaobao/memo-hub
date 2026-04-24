## Why

MemoHub v1.0.0 已经完成了底层的彻底重构，拥有了强大的声明式流引擎（Flow Engine）、原子化工具（Atomic Tools）以及跨轨检索流水线。然而，目前的交互完全依赖 CLI 和配置文件，导致：
1. **配置门槛高**：手动编写数百行的 JSONC 容易出错，难以梳理多工具间的上下文数据流（JSONPath）。
2. **缺乏可视化反馈**：Librarian 发现的记忆冲突无法得到直观的人工干预（CLARIFY）；Agent 调用的内部细节（Trace 日志）难以调试。
3. **资产管理黑盒化**：难以直观地查阅、分类检索和管理存储在 LanceDB 中的海量记忆与 Wiki。

为了让 MemoHub 真正成为“企业级个人记忆操作系统”，我们需要一个极其现代、极简且功能完备的 Web 控制台。

## What Changes

1. **核心配置控制台 (Config Studio)**:
   - 全面接管 `config.jsonc` 的管理，支持热重载。
   - 包含多模型提供商 (Providers) 与 Agents 角色配置界面。
   - 支持动态 Tool 注册与查看。
2. **可视化流编排 (Flow Orchestrator)**:
   - 引入 Reactflow，将 Track 抽象为画布，支持拖拽原子工具（如 CAS, Vector, Embedder）进行业务编排。
   - 支持轨道和业务隔离（Workspace/Project 视图）。
3. **全域数据大盘 (Asset & Omni-Search)**:
   - 极简的全局搜索栏（Command Palette），直连 LightRAG 流水线。
   - 提供按分类、渠道（Source/Session）、AST 类型等多维度 faceted 检索。
   - 提供 `track-wiki` 的沉浸式富文本/Markdown 预览。
   - 提供记忆的快捷录入入口（支持文本、代码、对话）。
4. **主动治理交互区 (Governance & Clarify)**:
   - 提供专门的 CLARIFY 工作台，对后台 Librarian 发现的冲突记录提供 A/B 对比和合并/删除操作。
5. **可观测与调试沙盒 (Trace & Agent Playground)**:
   - **实时调试**: 执行流时，流程图节点产生动画反馈，实时透出输入/输出变量和耗时。
   - **日志中心**: 全量 NDJSON 日志的全文检索与多维筛选。
   - **MCP 沙盒**: 内置简易 MCP Client，以对话形式模拟外部 Agent 调用记忆工具的全过程，验证整合效果。

## Capabilities

### New Capabilities
- `web-ui-core`: Vite + React 19 + TailwindCSS 基础框架与路由。
- `flow-visualizer`: 基于 Reactflow 的 JSONC 到图形的互转解析与渲染引擎。
- `trace-viewer`: 实时 WebSocket/SSE 日志流监听与节点动画联动系统。
- `clarify-workbench`: 处理知识冲突与合并的交互组件。
- `agent-playground`: 基于 MCP 协议的内置 Chat 测试沙盒。
- `api-server`: 在 CLI 的 `serve` 或 `daemon` 命令中，挂载供 Web 调用的 REST/WS API（绕过纯 MCP 的限制）。

### Modified Capabilities
- `app-cli-entry`: `memohub daemon` 需要同时启动配套的 API 服务。

## Impact

- **用户体验**: 实现了从极客向 CLI 工具向生产级 SaaS 产品体验的跃升。极简动画与实时反馈将大幅降低学习曲线。
- **系统架构**: 要求内核进一步开放运行时状态，例如支持流执行时的事件发射（Event Emitter），以便推送到前端实现实时调试动画。
- **配置持久化**: Web 端将获得对 `~/.memohub/config.jsonc` 的读写权限，并能触发内核的安全重载。
