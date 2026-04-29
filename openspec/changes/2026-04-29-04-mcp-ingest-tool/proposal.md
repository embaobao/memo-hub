# MCP Ingest Tool

## Why

Hermes 和 IDE MCP 客户端需要一个标准工具来向 MemoHub 写入事件。`memohub_ingest_event` 是 Integration Hub 的主要 MCP 接口。

## What Changes

### 新增功能

- **memohub_ingest_event**: 新的 MCP 工具
- **输入 schema**: MemoHubEvent 的 JSON schema
- **错误处理**: 详细的错误响应

### 位置

- `apps/cli/src/mcp/tools/ingest.ts` - MCP 工具实现

## Success Criteria

- [ ] memohub_ingest_event 工具完成
- [ ] 输入 schema 正确定义
- [ ] 错误处理完善
- [ ] 集成测试通过

## Tasks

### 1. 实现 MCP 工具

- [ ] 1.1 创建 `apps/cli/src/mcp/tools/ingest.ts`
- [ ] 1.2 定义工具输入 schema
- [ ] 1.3 实现工具处理逻辑
- [ ] 1.4 调用 IntegrationHub.ingest()
- [ ] 1.5 返回成功/错误响应

### 2. 集成到 MCP Server

- [ ] 2.1 在 `apps/cli/src/mcp.ts` 注册工具
- [ ] 2.2 添加工具描述
- [ ] 2.3 测试工具可用性

### 3. 错误处理

- [ ] 3.1 捕获 IntegrationHub 错误
- [ ] 3.2 转换为 MCP 错误响应
- [ ] 3.3 添加详细的错误消息
- [ ] 3.4 测试错误场景

### 4. 集成测试

- [ ] 4.1 测试有效事件摄取
- [ ] 4.2 测试无效事件拒绝
- [ ] 4.3 测试 CAS 去重
- [ ] 4.4 测试错误响应

## Deliverables

- `apps/cli/src/mcp/tools/ingest.ts` - MCP 工具
- 集成测试
- 更新 MCP 工具列表

## Dependencies

- 2026-04-29-02-integration-hub-core（需要 IntegrationHub）

## Next Steps

完成后可以开始：
- 2026-04-29-07-integration-tests（并行）
- 2026-04-29-08-e2e-tests（并行）

## MCP 工具 Schema

```typescript
{
  name: "memohub_ingest_event",
  description: "摄取外部事件到 MemoHub",
  inputSchema: {
    type: "object",
    properties: {
      event: {
        type: "object",
        description: "MemoHubEvent 对象",
        properties: {
          source: { type: "string" },
          channel: { type: "string" },
          kind: { type: "string", enum: ["memory"] },
          projectId: { type: "string" },
          confidence: { type: "string" },
          payload: {
            type: "object",
            properties: {
              text: { type: "string" }
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
