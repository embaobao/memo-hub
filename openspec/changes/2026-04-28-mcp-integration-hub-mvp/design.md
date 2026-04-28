## Context

原 `data-stream-integration` 提案范围过大，包括 14 个 MCP 工具、5 个新索引、多会话状态共享等。这个 MVP change 将其拆分为渐进式实现，首先验证核心集成路径。

### 设计原则

1. **最小可行**: 只实现 `memory` 事件类型的投影器
2. **架构尊重**: 不修改 Text2Mem、Track、CAS 核心层
3. **可测量**: 明确性能预算和成功标准
4. **可扩展**: 为后续 phases 预留扩展点

## Goals / Non-Goals

**Goals:**

- 验证外部事件 → Integration Hub → Text2Mem → Query 核心路径
- 让 Hermes 能够通过 MCP 读写项目记忆
- 让 IDE 能够通过 MCP 查询编码上下文
- 保持性能在可接受范围内

**Non-Goals:**

- 实现所有事件类型的投影器（只实现 `memory`）
- 添加额外的 Soul 索引（使用现有向量检索）
- 多会话状态共享和冲突解决
- 便捷的 MCP 包装工具

## Proposed Architecture

```text
Hermes / IDE / MCP Client
        |
        v
MCP Tools (仅 2 个)
  - memohub_ingest_event
  - memohub_query
        |
        v
Integration Hub (新增)
  - 验证 MemoHubEvent
  - CAS 去重
  - 单一投影器：memory → Text2Mem
        |
        v
Text2MemInstruction
  (不指定 trackId，包含 kind: "memory")
        |
        v
MemoryRouter (扩展)
  - 新规则：kind: "memory" → track-insight
        |
        v
MemoryKernel.dispatch()
        |
        v
Tracks
  - track-insight (存储记忆)
        |
        v
storage-flesh CAS + storage-soul 向量检索
```

## Event Envelope

```typescript
type MemoHubEvent = {
  id?: string;                    // 可选：客户端提供的事件 ID
  source: "hermes" | "ide" | "cli" | "mcp" | "external";
  channel: string;                // 频道标识（如 "hermes-memory-center"）
  kind: "memory";                 // MVP 只支持这一种
  projectId: string;
  sessionId?: string;
  taskId?: string;
  confidence: "reported" | "observed" | "inferred";
  occurredAt?: string;            // ISO 8601
  payload: {
    text: string;                 // 记忆内容
    tags?: string[];              // 可选：标签
    metadata?: Record<string, unknown>; // 可选：额外元数据
  };
};
```

**设计决策**：
- `kind` 字段用于路由，而非直接指定 `trackId`
- `payload.text` 是必需的，将存储在 CAS 中
- `sessionId` 和 `taskId` 是可选的，用于过滤和上下文

## Projection Logic

### MVP 单一投影器

```typescript
async projectMemoryEvent(event: MemoHubEvent): Promise<Text2MemInstruction> {
  // 1. 验证必需字段
  if (!event.payload?.text) {
    throw new Error("memory event requires text payload");
  }

  // 2. 计算内容哈希（CAS 去重）
  const contentHash = await cas.write(event.payload.text);

  // 3. 生成 Text2MemInstruction（不指定 trackId）
  return {
    op: "ADD",
    payload: {
      text: event.payload.text,
      contentHash,  // CAS 引用
      source: event.source,
      channel: event.channel,
      kind: "memory",  // ← 用于路由
      projectId: event.projectId,
      sessionId: event.sessionId,
      taskId: event.taskId,
      confidence: event.confidence,
      occurredAt: event.occurredAt || new Date().toISOString(),
      tags: event.payload.tags || [],
      metadata: event.payload.metadata || {},
    },
  };
}
```

**关键点**：
- 不指定 `trackId`，由 `MemoryRouter` 决定
- 所有内容通过 CAS 去重
- 保留原始事件的所有元数据

## MemoryRouter 扩展

### 新增路由规则类型

```typescript
// 在现有 MemoryRouter 中添加
{
  type: "kind_match",
  kind: "memory",
  trackId: "track-insight"
}
```

### 路由决策逻辑

```typescript
// 在 MemoryRouter.route() 中
public route(instruction: Text2MemInstruction): string {
  // ... 现有逻辑 ...

  // 新增：检查 kind 字段
  if (instruction.payload?.kind) {
    const kindRule = this.config.routing?.rules?.find(
      r => r.type === "kind_match" && r.kind === instruction.payload.kind
    );
    if (kindRule) {
      return kindRule.trackId;
    }
  }

  // ... 现有逻辑 ...
}
```

## MCP Surface

### 1. memohub_ingest_event

