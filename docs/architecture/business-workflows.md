# MemoHub 业务链路与治理规则

最后更新：2026-05-06

本文件定义 MemoHub 当前正式业务链路。CLI、MCP、Hermes、Skill、IDE 和后续 Connector 都必须以本文档为准。

## 主链路

MemoHub 当前只保留三层业务概念：

```text
Connector -> Channel -> Memory
```

- `Connector`：入口形态，例如 CLI Connector、MCP Connector、Hermes Connector。
- `Channel`：运行身份和上下文挂载。
- `Memory`：统一记忆读写、查询、列表、澄清、日志和治理入口。

## 治理视角

固定三种治理视角：

- `actor`：主体自治理。先查自己的偏好、习惯、近期活动和主渠道。
- `project`：同项目混合上下文。聚合同项目不同 actor 的项目事实、架构约定和共享记忆。
- `global`：全局资产治理。用于跨项目检索、冲突检查、测试清理、归档恢复和审计。

默认查询顺序：

```text
self -> project -> global
```

## 身份与上下文规则

### 归属层

- `actorId`：记忆归属主体，也是默认治理主体。
- `agentId`：执行实例或 profile，可选，不是默认治理入口。

### 挂载层

- `channelId`
- `source`
- `sessionId`
- `taskId`
- `purpose`

### 上下文层

- `projectId`
- `workspaceId`
- `repoId`
- `branch`
- `commitSha`
- `filePath`

规则：

- 写入必须显式挂载 `channelId`，或继承当前已绑定 channel。
- `channel` 不是共享边界，只是运行挂载。
- 跨 actor 聚合不得丢失来源、时间、项目和原始归属。
- 测试写入统一使用 `purpose=test`。

## 标准业务链路

```text
1. Connector 声明 actor/source/project 等上下文
2. 打开或恢复 channel
3. 调用 Memory 写入或查询
4. Memory 内部归一、投影、存储
5. 结果按 self/project/global 返回
6. 冲突通过 clarification -> resolution 闭环处理
7. 排障通过 channel、logs、data dry-run 完成
```

## 写入规则

第一阶段统一支持以下纯记忆类型：

- `preference`
- `habit`
- `activity`
- `project_fact`
- `clarification`

Hermes 当前用确定性规则从对话中提取这些候选记忆，避免强依赖额外总结 Agent。

写入时要求：

- 优先提供 `actorId`、`source`、`projectId`、`channelId`
- 会话相关信息补充 `sessionId`、`taskId`
- 代码相关信息补充 `filePath`、`repoId`、`branch`
- 冲突信息不允许静默覆盖，必须进入 clarification 治理

## 读取规则

支持的命名视图：

- `agent_profile`
- `recent_activity`
- `project_context`
- `coding_context`

返回结构固定包含：

- `selfContext`
- `projectContext`
- `globalContext`
- `conflictsOrGaps`

`list` 的默认人类视图不是原始对象转储，而是按 `actor` 聚合的概览：

- 每个 actor 的记忆数量
- 最近一条记忆
- 关联项目
- 下一步筛选提示

## 澄清规则

- 冲突记忆允许存在，但不允许无痕覆盖。
- 用户纠正、项目约定修正、记忆冲突都必须通过 `clarification create` / `clarification resolve` 闭环治理。
- 已澄清结论会成为后续查询优先返回的可检索记忆，同时保留历史痕迹。

## Hermes 首次闭环

Hermes 第一条真实闭环固定为：

```text
setup
  -> initialize(open primary or test channel)
  -> prefetch(actor/project/global)
  -> sync_turn(write durable memory)
  -> query/list/logs
  -> clean dry-run for purpose=test
```

验证重点：

- Hermes 不使用私有数据源
- Hermes 与 CLI/MCP 共享同一 Memory service
- Hermes 可以读取自己的习惯、近期活动和项目事实
- Hermes 可以在 `purpose=test` 下安全验证和清理

## 非本提案范围

以下内容保持独立提案推进，不混入 Hermes 纯记忆闭环：

- Git 代码资产层
- AST / 依赖图 / npm 私有源分析
- 多存储后端重构
- 大规模总结 Agent 编排
