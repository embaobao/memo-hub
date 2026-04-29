# Text2Mem Protocol

最后更新：2026-04-29

Text2Mem 是 MemoHub 内部执行协议，不作为 CLI/MCP 对外心智。当前产品层以 `CanonicalMemoryEvent`、`MemoryObject` 和 `ContextView` 为主。

## 当前定位

- 对外写入：`CanonicalMemoryEvent`
- 对外查询：命名 `ContextView`
- 内部执行：`Text2MemInstruction`
- 标准结果：`Text2MemResult`

## 外部写入模型

```typescript
type CanonicalMemoryEvent = {
  source: string;
  channel: string;
  kind: "memory";
  projectId: string;
  confidence: "reported" | "observed" | "inferred" | "provisional" | "verified";
  payload: {
    text: string;
    category?: string;
    tags?: string[];
    file_path?: string;
    metadata?: Record<string, unknown>;
  };
};
```

## 记忆对象模型

```typescript
type MemoryObject = {
  id: string;
  contentHash: string;
  state: "raw" | "curated" | "conflicted" | "archived";
  domains: string[];
  scope: "self" | "project" | "global";
  source: string;
  projectId?: string;
  actorId?: string;
  content: {
    text: string;
  };
  links?: Record<string, string[]>;
  metadata?: Record<string, unknown>;
};
```

## 查询视图

当前命名视图：

- `agent_profile`
- `recent_activity`
- `project_context`
- `coding_context`

查询层级：

- `self`
- `project`
- `global`

默认融合策略：先查自己，再查项目，再查全局，并保留来源解释。

## 内部操作

Text2Mem 仍可作为内部原子操作集合使用：

- `ADD`
- `RETRIEVE`
- `UPDATE`
- `DELETE`
- `MERGE`
- `CLARIFY`
- `LIST`
- `EXPORT`
- `DISTILL`
- `ANCHOR`
- `DIFF`
- `SYNC`

这些操作不要求一一暴露为 CLI/MCP 命令。

## 接口边界

- CLI/MCP 对外使用 `CanonicalMemoryEvent`、命名 `ContextView` 和配置工具。
- 内部执行细节必须封装在统一运行时或 projection 层。
- 配置结构演进通过 `configVersion` 管理。
