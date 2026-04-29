# Performance Baseline and Monitoring

## Why

在添加新功能之前，我们需要建立现有系统的性能基准。这为我们后续的性能优化提供对比依据，并确保新增的 Integration Hub 不会显著降低系统性能。

## What Changes

### 新增功能

- **性能基准测试**: 测量现有 `memohub_add` 和 `memohub_search` 的 P99 延迟
- **性能监控基础设施**: 添加 `kernel.event` 性能事件机制
- **性能预算常量**: 定义 `INGEST_EVENT_TARGET` 和 `QUERY_TARGET`

### 修改功能

- **MemoryKernel**: 添加性能事件发射

## Success Criteria

- [ ] 建立性能基准数据（memohub_add, memohub_search）
- [ ] 性能监控机制就绪
- [ ] 性能预算常量定义完成
- [ ] 添加性能基准测试到 CI

## Tasks

### 1. 性能基准测量

- [ ] 1.1 创建性能测试脚本 `scripts/benchmark.ts`
- [ ] 1.2 测量 `memohub_add` P99 延迟（不同负载大小）
- [ ] 1.3 测量 `memohub_search` P99 延迟（不同查询类型）
- [ ] 1.4 记录基准数据到 `docs/performance/baseline.md`

### 2. 性能监控基础设施

- [ ] 2.1 在 `packages/core/src/` 添加 `performance.ts` 模块
- [ ] 2.2 定义性能事件类型 `PerformanceEvent`
- [ ] 2.3 在 `MemoryKernel.dispatch()` 中添加性能监控
- [ ] 2.4 添加性能事件订阅机制

### 3. 性能预算常量

- [ ] 3.1 在 `packages/config/src/` 添加性能预算配置
- [ ] 3.2 定义 `INGEST_EVENT_TARGET = BASELINE_ADD + 50ms`
- [ ] 3.3 定义 `QUERY_TARGET = BASELINE_SEARCH + 100ms`
- [ ] 3.4 添加配置验证逻辑

### 4. CI 集成

- [ ] 4.1 添加性能基准测试到 `package.json`
- [ ] 4.2 配置 CI 性能回归检测
- [ ] 4.3 添加性能预算告警机制

## Deliverables

- `scripts/benchmark.ts` - 性能测试脚本
- `packages/core/src/performance.ts` - 性能监控模块
- `packages/config/src/performance.ts` - 性能配置
- `docs/performance/baseline.md` - 基准数据文档
- CI 性能测试配置

## Dependencies

无（可以立即开始）

## Next Steps

完成此 change 后，可以并行开始：
- 2026-04-29-01-event-protocol
- 2026-04-29-02-integration-hub-core
