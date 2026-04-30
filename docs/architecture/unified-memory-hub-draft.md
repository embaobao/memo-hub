# 统一记忆中枢草案

## 状态

- 状态: Draft
- 日期: 2026-04-29
- 目的: 归档当前关于 MemoHub 统一记忆中枢的讨论结论，替代“多轨”作为主架构概念

## 背景

MemoHub 的目标已经不再只是代码记忆或单个 Agent 的会话记忆，而是要成为所有 AI 场景下的统一记忆中枢。数据来源包括 Hermes、Codex、IDE、MCP、CLI、代码扫描器以及用户手工输入。代码场景是高复杂度场景之一，但不应被设计成系统唯一主轴。

按入口层维度划分处理路径会把系统组织成几个并列桶，导致入口、查询和治理围绕路径名展开。这不适合跨 Agent、跨项目、跨知识类型的统一记忆系统，因此主架构应围绕统一对象模型、处理域和命名视图展开。

## 当前共识

### 1. MemoHub 是统一记忆中枢

MemoHub 应被定义为一个面向多 AI 场景的项目认知和记忆中枢，负责：

- 多渠道记忆接入
- 多种结构化投影
- 多存储索引协同
- 分层检索与上下文拼装
- 证据整合、冲突检查和澄清
- 浏览、备份、恢复和审计

### 2. 对外统一，对内多投影

对外只保留统一接入和统一查询心智，不再强调轨道。

对内仍然需要多种处理语义，但应通过投影和处理策略表达，而不是通过“多轨桶”表达。第一阶段建议聚焦以下四类处理域：

- `code-intelligence`
- `project-knowledge`
- `task-session`
- `habit-convention`

### 3. 代码记忆是统一中枢的一部分

代码记忆不能被压平成普通文本记忆。对于代码场景，需要同时维护：

- 原文和快照
- AST / symbol
- import/export 和依赖关系
- 调用链、组件关系、API 关系
- 与业务知识、任务、会话、Agent 行为的关联

因此底层必须允许多种索引和组织形式并存，但这些结果都要归属到统一的记忆模型中。

## 建议的核心模型

### Canonical Memory Event

所有入口最终都应归一成统一事件模型，至少包含：

- `source`: 数据来源，例如 Hermes、Codex、IDE、MCP、CLI
- `actor`: 产生或使用记忆的主体
- `subject`: 记忆所描述的对象
- `scope`: 归属范围
- `visibility`: 可见性
- `domain`: 记忆领域
- `state`: 当前治理状态
- `timestamp`: 时间信息
- `content`: 原始内容或结构化内容

### Scope

记忆不是只属于一个桶，而是挂在统一 scope 图中。第一阶段建议支持：

- `agent`
- `session`
- `task`
- `project`
- `workspace`
- `global`

### Visibility

第一阶段建议采用三级可见性：

- `private`
- `shared`
- `global`

### State

为了支持整理、冲突检查和澄清，建议引入最小治理状态：

- `raw`
- `curated`
- `conflicted`
- `archived`

## 查询模型

### 分层共享

当前讨论已确认查询共享不通过复制实现，而通过检索层的可见域联合查询实现。默认共享层次为：

1. `self`
2. `project`
3. `global`

### 查询策略

当前讨论已确认采用三层同时查询，再按层级加权融合：

- `self`
- `project`
- `global`

默认权重为：

- `self > project > global`

### 返回视图

建议查询结果按视图分层返回，而不是只返回一坨混排结果：

- `self_context`
- `project_context`
- `global_context`
- `conflicts_or_gaps`

## 业务链路

### 1. 写入链路

`Adapter -> Canonical Memory Event -> Projection Pipeline -> Multi-Store -> Governance`

说明：

- Adapter 负责接入 Hermes、IDE、CLI、MCP、扫描器等来源
- 统一归一成标准事件
- 再按 domain 进入不同投影管线
- 最终写入多种存储，并进入治理流程

### 2. 查询链路

`Query Intent -> Scope Resolver -> Self Recall + Project Recall + Global Recall -> Weighted Fusion -> View Assembler`

说明：

- 查询不再以轨道为主心智，而以视图为主心智
- 视图包括 Agent 画像、近期活动、项目上下文、代码上下文、知识脉络等

### 3. 治理链路

`Evidence -> Entity Resolution -> Claim Merge -> Conflict Detection -> Clarification Queue -> Curated Memory`

说明：

- 原始记忆先以证据形式保留
- 再逐步归并实体、整合事实、发现冲突
- 冲突项进入待澄清队列

### 4. 运维链路

