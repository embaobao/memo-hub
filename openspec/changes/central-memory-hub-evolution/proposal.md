## Why

将 MemoHub 从一个“离线 CLI 工具”提升为“统一托管的个人记忆中心”。当前架构虽具备 Flow 编排能力，但缺乏长期运行的稳定性保障、跨进程的数据一致性管理以及深度的知识关联（图谱化）。我们需要构建一个常驻的、高性能的、具备自我治理能力的中心化服务。

## What Changes

- **常驻服务化 (Daemonization)**: 增强 `memohub serve`，支持 WebSocket/SSE 等多种长连接协议，建立进程级单例锁。
- **知识图谱层 (Graph-RAG)**: 引入 `builtin:entity-extractor` 和 `builtin:graph-store`，在向量检索基础上增加关联关系检索。
- **主动治理引擎 (Self-Governance)**: 实现后台运行的 `Librarian Flow`，执行自动去重、冲突检测与记忆衰减（Decay）。
- **多级存储架构**: 优化 `IHostResources` 以支持内存热数据缓存与冷数据归档的自动切换。
- **统一访问入口**: CLI 将作为 Daemon 的客户端运行（如果 Daemon 在线），确保所有集成点（IDE, Hermes, Web）共享同一内存状态。

## Capabilities

### New Capabilities
- `daemon-kernel`: 负责多连接管理与并发锁定的常驻进程核心。
- `builtin:graph-store`: 轻量级实体-关系存储工具。
- `governance-scheduler`: 异步执行记忆提纯 Flow 的调度器。
- `session-cache-layer`: 毫秒级的近期会话内存缓存。

### Modified Capabilities
- `flow-engine`: 支持异步非阻塞的后台 Flow 执行。
- `app-cli-entry`: 增加“客户端模式”，优先通过 RPC 与 Daemon 通信。

## Impact

- **架构重心**: 从“文件系统优先”转向“服务/内存优先”。
- **性能**: 常用记忆检索延迟降低至 50ms 以下。
- **数据结构**: 存储目录将包含 `.graph` 索引文件。
- **集成模式**: 所有的 Agent 插件现在只需连接到统一的 `memohub serve` 端口。
