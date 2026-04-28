# MCP UX Improvements

## Why

Phase 0-3 实现了核心功能，但 MCP 工具接口可能不够直观。基于实际使用模式，我们需要添加便捷工具和改进用户体验。

**这是最后一个 change，应该基于实际用户反馈和使用数据。**

## What Changes

### 可能添加的便捷工具

基于实际使用模式，可能需要：

```typescript
// 便捷写入工具
memohub_write_memory(payload)        // 等价于 ingest_event({ kind: "memory", ... })
memohub_write_repo_analysis(payload) // 等价于 ingest_event({ kind: "repo_analysis", ... })
memohub_write_session_state(payload) // 等价于 ingest_event({ kind: "session_state", ... })

// 便捷查询工具
memohub_read_memory(query)           // 等价于 query({ type: "memory", ... })
memohub_get_session_state(params)    // 等价于 query({ type: "session_state", ... })
memohub_get_project_context(params)  // 等价于 query({ type: "project_context", ... })
memohub_query_api_capability(params) // 等价于 query({ type: "api_capability", ... })
memohub_get_habits(params)           // 等价于 query({ type: "habit", ... })
memohub_get_coding_context(params)   // 等价于 query({ type: "coding_context", ... })
```

### 条件化实现

```typescript
// 只在实际使用数据支持时添加
if (usageStats.memoryWriteFrequency > 100) {
  implementMemohubWriteMemory();
}

if (usageStats.sessionStateQueryFrequency > 50) {
  implementMemohubGetSessionState();
}
```

## Capabilities

### 可能新增的 Capabilities

- **convenience-mcp-tools**: 便捷的 MCP 工具包装器
- **usage-analytics**: 使用统计和分析

## Non-Goals

- ❌ 完整的 IDE 插件（只提供 MCP 工具）
- ❌ Web UI（只提供 CLI 和 MCP）
- ❌ 自动工具发现（手动文档即可）

## Success Criteria

- [ ] 常用操作更简单（代码行数减少 > 50%）
- [ ] 新用户学习曲线降低
- [ ] 向后兼容（通用工具仍然可用）

## Data-Driven Approach

### 收集使用数据

```typescript
// 在 Phase 0-3 中收集
const usageStats = {
  memoryWriteFrequency: 0,
  sessionStateQueryFrequency: 0,
  codingContextQueryFrequency: 0,
  // ...
};
```

### 决策标准

```typescript
// 只添加高频使用的便捷工具
if (usageStats.memoryWriteFrequency > 100) {
  // 添加 memohub_write_memory
}

if (usageStats.codingContextQueryFrequency > 200) {
  // 优化 memohub_get_coding_context
}
```

## Alternatives

### 选项 A: 保持通用工具

- 优点：API 简单，维护成本低
- 缺点：不够直观

### 选项 B: 只添加便捷工具

- 优点：直观，易用
- 缺点：API 膨胀，维护成本高

### 选项 C: 混合方案（推荐）

- 通用工具保留
- 只为高频操作添加便捷工具
- 基于实际数据决策

## Next Steps

1. 等待 Phase 0-3 完成
2. 收集使用数据（至少 2 周）
3. 分析使用模式
4. 按影响排序实施改进
5. A/B 测试验证效果