```typescript
{
  name: "memohub_ingest_event",
  description: "摄取外部事件到 MemoHub",
  inputSchema: {
    type: "object",
    properties: {
      event: {
        type: "object",
        properties: {
          source: { type: "string", enum: ["hermes", "ide", "cli", "mcp", "external"] },
          channel: { type: "string" },
          kind: { type: "string", enum: ["memory"] }, // MVP 只支持 memory
          projectId: { type: "string" },
          sessionId: { type: "string" },
          taskId: { type: "string" },
          confidence: { type: "string", enum: ["reported", "observed", "inferred"] },
          occurredAt: { type: "string", format: "date-time" },
          payload: {
            type: "object",
            properties: {
              text: { type: "string" },
              tags: { type: "array", items: { type: "string" } },
              metadata: { type: "object" }
            },
            required: ["text"]
          }
        },
        required: ["source", "channel", "kind", "projectId", "confidence", "payload"]
      }
    },
    required: ["event"]
  }
}
```

### 2. memohub_query

```typescript
{
  name: "memohub_query",
  description: "统一查询接口",
  inputSchema: {
    type: "object",
    properties: {
      type: {
        type: "string",
        enum: ["memory", "coding_context"],
        description: "查询类型"
      },
      projectId: { type: "string" },
      sessionId: { type: "string" },
      taskId: { type: "string" },
      query: { type: "string" },
      limit: { type: "number", default: 10 }
    },
    required: ["type", "projectId"]
  }
}
```

**查询逻辑**：
- `type: "memory"` → 查询项目记忆（向量检索 + 过滤）
- `type: "coding_context"` → 聚合查询（记忆 + 会话上下文）

## CAS and Soul

### CAS (storage-flesh)

- 所有 `payload.text` 写入 CAS
- 使用 `contentHash` 引用
- 自动去重

### Soul (storage-soul)

- **MVP 不添加新索引**
- 使用现有向量检索
- 通过 `projectId`、`sessionId`、`taskId` 过滤

## Performance Budget

### 基准测量（需要在实施前测量）

```typescript
// 现有基准
const BASELINE_ADD = 0; // TODO: 测量 memohub_add 的 P99
const BASELINE_SEARCH = 0; // TODO: 测量 memohub_search 的 P99
```

### MVP 性能目标

```typescript
const INGEST_EVENT_TARGET = BASELINE_ADD + 50; // ms
const QUERY_TARGET = BASELINE_SEARCH + 100; // ms
```

### 测量计划

1. 在实施前测量现有基准
2. 添加性能监控（`kernel.event` 机制）
3. 每次迭代验证性能预算
4. 如果超出预算，优化或回退

## Error Handling

### Integration Hub 错误

```typescript
class IntegrationHubError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
  }
}

// 错误码
enum ErrorCode {
  INVALID_EVENT = "INVALID_EVENT",
  MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD",
  UNSUPPORTED_KIND = "UNSUPPORTED_KIND",
  CAS_WRITE_FAILED = "CAS_WRITE_FAILED",
  PROJECTION_FAILED = "PROJECTION_FAILED",
}
```

### MCP 错误响应

```typescript
{
  error: {
    code: "INVALID_EVENT",
    message: "Missing required field: projectId",
    details: { event: {...} }
  }
}
```

## Testing Strategy

### 测试金字塔

```
      /\
     /  \    E2E (10%)
    /____\
   /      \  集成测试 (20%)
  /________\
 /          \ 单元测试 (70%)
/____________\
```

### 单元测试 (70%)

- `IntegrationHub.ingest()` 验证逻辑
- `projectMemoryEvent()` 转换逻辑
- CAS 去重逻辑
- MemoryRouter 扩展路由逻辑

### 集成测试 (20%)

- Event → IntegrationHub → Text2Mem
- IntegrationHub → MemoryKernel.dispatch() → Track
- MCP → IntegrationHub → Track

### 端到端测试 (10%)

- Hermes → memohub_ingest_event → memohub_query

### Coverage 目标

- 单元测试覆盖率 > 80%
- 关键路径 100% 覆盖

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|----------|
| MVP 仍然太复杂 | 只实现 memory 类型，其他延后 |
| 性能超出预算 | 建立基准，持续监控，准备回退 |
| 与 MemoryRouter 冲突 | 使用 `kind` 字段而非 `trackId` |
| CAS 去重影响性能 | 测量哈希计算开销，考虑缓存 |
| 现有 MCP 工具受影响 | 保持向后兼容，添加而非替换 |

## Migration Path

### 从现有 MCP 工具迁移

```typescript
// 现有工具（保持不变）
memohub_add({ text, ... })
memohub_search({ query, ... })

// 新工具（推荐用于外部集成）
memohub_ingest_event({ event: {...} })
memohub_query({ type, projectId, query })
```

### 渐进式采用

- Phase 0: 新工具可用，现有工具不变
- Phase 1+: 文档推荐新工具用于外部集成
- 未来: 根据实际使用数据决定是否废弃旧工具

## Future Phases

基于本 MVP 的实际数据，后续独立的 changes：

1. **Phase 1: 扩展投影器** - 添加 repo_analysis, api_capability, habit 投影器
2. **Phase 2: 多会话状态** - 实现状态共享和冲突解决
3. **Phase 3: 结构化索引** - 基于性能数据添加 Soul 索引
4. **Phase 4: 用户体验** - 添加便捷 MCP 工具和改进

每个 phase 都是基于实际使用数据的决策，而非假设。
