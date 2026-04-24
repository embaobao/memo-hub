## ADDED Requirements

### Requirement: 双层检索（Low-level 向量召回 + High-level 实体扩展）
系统 MUST 在一次检索中同时执行 Low-level 向量召回与 High-level 实体扩展召回，以补齐“宏观上下文”。

#### Scenario: 向量 TopK 作为细节召回入口
- **WHEN** 用户发起一次跨轨检索
- **THEN** 系统 MUST 分别对 GBrain 与 ClawMem 执行向量召回并返回各自 TopK（K 默认 5，可配置）

#### Scenario: 由 TopK 自举高频实体
- **WHEN** 向量 TopK 结果中存在 entities
- **THEN** 系统 MUST 统计 TopK 内 entities 的频次并选取 TopE（E 默认 3-8，可配置）作为实体扩展的触发集合

### Requirement: 跨轨实体扩展召回
系统 MUST 使用高频实体在另一轨（或本轨）执行扩展召回，将包含这些实体的记录加入候选集合，以实现跨轨联动。

#### Scenario: 代码实体拉起知识上下文
- **WHEN** 查询的向量 TopK 在 ClawMem 中命中实体集合（如函数名/类名）
- **THEN** 系统 MUST 使用该实体集合在 GBrain 中执行扩展召回，并将命中记录加入最终候选集

#### Scenario: 知识实体拉起代码上下文
- **WHEN** 查询的向量 TopK 在 GBrain 中命中实体集合（如库名/领域名词）
- **THEN** 系统 MUST 使用该实体集合在 ClawMem 中执行扩展召回，并将命中记录加入最终候选集

### Requirement: 扩展召回的上限与降级
系统 MUST 为实体扩展召回提供硬上限与降级策略，避免查询膨胀与不可控的全表扫描。

#### Scenario: 扩展候选集合上限
- **WHEN** 扩展召回命中记录超过最大候选上限（默认 200，可配置）
- **THEN** 系统 MUST 截断候选集合并保持稳定的截断策略

#### Scenario: entities 缺失时跳过实体扩展
- **WHEN** 向量 TopK 结果缺失 entities 或 entities 为空
- **THEN** 系统 MUST 跳过 High-level 实体扩展召回，仅返回 Low-level 召回的融合结果

### Requirement: 检索结果必须可追溯（Citation-Ready）
系统 MUST 在检索结果中返回足够的溯源字段，以支持上层 Agent 给出可核验的引用。

#### Scenario: 代码结果返回 filePath 与 symbolName
- **WHEN** 检索结果包含 ClawMem 记录
- **THEN** 系统 MUST 返回 `file_path`，且在可用时返回 `symbol_name`

#### Scenario: 所有结果返回轨道标识与记录标识
- **WHEN** 系统返回任意检索结果
- **THEN** 系统 MUST 返回 `trackId`（或等价轨道字段）与记录 `id`（并在可用时返回 `hash` 与 `timestamp`）
