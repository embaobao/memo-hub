## ADDED Requirements

### Requirement: Event Ingestion Tool
系统 SHALL 暴露一个 MCP 工具用于摄取外部事件。

#### Scenario: 摄取有效的记忆事件
- **WHEN** MCP 客户端调用 `memohub_ingest_event`，包含有效的 `MemoHubEvent`
- **THEN** 系统返回成功，包含生成的事件 ID 和 contentHash

#### Scenario: 摄取无效事件
- **WHEN** MCP 客户端调用 `memohub_ingest_event`，包含缺少必需字段的事件
- **THEN** 系统返回错误，包含错误码和描述性消息

#### Scenario: 摄取不支持的事件类型
- **WHEN** MCP 客户端调用 `memohub_ingest_event`，`kind` 不是 "memory"
- **THEN** 系统返回错误，说明 MVP 只支持 "memory" 类型

### Requirement: Unified Query Tool
系统 SHALL 暴露一个统一的 MCP 查询工具，支持多种查询类型。

#### Scenario: 查询项目记忆
- **WHEN** MCP 客户端调用 `memohub_query`，`type: "memory"`，包含 `projectId` 和可选的 `query`
- **THEN** 系统搜索 `track-insight` 并返回匹配的记忆，包含源、项目、会话和证据元数据

#### Scenario: 查询编码上下文
- **WHEN** MCP 客户端调用 `memohub_query`，`type: "coding_context"`，包含 `projectId` 和可选的 `sessionId`、`taskId`
- **THEN** 系统聚合相关的记忆、会话状态和源引用，返回用于代码生成的完整上下文

#### Scenario: 按会话或任务过滤
- **WHEN** 查询包含 `sessionId` 或 `taskId` 参数
- **THEN** 系统过滤结果，只返回匹配指定会话或任务的记录

#### Scenario: 限制结果数量
- **WHEN** 查询包含 `limit` 参数
- **THEN** 系统返回最多指定数量的结果

### Requirement: Backward Compatibility
系统 SHALL 保持现有 MCP 工具正常工作。

#### Scenario: 现有工具不受影响
- **WHEN** 客户端使用现有的 `memohub_add` 或 `memohub_search` 工具
- **THEN** 工具继续正常工作，行为不变

#### Scenario: 新旧工具互操作
- **WHEN** 客户端混合使用新旧工具
- **THEN** 所有工具读写相同的数据，数据一致

### Requirement: Query Result Metadata
系统 SHALL 在查询结果中包含丰富的元数据。

#### Scenario: 返回源和置信度信息
- **WHEN** 查询返回记忆记录
- **THEN** 每个结果包含 `source`、`channel`、`confidence`、`occurredAt` 等元数据

#### Scenario: 返回 CAS 引用
- **WHEN** 查询返回包含实质内容的记录
- **THEN** 结果包含 `contentHash`，客户端可以从 CAS 检索完整内容

#### Scenario: 返回项目和会话上下文
- **WHEN** 查询返回记录
- **THEN** 结果包含 `projectId`、可选的 `sessionId` 和 `taskId`
