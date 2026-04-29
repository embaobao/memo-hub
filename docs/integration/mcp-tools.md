# MCP 工具使用指南

## 概述

MemoHub 提供了三个主要的 MCP 工具，用于与外部系统（如 Hermes AI、IDE 扩展）集成。

## 可用工具

### 1. memohub_add (传统工具)

直接添加记忆到指定轨道。

**适用场景**:
- 简单的记忆添加
- 明确知道目标轨道
- 不需要事件元数据

**参数**:
```json
{
  "text": "要记忆的内容",
  "trackId": "track-insight",  // track-insight | track-source | track-stream
  "meta": {
    "category": "development",
    "tags": ["typescript", "api"]
  }
}
```

**示例**:
```typescript
const result = await mcp.callTool("memohub_add", {
  text: "TypeScript 接口定义示例",
  trackId: "track-source",
  meta: {
    language: "typescript",
    file_path: "src/types/api.ts"
  }
});
```

### 2. memohub_ingest_event (新工具 - 推荐)

通过 Integration Hub 摄取标准化事件。

**适用场景**:
- 需要事件溯源
- 需要内容去重
- 需要自动路由
- Hermes AI 集成

**参数**:
```json
{
  "event": {
    "source": "hermes",        // hermes | ide | cli | mcp | external
    "channel": "session-123",
    "kind": "memory",          // 目前仅支持 memory
    "projectId": "my-project",
    "confidence": "reported",   // reported | observed | inferred | provisional | verified
    "payload": {
      "text": "事件内容",
      "kind": "memory",        // 用于路由
      "category": "development"
    }
  }
}
```

**示例**:
```typescript
// Hermes AI 集成
const result = await mcp.callTool("memohub_ingest_event", {
  event: {
    source: "hermes",
    channel: "agent-session-456",
    kind: "memory",
    projectId: "hermes-integration",
    confidence: "observed",
    payload: {
      text: "用户反馈：需要改进 API 响应时间",
      kind: "memory",
      category: "user-feedback"
    }
  }
});
```

### 3. memohub_query (新工具)

统一的查询接口，支持多种查询类型。

**适用场景**:
- 需要结构化查询
- 需要过滤特定项目/会话
- 需要聚合多个轨道的结果

**参数**:
```json
{
  "type": "memory",            // memory | coding_context
  "projectId": "my-project",
  "sessionId": "session-123",  // 可选
  "taskId": "task-456",        // 可选
  "query": "查询内容",
  "limit": 10
}
```

**示例**:
```typescript
// 查询特定项目的记忆
const memories = await mcp.callTool("memohub_query", {
  type: "memory",
  projectId: "my-project",
  query: "API 设计决策",
  limit: 5
});

// 查询编码上下文（聚合记忆 + 源码）
const context = await mcp.callTool("memohub_query", {
  type: "coding_context",
  projectId: "my-project",
  query: "用户认证模块",
  limit: 20
});
```

## 使用场景

### 场景 1: Hermes AI 集成

```typescript
// Hermes AI Agent 记忆用户对话
async function rememberUserConversation(
  sessionId: string,
  userMessage: string,
  agentResponse: string
) {
  // 使用 memohub_ingest_event 记录用户消息
  await mcp.callTool("memohub_ingest_event", {
    event: {
      source: "hermes",
      channel: sessionId,
      kind: "memory",
      projectId: "hermes-chat",
      confidence: "reported",
      payload: {
        text: `用户: ${userMessage}`,
        kind: "memory",
        category: "user-message"
      }
    }
  });

  // 记录 Agent 响应
  await mcp.callTool("memohub_ingest_event", {
    event: {
      source: "hermes",
      channel: sessionId,
      kind: "memory",
      projectId: "hermes-chat",
      confidence: "inferred",
      payload: {
        text: `Agent: ${agentResponse}`,
        kind: "memory",
        category: "agent-response"
      }
    }
  });
}
```

### 场景 2: IDE 扩展集成

