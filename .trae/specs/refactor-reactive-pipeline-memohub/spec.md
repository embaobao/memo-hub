# MemoHub 2.0+ 反应式管道模型重构 Spec

## Why

MemoHub 2.0+ 的目标是把“被动存储”升级为“可自我治理的主动记忆中枢”。为此需要从传统“分层模型”演进为 **反应式管道模型（Reactive Pipeline Architecture）**：所有能力以事件驱动的独立管道组织，管道内部阶段可插拔、可观测、可回放，从而实现极致解耦与高性能演进。

同时，存储必须实行“灵肉分离”：

- **灵魂（Spirit）**：LanceDB 仅保存轻量索引（向量、FTS、实体标签、元数据、CAS 引用）
- **肉体（Flesh）**：文件系统采用 CAS（内容寻址存储）保存完整原文，实现物理去重与索引损坏后的可重建

## What Changes

- 引入三条独立管道：
  - 写入管（Ingestion Pipe）：`输入 → 智能路由 → AST/实体提取 → 内容哈希校验(幂等) → 灵魂写入(索引) + 肉体写入(CAS 原文)`
  - 检索管（Retrieval Pipe）：`意图/过滤解析 → 混合召回(Vector + FTS) → 原文回填(Hydration) → 结果装配`
  - 治理管（Governance Pipe）：`闲时触发 → 冲突检测 → [澄清闸门] → 产物回流(知识蒸馏/结构化文档)`（本期实现骨架与最小闭环）
- 引入多轨语义网（Multi-Track Matrix）：
  - 轨道以 **Track Provider 插件** 形式存在，核心引擎不内置业务逻辑
  - 默认保留并兼容现有轨道：ClawMem（代码轨）、GBrain（知识轨）
  - 预留扩展轨：WikiTrack 等（本期不实现完整生成，但保留接口/事件）
- 强化 AST 解析（重点保留）：
  - 对代码轨写入使用 Tree-sitter 提取 AST 语义实体（函数/类/接口/导出符号/关键调用片段等），写入索引元数据
- 落地灵肉分离 + CAS：
  - 原文以 `SHA-256(text)` 作为文件名写入 CAS
  - LanceDB 索引记录保存 `contentHash/contentRef`，检索阶段按需回填原文，避免数据截断

## Impact

- Affected capabilities:
  - 写入：上下文路由、AST/实体抽取、幂等去重、CAS 原文落盘
  - 检索：混合召回（向量 + FTS）、Hydration 原文回填、结果装配与去重
  - 治理：冲突检测事件化与澄清闸门骨架
- Affected code (high level):
  - 轨道实现：`src/lib/gbrain.ts`、`src/lib/clawmem.ts`
  - 配置：`src/core/config.ts`
  - MCP：`mcp-server/index.ts`
  - CLI / Hooks / 后台任务：`src/cli/index.ts` 及相关新增模块

## ADDED Requirements

### Requirement: MemoContext（富上下文）

系统 SHALL 支持可选上下文 `MemoContext`，至少包含：

- `sessionId`、`project`、`filePath`、`source`
- 允许扩展字段（如 agentTrace、branch、commitHash 等）

#### Scenario: 上下文透传

- **WHEN** 通过 CLI/MCP 写入并携带 MemoContext
- **THEN** 该上下文进入路由阶段并写入索引元数据（允许裁剪与脱敏）

### Requirement: MemoRecord（统一索引契约）

系统 SHALL 定义 `MemoRecord` 作为索引写入与检索结果的统一结构，至少包含：

- `id`（可选，由存储层生成）
- `track`（轨道标识：如 `gbrain` / `clawmem` / `wiki`，可扩展）
- `text`（用于嵌入/摘要；完整原文不强制存于索引中）
- `contentHash`（SHA-256，用于幂等与 CAS 引用）
- `contentRef`（CAS 引用：hash + 相对路径或 uri）
- `entities`（轻量实体数组）
- `metadata`（tags/importance/timestamp/source/filePath/language/ast 等）

### Requirement: 灵肉分离存储（CAS + LanceDB）

系统 SHALL 将原始文本写入文件系统 CAS，并将索引（向量/FTS/实体/元数据/引用）写入 LanceDB。

#### Scenario: 物理去重

- **WHEN** 相同内容重复写入
- **THEN** CAS 只保留一份文件（以 contentHash 定位）
- **AND** 索引写入按策略去重（默认幂等：不重复插入）

#### Scenario: 索引可重建（骨架）

- **WHEN** 索引库损坏或丢失
- **THEN** 系统可在“已知内容清单/遍历 CAS”的前提下重建索引（本期提供重建入口与最小流程，不要求全量性能优化）

### Requirement: 写入管（Ingestion Pipe）

系统 SHALL 将写入流程实现为可插拔阶段的管道，并提供阶段级可观测点。

#### Scenario: 写入成功

- **WHEN** 写入任意文本
- **THEN** 完成：路由→抽取→幂等→CAS→索引
- **AND** 返回包含 `id/contentHash/contentRef/track` 的结果

### Requirement: 轻量实体抽取（工程语料）

系统 SHALL 抽取工程向实体（entities），覆盖但不限于：

- 驼峰词（`MemoHubConfig`）
- 带点标识符（`lancedb.connect`）
- 版本号（`v2`、`1.2.3`）
- 缩写（`AST`、`FTS5`、`IoC`）

### Requirement: AST 解析（代码轨重点能力）

系统 SHALL 在代码轨写入时使用 Tree-sitter 提取 AST 语义实体，并写入索引元数据（至少包含符号名/类型/语言/文件路径/片段边界等）。

### Requirement: 检索管（Retrieval Pipe）与 Hydration

系统 SHALL 实现混合召回与原文回填：

- 向量召回为必选能力
- FTS 召回为可选能力（依赖可用时开启；不可用时保持关闭且不影响主流程）
- Hydration 默认开启/可配置：从 CAS 拉取完整原文填充结果

### Requirement: 治理管（Governance Pipe）与澄清闸门（骨架）

系统 SHALL 提供治理管道骨架，并将“不可自动裁决的冲突”以事件形式输出：

- 冲突检测最小规则：同一 `key/实体锚点` 下出现高置信矛盾内容时触发
- 输出事件 `CONFLICT_PENDING`，记录冲突候选与需要人工裁决的信息
- 支持裁决结果回流进入写入管（闭环修正）

## MODIFIED Requirements

### Requirement: 兼容性

系统 SHALL 保持现有对外能力可用（CLI 与 MCP 的主要用法不被破坏）。

- 新增字段均为可选且提供默认值
- 允许采用适配器方式接入新管道，避免一次性推倒重写

## REMOVED Requirements

无。

## Non-goals（本期不做）

- 不交付 Web UI 仪表盘
- WikiTrack 的“自动 Wiki/图谱生成”只保留接口与事件，暂不实现完整生成
- 不强制引入大小模型协作（如 Vercel AI SDK），仅预留治理阶段的模型调用插槽
