## Overview

本变更把 `channel` 从“事件字段”升级为“受管理接入对象”。MemoHub 以后不再只记录 `source + channel`，而是维护一个 channel registry，记录渠道与 Agent、project、workspace、session、purpose、状态之间的绑定关系。

这层能力的目标不是增加用户操作步骤，而是让：

- Hermes 可以恢复自己的主渠道和历史会话渠道
- IDE 可以无感自动绑定当前 workspace 渠道
- CLI/MCP 可以对渠道做可审计状态管理和安全清理
- QueryPlanner 可以在不破坏 self/project/global 共享模型的前提下，获得更可靠的 provenance 和排序依据

## Core Model

Channel registry 记录的不是记忆正文，而是接入治理对象。最小字段建议如下：

```text
channelId
ownerAgentId
source
purpose
projectId
workspaceId
sessionId
taskId
status
isPrimary
createdAt
lastSeenAt
tags
metadata
```

约束：

- `ownerAgentId` 表示渠道归属，例如 `hermes`、`codex`、`vscode`。
- `purpose` 至少支持 `primary`、`session`、`test`、`adapter`、`import`。
- `status` 至少支持 `active`、`idle`、`closed`、`archived`。
- 一个 `ownerAgentId + projectId + workspaceId + purpose=primary` 同时只能有一个激活主渠道。
- `channelId` 不应是完全自由字符串，应经过校验或由系统生成。

推荐命名：

```text
hermes:primary:memo-hub
hermes:session:memo-hub:2026-04-30-docs
hermes:test:memo-hub
vscode:workspace:memo-hub
vscode:session:memo-hub:2026-04-30T14
adapter:gitlab:memo-hub
```

## Responsibility Boundaries

为避免后续治理失焦，需要固定下面四个概念：

- `channel`: 来源会话与接入治理对象，用于身份绑定、状态、审计、清理和默认上下文。
- `scope`: 记忆所属边界，例如 self/project/workspace/session/task/global。
- `visibility`: 共享与可见性边界，例如 private/shared/global。
- `provenance`: 事件来源、来源渠道、来源适配器、时间、上游 ID、repo/commit/registry 等可追溯信息。

结论：

- channel 不是共享边界，也不是权限边界。
- 跨项目共享是否允许，由 scope + visibility 决定。
- channel 主要影响治理、恢复、排序提示和过滤能力。

## Binding Flows

### Hermes / Long-running Agent

Hermes 需要显式可管理的绑定能力：

```text
1. 查询自己已有的主渠道和近期会话渠道
2. 如果存在主渠道，恢复并绑定
3. 如果不存在，按命名规则创建主渠道
4. 当前会话可选择新建 session 渠道并挂到主渠道
5. 后续 ingest/query 默认继承当前绑定渠道
6. 会话结束时更新 lastSeenAt/status
```

Hermes 既要能通过治理工具读取结构化渠道状态，也要能通过记忆查询理解“我上次在哪个项目上工作、默认渠道是什么、最近用了哪些渠道”。

### IDE / Workspace Entry

IDE 不应要求显式注册，否则体验会明显变差。推荐自动绑定：

```text
1. IDE 连接 MemoHub
2. MemoHub 根据 source + projectId + workspaceId 查找 primary/workspace 渠道
3. 找到则恢复，找不到则自动创建
4. 后续写入/查询默认继承当前 workspace 渠道
5. 如需更细粒度追踪，可再自动挂一个 session 渠道
```

IDE 用户通常不感知 channel 概念；只有治理、排障、清理和审计时才暴露。

## Runtime Surfaces

### CLI

建议新增最小命令集：

```text
memohub channel open
memohub channel list
memohub channel status <channelId>
memohub channel close <channelId>
memohub channel use <channelId>
```

后续 `data clean --channel` 只应作用于 registry 中存在的渠道，并返回结构化状态与安全提示。

### MCP

建议新增最小工具集：

```text
memohub_channel_open
memohub_channel_list
memohub_channel_status
memohub_channel_close
```

同时 MCP 连接支持“默认渠道上下文”，允许后续 `memohub_ingest_event` 和 `memohub_query` 自动继承当前已绑定渠道，而不是每次手工重复提供。

### Tool Catalog

`memohub://tools` 需要明确返回：

- 当前可用渠道治理工具
- 渠道命名与 purpose 约束
- Hermes 的推荐接入顺序
- IDE 自动绑定说明
- `schemaMismatch` 或 cleanup 限制时的恢复建议

## Query And Sharing

跨项目理解检索仍应遵循 `self -> project -> global`。channel registry 不改变这条主链，只增强来源可信度和治理能力：

- `self` 层优先读取当前 Agent 自己的主渠道、历史会话、长期习惯和近期活动
- `project` 层优先读取当前项目渠道下写入的项目事实、代码知识和依赖情报
- `global` 层聚合跨项目经验，但必须带来源项目与渠道解释

QueryPlanner 后续可以使用 channel metadata 参与排序，例如：

- 当前绑定主渠道权重更高
- 当前 session 渠道最近写入的记录在 `recent_activity` 中权重更高
- 测试渠道默认降权，不影响正式项目上下文

但它不应让 channel 覆盖 visibility 或 scope 约束。

## Relation To Adapters

本变更先于 source adapters 大规模实现。原因是 adapter 解决“怎么接进来”，而 channel registry 解决“接进来以后归谁、挂哪、怎么恢复、怎么治理”。后续 GitLab、npm、private registry、IDE scanner 等 adapter 都必须输出符合 channel registry 规则的标准事件，而不是继续传播裸字符串渠道。

## Verification

- 单元测试覆盖 channel naming、primary uniqueness、auto-binding 和 close/use 约束。
- 集成测试覆盖 Hermes 恢复主渠道、IDE 自动恢复 workspace 渠道、默认上下文继承和按渠道清理权限边界。
- 文档与 `memohub://tools` 同步更新，明确正常接入不要默认清空数据。
