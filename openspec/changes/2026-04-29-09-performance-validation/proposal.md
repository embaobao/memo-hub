# Performance Validation

## Why

确保新增的功能不会显著降低系统性能。我们需要验证 `memohub_ingest_event` 和 `memohub_query` 满足性能预算。

## What Changes

### 新增功能

- **性能测试脚本**: 测量新工具的 P99 延迟
- **性能回归测试**: CI 集成
- **性能报告**: 详细的性能数据

### 修改功能

- **CI 配置**: 添加性能测试到 CI

## Success Criteria

- [ ] memohub_ingest_event P99 < BASELINE_ADD + 50ms
- [ ] memohub_query P99 < BASELINE_SEARCH + 100ms
- [ ] 性能回归测试集成到 CI
- [ ] 性能报告生成

## Tasks

### 1. 性能测试实现

- [ ] 1.1 创建 `scripts/performance-test.ts`
- [ ] 1.2 测量 memohub_ingest_event P99
  - [ ] 1.2.1 生成不同大小的负载（小/中/大）
  - [ ] 1.2.2 测量冷启动和热启动
  - [ ] 1.2.3 验证 < INGEST_EVENT_TARGET
- [ ] 1.3 测量 memohub_query P99
  - [ ] 1.3.1 测试不同查询类型
  - [ ] 1.3.2 测试不同结果集大小
  - [ ] 1.3.3 验证 < QUERY_TARGET

### 2. 性能回归测试

- [ ] 2.1 添加性能测试到 CI
- [ ] 2.2 配置性能预算告警
- [ ] 2.3 设置自动失败阈值
- [ ] 2.4 添加性能趋势追踪

### 3. 性能报告

- [ ] 3.1 生成性能报告
- [ ] 3.2 对比基准数据
- [ ] 3.3 识别性能瓶颈
- [ ] 3.4 提供优化建议

### 4. 性能优化（如果需要）

- [ ] 4.1 分析性能瓶颈
- [ ] 4.2 实施优化
- [ ] 4.3 重新测试
- [ ] 4.4 验证预算合规

## Deliverables

- 性能测试脚本
- CI 性能测试配置
- 性能报告文档
- 优化记录（如果需要）

## Dependencies

- 2026-04-29-04-mcp-ingest-tool（需要 ingest 工具）
- 2026-04-29-05-mcp-query-tool（需要 query 工具）
- 2026-04-29-00-performance-baseline（需要基准数据）

## Next Steps

完成后可以开始：
- 2026-04-29-10-documentation（并行）

## 性能预算

```typescript
// 基于基准（在 00-performance-baseline 中测量）
const BASELINE_ADD = 100; // ms（示例）
const BASELINE_SEARCH = 150; // ms（示例）

// 性能预算
const INGEST_EVENT_TARGET = BASELINE_ADD + 50; // 150ms
const QUERY_TARGET = BASELINE_SEARCH + 100; // 250ms
```

## 性能指标

- **P99 延迟**: 99% 请求的响应时间
- **吞吐量**: 每秒处理请求数
- **资源使用**: CPU、内存、磁盘 I/O
