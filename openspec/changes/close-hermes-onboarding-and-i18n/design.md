## Overview

本变更聚焦四个今天必须落地的目标：

1. `system.lang=auto` 在真实开发机上表现正确。
2. Hermes 接入后具备“治理自己的渠道与记忆”的正式能力。
3. 测试验证链路统一使用测试渠道，并能安全 dry-run / clean。
4. 渠道治理模型内外全部切换为 `actor-first`，不保留旧字段兼容层。

边界约束：

- 不引入旧向量库兼容逻辑。
- 不让 Hermes 或人工治理依赖“手记一个 channelId 再操作”。
- `rebuild-schema` 只保留统一治理接口；旧存量数据如何接入/迁移，留给后续 adapter / 接入层。
- 不把 channel registry 继续扩展成重量级后台系统；本轮只做能支撑 Hermes 首次接入与测试治理的最小治理面。
- 不保留 `ownerAgentId`、`--agent` 作为渠道治理默认语义；治理模型一次性切换为 `actor`。

## I18n Resolution

### Language Model

`system.lang` 只支持三个值：

```text
zh
en
auto
```

解析优先级固定为：

```text
1. CLI 显式参数 --lang
2. 配置值 zh / en
3. 配置值 auto -> 系统语言探测
4. MEMOHUB_LANG / LC_ALL / LC_MESSAGES / LANG
5. 默认中文
```

### macOS Auto Detection

在 macOS 上，`auto` 不应只看 `LANG` / `LC_*`。原因是很多本地终端会暴露 `C.UTF-8` 或 `en_US.UTF-8`，但系统首选语言实际是中文。

因此：

- macOS 优先读取系统语言偏好
- 读取失败时再回退到 `Intl locale` 与 shell locale
- 如果仍无法判断，默认中文

目标不是做完整国际化框架，而是确保 `auto` 在当前项目语义里可信。

## Hermes Self-governance Model

### Core Principle

Hermes 接入 MemoHub 后，不只是“能写入记忆”，而是“能治理自己的渠道与记忆资产”。

这意味着 Hermes 应能直接完成：

- 查看自己当前有哪些渠道
- 知道哪个是主渠道、哪个是测试渠道、哪个最近活跃
- 恢复自己的主渠道
- 针对自己的测试渠道做 dry-run 和清理
- 查询自己的长期记忆、近期活动、项目上下文和代码上下文

治理语义必须以 `actor` 为中心，而不是以裸 `channelId` 为中心。

这个“自治理”是轻量治理，不等于引入复杂审批、权限或工作流系统。MemoHub 只需要让 Hermes 知道“我有哪些渠道、我正在用哪个、哪些是测试的、我怎么排障和清理”，不需要把渠道中心做成独立后台产品。

### Identity Model

为了后续支持 IDE 多 Agent、Hermes 多 profile、adapter 实例和跨工具记忆治理，本轮统一身份模型如下：

```text
actorId
agentId
sessionId
channelId
projectId
workspaceId
taskId
```

语义如下：

- `actorId`: 默认治理主体、角色主体，例如 `hermes`、`codex`、`gemini`、`vscode`
- `agentId`: 执行实例，表示该 actor 在某次运行中实际使用的执行者
- `sessionId`: 当前运行会话
- `channelId`: 当前治理挂载对象

其中：

- 人类治理与默认查询以 `actor` 为主
- `agent` 是细分维度，不是默认治理入口
- `session/channel` 是运行挂载，而不是共享边界

当前实现要求 Hermes 先以 `actorId=hermes` 做单主体治理；未来如引入多个执行实例或 profile，可通过 `agentId` 进一步细分，而不需要重新推翻治理模型。

这意味着：

- Hermes 今天可以直接按 `actor=hermes` 管理自己
- 未来 Hermes 可以带多个 `agentId`
- IDE 多 Agent 模式可以升级为 `actor=vscode + agent=workspace:memo-hub` 或 `actor=vscode + agent=planner`

### Context Binding Model

仅有 identity 还不够。为了避免不同来源对同一项目、仓库、分支、session、文件路径和工作流对象生成不一致标识，系统还需要统一上下文绑定模型。

最小上下文绑定层建议如下：

```text
projectId
projectName
repoId
repoRemote
workspaceId
branch
commitSha
taskId
workflowType
clarificationState
compressionState
filePath
repoRelativePath
```

这些字段分成三类：

- 治理主键：`actorId`、`projectId`、`purpose`
- 绑定键：`agentId`、`sessionId`、`channelId`、`workspaceId`、`repoId`、`branch`
- 查询补全键：`taskId`、`workflowType`、`filePath`、`repoRelativePath`、`clarificationState`、`compressionState`

原则：

- 保留原始上报值
- 生成标准化绑定值
- 查询默认使用标准化值
- 诊断时允许回看原始值

### Governance Selectors

所有清理和治理应支持以下选择器组合：

```text
actorId
agentId
source
projectId
purpose
status
channelId
```

推荐优先级：

```text
actor -> project -> purpose -> status -> explicit channelId
```

也就是说，以下语义优于“手写 channelId”：

```text
清理 Hermes 的所有 test 渠道
清理 Hermes 在 memo-hub 项目下的 test 渠道
查看 Hermes 当前 active / primary / session / test 渠道
```

