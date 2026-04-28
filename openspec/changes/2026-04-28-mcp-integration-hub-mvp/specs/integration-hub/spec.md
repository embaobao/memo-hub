## ADDED Requirements

### Requirement: External Event Envelope Validation
系统 SHALL 提供一个 Integration Hub，接受来自 Hermes、IDE、MCP 客户端和其他可信源的外部事件，使用稳定的事件包格式。

#### Scenario: 摄取 Hermes 记忆事件
- **WHEN** Hermes 发送一个 `memory` 事件，包含 `source`、`channel`、`projectId`、`confidence` 和 `payload`
- **THEN** Integration Hub 验证事件包，将实质内容写入 CAS，并将事件投影到 `track-insight` 的 `Text2MemInstruction`

#### Scenario: 拒绝无效外部事件
- **WHEN** 外部事件缺少必需字段，如 `source`、`kind`、`projectId` 或 `payload`
- **THEN** Integration Hub 在分发任何 Text2Mem 指令之前拒绝事件，返回明确的错误信息

#### Scenario: 拒绝不支持的事件类型
- **WHEN** 外部事件的 `kind` 不是 "memory"（MVP 只支持这一种）
- **THEN** Integration Hub 拒绝事件，返回错误说明不支持的类型

### Requirement: Text2Mem Projection Boundary
系统 SHALL 将接受的外部事件转换为一个或多个 `Text2MemInstruction` 对象，并通过 `MemoryKernel.dispatch()` 写入。

#### Scenario: 投影记忆事件
- **WHEN** Hermes 发送一个 `memory` 事件
- **THEN** 系统生成一个 `ADD` 指令，包含源元数据和 CAS 引用，但不指定 `trackId`（由 MemoryRouter 决定）

#### Scenario: 防止直接轨道写入
- **WHEN** 集成投影器需要持久化投影
- **THEN** 它使用 `MemoryKernel.dispatch()` 而非直接调用 track provider 或 storage backend

### Requirement: CAS-backed Deduplication
系统 SHALL 使用 `storage-flesh` CAS 哈希作为实质事件内容的主体标识。

#### Scenario: 相同内容去重
- **WHEN** 多个事件包含相同的 `payload.text`
- **THEN** 所有投影引用同一个 `contentHash`，主体在 CAS 中只存储一次

#### Scenario: 计算内容哈希
- **WHEN** Integration Hub 处理一个事件
- **THEN** 它计算 `payload.text` 的哈希，写入 CAS，并将 `contentHash` 包含在 `Text2MemInstruction` 中

### Requirement: Event Metadata Preservation
系统 SHALL 保留外部事件的所有元数据，以便后续查询和过滤。

#### Scenario: 保留源和频道信息
- **WHEN** 外部事件包含 `source`、`channel`、`sessionId`、`taskId`
- **THEN** 这些字段被包含在 `Text2MemInstruction.payload` 中，并可在查询时用于过滤

#### Scenario: 添加缺失的时间戳
- **WHEN** 外部事件不包含 `occurredAt` 字段
- **THEN** Integration Hub 自动添加当前时间作为 `occurredAt`

### Requirement: Error Handling
系统 SHALL 提供清晰的错误信息和错误码。

#### Scenario: 缺少必需字段
- **WHEN** 事件缺少 `source`、`kind`、`projectId`、`confidence` 或 `payload.text`
- **THEN** 系统返回错误码 `MISSING_REQUIRED_FIELD` 和明确的消息

#### Scenario: 不支持的事件类型
- **WHEN** `kind` 不是 "memory"
- **THEN** 系统返回错误码 `UNSUPPORTED_KIND` 和支持的类型列表

#### Scenario: CAS 写入失败
- **WHEN** CAS 写入操作失败
- **THEN** 系统返回错误码 `CAS_WRITE_FAILED` 并包含原始错误信息
