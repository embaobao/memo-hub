# Structured Indexes for Performance

## Why

Phase 0-2 使用现有向量检索。如果性能测量显示特定查询（如 API 能力查找、关系查询）存在性能瓶颈，我们需要添加结构化索引来加速。

**这是一个优化 change，应该基于实际性能数据决定优先级。**

## What Changes

### 新增 Soul 索引

基于性能数据，可能需要添加：

1. **api_capabilities**: API 能力索引（符号名、签名、示例）
2. **relations**: 关系图谱（implements, calls, uses, related_to）
3. **habits**: 编码习惯索引
4. **project_contexts**: 项目上下文索引

### 条件化实现

```typescript
// 只在性能数据支持时添加
if (performanceMetrics.apiCapabilityQueryTime > 500ms) {
  implementApiCapabilityIndex();
}

if (performanceMetrics.relationQueryTime > 500ms) {
  implementRelationIndex();
}
```

## Capabilities

### 可能新增的 Capabilities

- **api-capability-index**: 结构化 API 能力索引
- **relation-index**: 关系图谱索引
- **habit-index**: 编码习惯索引
- **project-context-index**: 项目上下文索引

## Non-Goals

- ❌ 完整图数据库（使用简单的 SQLite + 向量）
- ❌ 实时索引更新（异步即可）
- ❌ 复杂查询语言（简单的键值查询）

## Success Criteria

- [ ] 目标查询性能提升 > 50%
- [ ] 索引写入开销 < 20%
- [ ] 单元测试覆盖率 > 80%

## Performance Budget

### 基准（在 Phase 0-2 中测量）

```typescript
// 假设的基准（需要实际测量）
const API_CAPABILITY_QUERY_BASELINE = 800; // ms
const RELATION_QUERY_BASELINE = 600; // ms
```

### 目标

```typescript
const API_CAPABILITY_QUERY_TARGET = 400; // ms (提升 50%)
const RELATION_QUERY_TARGET = 300; // ms (提升 50%)
```

## Implementation Strategy

1. **测量**: 先测量现有性能，找到瓶颈
2. **优先级**: 按性能影响排序
3. **实施**: 逐个添加索引
4. **验证**: 验证性能提升
5. **回退**: 如果未达到目标，考虑其他方案

## Next Steps

1. 等待 Phase 1 完成
2. 收集性能数据
3. 识别瓶颈
4. 按优先级实施索引