```typescript
// VS Code 扩展记录代码片段
async function rememberCodeSnippet(
  projectId: string,
  filePath: string,
  code: string,
  description: string
) {
  await mcp.callTool("memohub_ingest_event", {
    event: {
      source: "ide",
      channel: "vscode-extension",
      kind: "memory",
      projectId: projectId,
      confidence: "observed",
      payload: {
        text: `${description}\n\n\`\`\`\n${code}\n\`\`\``,
        kind: "memory",
        file_path: filePath,
        category: "code-snippet"
      }
    }
  });
}
```

### 场景 3: 查询上下文

```typescript
// 为 AI Agent 检索相关上下文
async function getContextForAgent(
  projectId: string,
  query: string
): Promise<string> {
  const result = await mcp.callTool("memohub_query", {
    type: "coding_context",
    projectId: projectId,
    query: query,
    limit: 10
  });

  if (!result.success) {
    return "";
  }

  const { memories, sources } = result.results;

  // 格式化上下文
  let context = "相关记忆:\n";
  memories.forEach((mem, i) => {
    context += `${i + 1}. ${mem.text}\n`;
  });

  context += "\n相关代码:\n";
  sources.forEach((src, i) => {
    context += `${i + 1}. ${src.file_path}: ${src.content}\n`;
  });

  return context;
}
```

## 错误处理

### 常见错误

1. **验证错误**
```typescript
{
  success: false,
  error: "Invalid input schema",
  details: [
    {
      path: ["event", "source"],
      message: "Invalid enum value"
    }
  ]
}
```

2. **事件结构错误**
```typescript
{
  success: false,
  error: "Invalid event structure",
  details: ["Missing required field: projectId"]
}
```

3. **Integration Hub 错误**
```typescript
{
  success: false,
  error: "Integration Hub failure",
  eventId: "evt_abc123"
}
```

### 错误处理最佳实践

```typescript
async function safeIngest(eventData: MemoHubEvent) {
  try {
    const result = await mcp.callTool("memohub_ingest_event", {
      event: eventData
    });

    if (!result.success) {
      console.error("事件摄取失败:", result.error);

      // 根据错误类型处理
      if (result.error.includes("Invalid input schema")) {
        // 修复输入并重试
        return await fixAndRetry(eventData);
      } else if (result.error.includes("Integration Hub")) {
        // 记录错误，稍后重试
        return await scheduleRetry(eventData);
      }
    }

    return result;
  } catch (error) {
    console.error("工具调用失败:", error);
    throw error;
  }
}
```

## 性能优化

### 批量操作

```typescript
// 批量摄取事件
const events = [event1, event2, event3, ...];

// 使用 IntegrationHub.ingestBatch() 进行批量处理
// 注意：需要直接使用 IntegrationHub，而不是 MCP 工具
const hub = new IntegrationHub({ ... });
const results = await hub.ingestBatch(events);
```

### 缓存查询结果

```typescript
// 实现简单的查询缓存
const queryCache = new Map<string, any>();

async function cachedQuery(params: QueryParams) {
  const cacheKey = JSON.stringify(params);

  if (queryCache.has(cacheKey)) {
    return queryCache.get(cacheKey);
  }

  const result = await mcp.callTool("memohub_query", params);
  queryCache.set(cacheKey, result);

  // 5分钟后过期
  setTimeout(() => queryCache.delete(cacheKey), 5 * 60 * 1000);

  return result;
}
```

## 向后兼容性

### 从旧工具迁移

**旧方式** (仍然支持):
```typescript
await mcp.callTool("memohub_add", {
  text: "一些内容",
  trackId: "track-insight"
});
```

**新方式** (推荐):
```typescript
await mcp.callTool("memohub_ingest_event", {
  event: {
    source: "mcp",
    channel: "default",
    kind: "memory",
    projectId: "default",
    confidence: "reported",
    payload: {
      text: "一些内容",
      kind: "memory"
    }
  }
});
```

### 迁移检查清单

- [ ] 更新 `memohub_add` 调用为 `memohub_ingest_event`
- [ ] 添加 `source`, `channel`, `projectId`, `confidence` 字段
- [ ] 更新错误处理逻辑
- [ ] 测试新的事件格式
- [ ] 更新文档和示例

## 故障排除

### 问题：事件摄取失败

**检查清单**:
1. 验证事件格式是否符合 MemoHubEvent schema
2. 确认所有必需字段都存在
3. 检查 Integration Hub 是否正常运行
4. 查看 CAS 存储是否可访问

### 问题：查询返回空结果

**检查清单**:
1. 确认 projectId 正确
2. 检查是否有相关事件被摄取
3. 尝试使用更通用的查询词
4. 增加 limit 参数

### 问题：性能不佳

**优化建议**:
1. 使用批量操作替代单个操作
2. 实现查询缓存
3. 减少事件 payload 大小
4. 使用正确的 trackId 和路由规则

## 参考资料

- [Integration Hub 架构](architecture.md)
- [事件 Schema](event-schema.md)
- [Text2Mem 协议](../architecture/text2mem-protocol.md)
- [迁移指南](migration.md)
