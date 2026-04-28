## ADDED Requirements

### Requirement: Kind-based Routing
系统 SHALL 支持基于指令 `kind` 元数据的路由规则。

#### Scenario: 路由记忆事件到正确的轨道
- **WHEN** `Text2MemInstruction` 包含 `kind: "memory"` 且未指定 `trackId`
- **THEN** MemoryRouter 使用 `kind_match` 规则将其路由到 `track-insight`

#### Scenario: Kind 规则优先级
- **WHEN** 配置中有多个匹配规则（文件后缀、内容关键词、kind）
- **THEN** `kind_match` 规则在现有规则之后评估，遵循现有优先级

### Requirement: Backward Compatibility
系统 SHALL 保持现有路由行为不变。

#### Scenario: 现有指令继续工作
- **WHEN** 现有代码发送不包含 `kind` 的指令
- **THEN** MemoryRouter 继续使用现有逻辑（文件后缀、内容关键词、默认轨道）

#### Scenario: 显式 trackId 覆盖
- **WHEN** 指令明确指定了 `trackId`
- **THEN** MemoryRouter 使用指定的 `trackId`，忽略 `kind` 规则

### Requirement: Configurable Rules
系统 SHALL 允许通过配置文件自定义 `kind` 到轨道的映射。

#### Scenario: 自定义记忆轨道
- **WHEN** 配置文件包含 `kind_match` 规则将 "memory" 映射到自定义轨道
- **THEN** MemoryRouter 使用自定义轨道而非默认的 `track-insight`

#### Scenario: 添加新的 Kind 类型
- **WHEN** 配置文件添加新的 `kind_match` 规则（如 "habit" → "track-insight"）
- **THEN** MemoryRouter 支持新的 kind 类型（IntegrationHub 可以在后续 phases 中使用）
