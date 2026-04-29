# MCP Query Tool

## Why

Hermes 和 IDE MCP 客户端需要一个统一的查询接口来检索记忆和编码上下文。`memohub_query` 是主要的查询工具，支持多种查询类型。

## What Changes

### 新增功能

- **memohub_query**: 统一查询接口
- **多种查询类型**: memory, coding_context
- **灵活过滤**: 支持按 projectId, sessionId, taskId 过滤

### 位置

- `apps/cli/src/mcp/tools/query.ts` - MCP 工具实现

## Success Criteria

- [ ] memohub_query 工具完成
- [ ] 支持 memory 查询类型
- [ ] 支持 coding_context 查询类型
- [ ] 集成测试通过

## Tasks

### 1. 实现 memory 查询

- [ ] 1.1 创建 `apps/cli/src/mcp/tools/query.ts`
- [ ] 1.2 实现查询 type: "memory" 逻辑
- [ ] 1.3 使用现有检索接口
- [ ] 1.4 按 projectId 过滤
- [ ] 1.5 按 sessionId/taskId 过滤（可选）

### 2. 实现 coding_context 查询

- [ ] 2.1 实现查询 type: "coding_context" 逻辑
- [ ] 2.2 聚合记忆、会话状态、源引用
- [ ] 2.3 返回完整的编码上下文

### 3. 集成到 MCP Server

- [ ] 3.1 在 `apps/cli/src/mcp.ts` 注册工具
- [ ] 3.2 添加工具描述
- [ ] 3.3 测试工具可用性

### 4. 集成测试

- [ ] 4.1 测试 memory 查询
- [ ] 4.2 测试 coding_context 查询
- [ ] 4.3 测试过滤逻辑
- [ ] 4.4 测试结果分页

## Deliverables

- `apps/cli/src/mcp/tools/query.ts` - MCP 工具
- 集成测试
- 更新 MCP 工具列表

## Dependencies

- 2026-04-29-03-memory-router-extension（需要正确路由）

## Next Steps

完成后可以开始：
- 2026-04-29-07-integration-tests（并行）
- 2026-04-29-08-e2e-tests（并行）

## MCP 工具 Schema

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
      projectId: {
        type: "string",
        description: "项目 ID"
      },
      sessionId: {
        type: "string",
        description: "会话 ID（可选）"
      },
      taskId: {
        type: "string",
        description: "任务 ID（可选）"
      },
      query: {
        type: "string",
        description: "查询文本"
      },
      limit: {
        type: "number",
        default: 10,
        description: "结果数量限制"
      }
    },
    required: ["type", "projectId"]
  }
}
```
