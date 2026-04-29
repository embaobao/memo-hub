# Integration Tests

## Why

验证多个组件协作的正确性。集成测试确保 IntegrationHub、MemoryKernel、Tracks 和 MCP 工具能够正确协同工作。

## What Changes

### 新增功能

- **IntegrationHub → Text2Mem 集成测试**: 完整投影流程
- **IntegrationHub → MemoryKernel → Track 集成测试**: 端到端写入
- **MCP → IntegrationHub → Track 集成测试**: MCP 工具测试

### 位置

- `packages/integration-hub/src/integration.test.ts`
- `apps/cli/src/mcp/integration.test.ts`

## Success Criteria

- [ ] 所有集成测试通过
- [ ] 覆盖主要集成场景
- [ ] 测试可重复运行

## Tasks

### 1. IntegrationHub → Text2Mem 集成测试

- [ ] 1.1 测试完整投影流程
- [ ] 1.2 验证指令格式正确
- [ ] 1.3 验证元数据传递
- [ ] 1.4 测试错误处理

### 2. IntegrationHub → MemoryKernel → Track 集成测试

- [ ] 2.1 测试写入到 track-insight
- [ ] 2.2 验证 CAS 引用正确
- [ ] 2.3 验证向量已嵌入
- [ ] 2.4 测试跨组件数据流

### 3. MCP → IntegrationHub → Track 集成测试

- [ ] 3.1 测试 memohub_ingest_event 端到端
- [ ] 3.2 测试 memohub_query 端到端
- [ ] 3.3 测试错误处理和响应
- [ ] 3.4 测试并发场景

### 4. 场景测试

- [ ] 4.1 测试相同内容去重
- [ ] 4.2 测试不同会话隔离
- [ ] 4.3 测试性能预算合规
- [ ] 4.4 测试资源清理

## Deliverables

- 完整的集成测试套件
- 测试文档
- 所有测试通过

## Dependencies

- 2026-04-29-04-mcp-ingest-tool（需要 MCP 工具）
- 2026-04-29-05-mcp-query-tool（需要 MCP 工具）
- 2026-04-29-06-unit-tests（单元测试先通过）

## Next Steps

完成后可以开始：
- 2026-04-29-08-e2e-tests（并行）
- 2026-04-29-09-performance-validation（并行）

## 测试金字塔

```
      /\
     /  \    E2E Tests (10%)
    /____\
   /      \  集成测试 (20%) ← 本 change
  /________\
 /          \ 单元测试 (70%)
/____________\
```

## 测试隔离

- 使用临时数据库
- 每个测试独立运行
- 测试后清理资源
