## ADDED Requirements

### Requirement: 统一实体锚点字段
系统 MUST 在所有记忆记录中存储 `entities: string[]` 作为“伪图谱锚点”，用于跨轨关联与高层检索扩展。

#### Scenario: 写入知识记录时写入 entities 字段
- **WHEN** 用户通过任意写入入口写入一条知识记录（GBrain）
- **THEN** 系统 MUST 写入 `entities` 字段（允许为空数组，但字段不可缺失）

#### Scenario: 写入代码记录时写入 entities 字段
- **WHEN** 用户通过任意写入入口写入一条代码记录（ClawMem）
- **THEN** 系统 MUST 写入 `entities` 字段且至少包含可用的代码实体（例如顶层函数名/类名/导出符号名）

### Requirement: 实体的基础规范化与约束
系统 MUST 将 `entities` 视为“字符串集合”并进行去重与清洗，避免脏数据污染检索。

#### Scenario: entities 清洗与去重
- **WHEN** 写入入口收到包含空字符串、重复值或仅空白字符的 entities
- **THEN** 系统 MUST 去除空值与空白值，并对重复实体去重后再落库

#### Scenario: entities 数量上限
- **WHEN** 写入入口收到的 entities 数量超过配置上限（默认 64）
- **THEN** 系统 MUST 截断到上限，并保持截断策略稳定（例如按抽取顺序保留前 N 个）

### Requirement: 代码实体抽取的最小保证
当写入代码轨（ClawMem）时，系统 MUST 进行最小可用的实体抽取以支撑跨轨检索联动。

#### Scenario: 代码实体抽取成功
- **WHEN** 写入的代码片段包含可识别的顶层符号（如函数/类/导出声明）
- **THEN** 系统 MUST 将这些符号名加入 entities（至少包含 1 个）

#### Scenario: 代码实体抽取失败时的退化
- **WHEN** 代码实体抽取失败或无法识别任何符号
- **THEN** 系统 MUST 仍写入 `entities: []`，且写入流程 MUST 不因抽取失败而中断

### Requirement: 知识实体抽取的最小保证
当写入知识轨（GBrain）时，系统 SHALL 尽可能抽取轻量实体以支撑高层检索扩展，但不得阻塞写入主流程。

#### Scenario: 轻量实体抽取成功
- **WHEN** 写入的文本包含可识别的候选实体（例如驼峰词、带点标识符、版本号、缩写）
- **THEN** 系统 SHALL 将候选实体加入 entities

#### Scenario: 轻量实体抽取失败时的退化
- **WHEN** 文本实体抽取失败或无法识别任何候选实体
- **THEN** 系统 MUST 写入 `entities: []`，且写入流程 MUST 不因抽取失败而中断

### Requirement: 实体扩展兜底索引（可选能力）
当底层存储无法稳定支持“数组包含过滤”时，系统 MUST 支持启用一个派生索引以完成实体扩展召回。

#### Scenario: 启用实体索引后可按实体扩展召回
- **WHEN** 系统启用 `entity_index`（或等价机制）并写入包含 entities 的记录
- **THEN** 系统 MUST 可通过 entity 查询到关联的记录标识符集合，用于检索阶段扩展召回
