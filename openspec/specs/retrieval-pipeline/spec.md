# Capability: Retrieval Pipeline

## Purpose
定义检索流水线的 Pre (预处理), Exec (执行), Post (后处理) 三阶段流程，支持多路并行召回与结果融合。

## Requirements

### Requirement: Pre 阶段必须提取意图与显式实体
系统 MUST 在执行检索前对 query 做预处理，以得到检索意图与显式实体集合。

#### Scenario: 识别检索意图
- **WHEN** 用户提交任意 query
- **THEN** 系统 MUST 将意图归类为 `code` / `knowledge` / `mixed` 三类之一（用于后续轨道权重与通道选择）

#### Scenario: 提取显式实体
- **WHEN** query 中包含可识别的实体线索（如函数名、类名、包名、文件路径片段、带点标识符）
- **THEN** 系统 MUST 提取这些实体并输出为 `queryEntities`

### Requirement: Exec 阶段必须支持多路召回并行执行
系统 MUST 在执行阶段并行执行多路召回，并将所有通道的候选集合统一收敛为一个候选池。

#### Scenario: 向量召回作为基础通道
- **WHEN** 系统进入 Exec 阶段
- **THEN** 系统 MUST 至少执行向量召回通道（按轨道分别召回，K 可配置）

#### Scenario: 词法召回作为可插拔通道
- **WHEN** 系统配置启用词法召回通道（Lexical/FTS）
- **THEN** 系统 MUST 执行该通道并将命中结果加入候选池

#### Scenario: 实体扩展召回作为可插拔通道
- **WHEN** Pre 阶段或向量 TopK 结果提供了可用实体集合
- **THEN** 系统 MUST 执行实体扩展召回通道并将命中结果加入候选池

### Requirement: Post 阶段必须融合去重并按综合分排序
系统 MUST 在 Post 阶段对候选池进行融合、去重与排序，并输出稳定的 TopN。

#### Scenario: 按 hash 或 id 去重
- **WHEN** 候选池中存在重复记录（同 id 或同 hash）
- **THEN** 系统 MUST 去重后再进入排序

#### Scenario: 综合评分排序
- **WHEN** 系统对候选池排序
- **THEN** 系统 MUST 使用至少以下因素计算综合分：向量相似度、实体命中覆盖度、轨道权重（基于意图）、新鲜度（可选）

### Requirement: 输出必须包含统一引用字段
系统 MUST 在最终输出中包含统一的引用字段集合，以支持上层系统对结果溯源与展示。

#### Scenario: 统一输出字段
- **WHEN** 系统返回检索结果列表
- **THEN** 系统 MUST 对每条结果输出：`trackId`、`id`、`text`、`timestamp`，并在可用时输出 `file_path`、`symbol_name`、`hash`、`entities`

### Requirement: 运行时限制必须可配置
系统 MUST 提供可配置的运行时限制参数以控制成本与性能，并为未配置场景提供默认值。

#### Scenario: 参数默认值生效
- **WHEN** 用户未显式配置检索参数
- **THEN** 系统 MUST 使用默认值（例如各轨向量 TopK=5，TopE=3-8，最大扩展候选数=200，最终 TopN=10）