当前最小实现必须保证 `actorId` 单独就能工作；`agentId` 作为细分维度，不要求今天全部暴露到 CLI 主入口。

### Channel Governance Rename

本轮采用方案 B，直接完成渠道治理模型的内外统一重命名：

```text
ownerAgentId -> ownerActorId
--agent      -> --actor          (channel/data 治理入口)
MCP ownerAgentId -> ownerActorId
sessionContext.ownerAgentId -> sessionContext.ownerActorId
```

要求：

- 不保留旧字段兼容层。
- 不接受旧 MCP 入参别名。
- 不保留旧 CLI 参数别名。
- 不做旧 registry 状态文件迁移逻辑。

换句话说，本轮之后：

- 渠道治理默认按 `actor` 工作。
- `agent` 只保留给执行实例语义，例如 summarize/clarification 等执行者字段。
- Hermes、CLI、MCP、Skill、文档全部统一使用新模型。

### Write Mounting Rule

所有写入必须满足以下规则之一：

```text
1. 显式提供 channel 挂载
2. 当前 MCP/CLI 会话已经绑定渠道，写入继承该渠道
```

不再鼓励“只有 source/projectId 但没有明确渠道挂载”的自由写入语义。原因是：

- 无法可靠治理
- 无法可靠回放
- 无法明确区分主渠道、测试渠道、会话渠道和 adapter 渠道

进一步要求：

- 写入时至少要让系统知道它属于哪个 `actor`、哪个 `channel`、哪个 `project`
- 代码相关写入应尽可能附带 repo / branch / file 绑定
- OpenSpec、澄清、压缩、同步等治理行为应在字段上显式标识，而不是只靠正文推断

Hermes 可以依赖“先恢复主渠道，再写入”的标准链路；IDE 或 adapter 可以依赖自动绑定或适配层挂载。

### Standard Hermes Onboarding Chain

Hermes 的首次真实接入链路固定如下：

```text
1. 读取 memohub://tools
2. 查看 Hermes 当前已有渠道
3. 恢复或创建 Hermes 主渠道
4. 查询 agent_profile / recent_activity
5. 查询 project_context / coding_context
6. 写入新事实或任务结果
7. 如有冲突，创建或写回 clarification
8. 使用 logs / data status / test cleanup 做排障与治理
```

CLI 侧与 MCP 侧都应围绕这条链路提供帮助，而不是把 `inspect` 之类的工程诊断入口放在最前面。

## Test-channel Governance

### Standard Test Convention

所有测试和验证写入统一使用测试用途：

```text
purpose=test
```

推荐命名示例：

```text
hermes:test:memo-hub:first-onboarding
codex:test:memo-hub:query-regression
vscode:test:memo-hub:workspace-sync
```

### Cleanup Model

测试清理默认遵循：

```text
1. 先 dry-run
2. 优先按 actor + purpose=test 清理
3. 其次按 project + purpose=test 清理
4. 最后才允许显式 channelId 清理
```

换句话说，`channelId` 是底层定位字段，不是推荐的治理主入口。

同时需要重申：`purpose=test` 解决的是测试隔离和治理定位，不改变记忆对象的 visibility 语义；共享与读取边界仍由 scopes + visibility 控制。

### Rebuild-schema

`rebuild-schema` 仍保留，但只作为统一治理接口：

- CLI：`data rebuild-schema`
- MCP：`memohub_data_manage action=rebuild_schema`

本变更不讨论旧向量库兼容，也不在新架构里增加兼容分支。接入层、适配层或后续迁移流程如需处理旧存量库，应在 MemoHub 之外或适配层中完成。

## Diagnostics And Traceability

### Minimum Problem-location Flow

CLI 需要能帮助人工或 Hermes 快速回答：

- 我当前绑定了哪些渠道？
- Hermes 最近在这个项目里做了什么？
- 我刚写入的记忆为什么没查到？
- 当前日志里有没有写入/查询/治理痕迹？

最小化能力要求：

- `channel list/status`
- `logs query`
- `query agent_profile/recent_activity/project_context/coding_context`
- `data status/clean --dry-run`

如果本轮范围允许，可补一个轻量 trace 入口，例如：

```text
memohub trace channel <selector>
```

但即便暂不新增命令，也应把“如何组合现有命令定位问题”的链路固化到文档和帮助中。

本轮如果时间优先，可不新增 trace 子命令，而是优先让现有 `channel list/status`、`logs query`、`query` 和 `data clean --dry-run` 的输出足够完成问题定位。

## CLI Priority Model

本轮之后，CLI 推荐业务顺序应固定为：

```text
channel
add
query
clarification
logs
data
config
mcp
inspect
summarize
```

含义：

- `channel/add/query/clarification` 是标准业务链路
- `logs/data/config/mcp` 是治理与接入链路
- `inspect/summarize` 是辅助入口，不代表标准主链路

## Verification

本变更完成后，至少要验证：

- macOS + `system.lang=auto` 下 CLI 默认输出符合系统语言预期
- Hermes 可通过非 `channelId` 方式查看和治理自己的测试渠道
- 渠道治理 CLI/MCP/session context 统一切换到 `actor-first`
- 测试写入默认走 `purpose=test`
- Hermes 写入后可通过 `agent_profile` 或 `recent_activity` 稳定读回
- CLI 帮助、文档、skill 与 `memohub://tools` 同步更新
