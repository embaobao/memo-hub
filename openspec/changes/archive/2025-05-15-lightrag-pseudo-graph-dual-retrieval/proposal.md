## Why

MemoHub 当前的检索以向量召回为主，容易出现“只见树木不见森林”：能命中局部细节，但难以把同一主题下跨轨（代码/知识）的关联上下文完整拼装出来。需要在不引入重型图数据库/任务流引擎的前提下，补齐“宏观关联 + 可解释引用”的能力，并把检索过程工程化为可组合、可调参、可验证的流水线。

## What Changes

- 统一两轨记录结构中的 `entities: string[]`（伪图谱锚点）与引用类元数据（如 `trackId/filePath/symbol_name/timestamp/hash`），保证跨轨联动与可追溯输出。
- 引入“双层检索（Dual-level Search）”：
  - Low-level：向量召回 TopK（各轨独立召回，保留细节命中能力）。
  - High-level：从 TopK 中提取高频实体，触发“实体扩展召回”，跨轨拉取相关记录形成宏观上下文。
- 引入“三段式检索流水线（Pre/Exec/Post）”：
  - Pre：意图识别 + 显式实体抽取（query 侧）。
  - Exec：并行多路召回（Vector + 轻量 Lexical/FTS + Entity Expand）。
  - Post：融合去重 + 权重排序 + 强制引用字段输出（citation-ready）。
- 增加实体扩展的降级/兜底策略：当 DB 侧数组包含过滤不可用/不稳定时，使用轻量派生索引（entity_index）完成实体到记录的扩展召回，避免全表扫描。
- MCP 层对外保持极简门面（优先以 `memo_search/memo_add` 为主），但内部实现升级为可配置流水线；返回结构强制携带溯源字段。

## Capabilities

### New Capabilities

- `pseudo-graph-entities`: 定义 entities 的来源、抽取策略与存储契约（代码/知识两轨一致），以及实体扩展召回的可解释规则。
- `dual-level-cross-track-retrieval`: 定义双层检索与跨轨联动的行为规范、降级策略与验收用例。
- `retrieval-pipeline`: 定义检索流水线三段式（Pre/Exec/Post）的输入输出、融合排序与引用输出契约。

### Modified Capabilities

- （无）

## Impact

- 数据库 schema：需要确保 GBrain/ClawMem 表结构对齐（尤其是 MCP 首次建表 seed 的字段与数组类型推断）。
- MCP 工具：`search_all/memo_search/query_knowledge/search_code` 的内部执行策略与返回字段需要统一，避免“同一能力多套实现”导致结果不一致。
- 性能与可控性：新增实体扩展召回与融合排序逻辑；需要提供限流/上限（TopK、扩展实体数、最大扩展候选数）以避免查询膨胀。
