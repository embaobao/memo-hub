## Why

MemoHub 当前是一个单体结构的项目 (src/cli, src/core, src/lib)，GBrain 和 ClawMem 作为两个独立类硬编码在 lib 目录中。随着功能增长，这种结构导致：轨道扩展需要侵入核心代码修改；存储层、AI 层、协议层耦合在一起无法独立测试和替换；缺乏统一的指令协议，Agent 集成只能通过松散的 MCP tool 调用。借鉴 Text2Mem（指令集契约化）、Letta（Sleeptime 异步治理）、ReMe（物理层透明）、Mem0（实体锚定）的设计理念，需要将 MemoHub 重构为 Bun Workspace Monorepo 架构，实现协议层、存储层、AI 层、轨道层的完全解耦，为工业级扩展奠定基础。

## What Changes

- **BREAKING**: 将现有单体 `src/` 结构拆分为 Bun Workspace Monorepo（apps/*, packages/*, tracks/*）
- **BREAKING**: 引入 Text2Mem 12 原子操作指令集作为统一的协议层，替代当前分散的 CLI 命令和 MCP tool 定义
- 新增 `storage-flesh` 包：实现 CAS (Content-Addressable Storage) 内容寻址存储，原始文本以物理文件形式存于 `.memohub/blobs/`
- 新增 `storage-soul` 包：封装 LanceDB 向量索引操作，统一 schema 包含 `id, vector, hash, track_id, entities`
- 新增 `ai-provider` 包：将当前 `core/embedder.ts` 抽象为可插拔的 AI 适配器（IEmbedder + ICompleter）
- 新增 `core` 包：实现 MemoryKernel 调度总线，支持 `registerTrack()` 动态注册轨道插件
- 新增 `protocol` 包：定义 Text2Mem 五元 JSON 契约（op, trackId, payload, context, meta）及 12 原子操作枚举
- 新增 `librarian` 包：异步治理层，实现语义去重、冲突检测、Wiki 化逻辑
- 新增 `track-source` 轨道：基于 Tree-sitter 的代码/AST 轨道（替代当前 ClawMem）
- 新增 `track-insight` 轨道：事实/经验知识轨道（替代当前 GBrain）
- 重构 `apps/cli`：作为唯一执行入口，集成 CLI 和 MCP Server 模式
- 当前 GBrain 和 ClawMem 的数据将通过迁移脚本兼容新架构

## Capabilities

### New Capabilities
- `text2mem-protocol`: Text2Mem 协议层 — 12 原子操作枚举、五元 JSON 契约接口、指令解析与验证
- `storage-cas`: CAS 内容寻址存储 — SHA-256 哈希寻址、blob 物理文件管理、去重判定
- `storage-vector`: 向量索引存储 — LanceDB 封装、统一 schema（id/vector/hash/track_id/entities）、向量检索与过滤
- `ai-provider-plugin`: AI 插件化适配 — IEmbedder/ICompleter 接口、Ollama 首个适配器实现、运行时切换
- `memory-kernel`: 调度内核 — MemoryKernel 类、轨道动态注册、指令分发、事件总线
- `track-source`: 代码/AST 轨道 — Tree-sitter 解析、符号提取、代码入库流程
- `track-insight`: 事实/经验轨道 — 知识分类、重要性评分、语义检索
- `librarian-governance`: 异步治理 — 语义去重扫描、冲突检测、CLARIFY 指令裁决、Wiki 化改写
- `app-cli-entry`: 统一 CLI 入口 — Commander.js 命令分发、MCP Server 模式、配置管理
- `monorepo-workspace`: Monorepo 基础设施 — Bun workspace 配置、包间依赖管理、统一构建脚本

### Modified Capabilities

## Impact

- **代码结构**: 全量目录重构，从 `src/` 单体迁移到 `packages/*` + `tracks/*` + `apps/*`
- **API**: Text2Mem 指令协议替代当前分散的 CLI 参数和 MCP tool schema，对外接口将重新定义
- **依赖**: 各包独立声明依赖，core/protocol 零外部依赖，storage-* 依赖 lancedb，ai-provider 依赖 openai
- **数据兼容**: 需要数据迁移工具将现有 GBrain/ClawMem LanceDB 数据导入新 schema
- **构建系统**: 从单一 tsc 构建切换到 Bun workspace 的 `bun run build`（每个包独立构建）
- **CI/CD**: 测试和发布流程需要适配 monorepo 结构
- **现有功能**: 当前所有 CLI 命令（mh add-knowledge, mh search-knowledge 等）需逐步迁移到新架构