`Browse -> Snapshot -> Backup -> Restore -> Audit`

说明：

- 支持查看全局记忆、项目记忆、Agent 记忆
- 支持快照、备份恢复和审计

## 对 Hermes 的意义

Hermes 不是 MemoHub 的唯一记忆拥有者，而是其中一个重要来源和查询视角。

Hermes 的记忆会作为 `source=hermes` 的证据、习惯、活动和任务上下文进入统一记忆中枢，同时 Hermes 也可以查询：

- 自己的长期习惯和近期活动
- 当前项目的共享业务和代码知识
- 其他 IDE 或 Agent 写入的项目记忆
- 全局共享的长期知识和规范

这保证 Hermes 既能保有自身连续记忆，又能继承项目和全局上下文。

## 查询与操作示例

Hermes 画像查询：

```bash
memohub query "我的习惯是什么" --view agent_profile --actor hermes --project memo-hub
```

当前项目活动查询：

```bash
memohub query "我现在都在开发什么" --view recent_activity --actor codex --project memo-hub
```

IDE session 查询：

```ts
{
  view: "recent_activity",
  actorId: "vscode",
  projectId: "memo-hub",
  sessionId: "ide-session-1"
}
```

代码上下文查询：

```bash
memohub query "router 和 MCP query 的关系" --view coding_context --actor hermes --project memo-hub
```

总结操作：

```bash
memohub summarize "Hermes 最近处理了 CLI/MCP 接口一致性和查询链路收敛" --agent hermes
```

抽取操作当前在核心层以 `AgentMemoryOperator.run({ type: "extract", ... })` 提供，后续可接入后台 Agent 或批处理任务：

```ts
await operator.run({
  type: "extract",
  inputMemories,
  sourceAgent: { type: "agent", id: "hermes" },
  provider: "local",
  model: "deterministic-mvp"
});
```

澄清操作：

```bash
memohub clarification create "项目文档说 track 是主模型，但 OpenSpec 要求统一记忆对象为主模型" --agent hermes
```

## 与内部处理切片的关系

当前建议不是简单删除所有处理差异，而是：

- 删除“多轨”作为主架构概念
- 保留内部处理差异
- 用 `domain + projection + strategy` 替代 `track`

内部处理切片不进入 CLI/MCP 业务链路。后续如果复用其逻辑，必须先封装成 domain projection executor，不能把内部切片概念暴露给入口层。

## 可实现性判断

### 当前已落地的最小闭环

截至 2026-04-29，`unified-memory-hub-model` 已落地以下基础能力：

- 协议层：`MemoryObject`、`CanonicalMemoryEvent`、开放 source/domain/scope descriptor。
- 接入层：Hermes、CLI、MCP、IDE、scanner、Gemini/open descriptor 等事件归一。
- 投影层：MemoryObject 到 CAS/Vector/Structured Index 的存储投影，archived 记忆默认不进入向量投影。
- 查询层：`agent_profile`、`recent_activity`、`project_context`、`coding_context` 命名视图，以及 `self/project/global` 分层召回。
- 治理层：`raw/curated/conflicted/archived`、冲突/缺口输出、`ClarificationItem`、`MemoryArtifact`。
- Agent 操作：`summarize/extract/annotate/clarify/review` 合同，MVP 输出保留 operation provenance 和 review state。
- 接口层：CLI/MCP 只暴露统一事件摄取、命名视图查询、Agent 操作和配置管理。

### 第一阶段: 可直接落地

可先实现：

- 统一事件模型
- `scope / visibility / domain / state`
- 多源写入适配
- `self/project/global` 三层召回
- 基础多视图查询
- 备份恢复基础能力

这一阶段可以支持：

- “我是 Hermes，我的习惯是什么”
- “Hermes 最近干嘛了”
- “我现在在开发什么”
- “查询所有 IDE 开发的项目 session”
- “当前项目有哪些共享代码记忆”

### 第二阶段: 复杂但必要

第二阶段再补足：

- 实体归一
- 事实合并
- 冲突检测
- 澄清流程
- 可信知识层

### 第三阶段: 治理增强

后续增强可包括：

- 自动整理与蒸馏
- 多 Agent 协同知识脉络
- 更完整的全局知识图谱
- 更精细的审计和策略控制

## 下一步建议

当前应先定下以下三个一等模型，再进入实现规划：

1. `Canonical Memory Event`
2. `Scope / Visibility / Domain / State`
3. `Query View / Recall Policy`

在这三个模型确定前，不建议继续围绕“多轨保留还是删除”做细节实现。
