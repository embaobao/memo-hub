## Context

MemoHub 已迁移至 Monorepo 和 Flow 驱动引擎。当前挑战在于如何通过缓存提升响应速度、通过 Web 可视化提升易用性，并补全关键的“对话流”轨道。

## Goals / Non-Goals

**Goals:**
- **零配置发布**: 修正 `apps/cli` 的打包逻辑。
- **极致性能**: 引入 `~/.memohub/cache/`，缓存耗时的 Tool 运算（尤其是 AI 嵌入和 AST 解析）。
- **可视化**: 开发一个 React 应用，支持通过 GUI 查看和编辑 `memohub.json` 中的 Flow。
- **对话上下文支持**: 实现 `track-stream`。

**Non-Goals:**
- 不支持云端分布式缓存（仅限本地）。
- Web 端暂不支持多用户登录。

## Decisions

### D1: 缓存策略 (Cache Layer)
在 `FlowEngine` 中集成缓存管理器：
- **Key**: `hash(tool_id + input_json + agent_config)`。
- **Storage**: 文件系统 NDJSON 或 SQLite (轻量级)。
- **TTL**: 支持按工具配置。

### D2: Web 技术栈 (Web Stack)
- **Frontend**: Vite + React + Tailwind + Reactflow (流程图库)。
- **Backend**: 直接由 `memohub serve` (MCP Server) 通过额外的 HTTP 路由提供服务，或独立运行。优先考虑 **MCP Tool 透传元数据**。

### D3: 动态凭据 (Dynamic Secrets)
修改 `@memohub/config`，当解析到以 `env://` 开头的字符串时，自动从 `process.env` 读取。

## Risks / Trade-offs

- **[风险] 缓存膨胀** → 缓解：实现简单的 LRU 或定期清理机制。
- **[风险] 缓存一致性** → 缓解：如果 Tool 声明 `pure: false`，则不缓存。
