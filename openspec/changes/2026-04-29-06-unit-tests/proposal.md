# Unit Tests

## Why

确保核心组件（IntegrationHub, MemoryRouter, CAS 适配器, 投影器）的正确性和稳定性。单元测试是测试金字塔的基础，应该覆盖大部分测试场景。

## What Changes

### 新增功能

- **IntegrationHub 单元测试**: 验证、ID 生成、时间戳
- **CAS 适配器单元测试**: 哈希计算、去重
- **投影器单元测试**: 指令转换、元数据保留
- **MemoryRouter 单元测试**: kind 匹配、优先级

### 位置

- `packages/integration-hub/src/*.test.ts`
- `packages/core/src/router.test.ts`

## Success Criteria

- [ ] 单元测试覆盖率 > 80%
- [ ] 所有测试通过
- [ ] 关键路径 100% 覆盖

## Tasks

### 1. IntegrationHub 单元测试

- [ ] 1.1 测试必需字段验证
- [ ] 1.2 测试 kind 验证（只允许 "memory"）
- [ ] 1.3 测试事件 ID 生成
- [ ] 1.4 测试时间戳添加
- [ ] 1.5 测试错误处理

### 2. CAS 适配器单元测试

- [ ] 2.1 测试哈希计算
- [ ] 2.2 测试重复内容返回相同哈希
- [ ] 2.3 测试不同内容返回不同哈希
- [ ] 2.4 测试 CAS 写入失败处理

### 3. 投影器单元测试

- [ ] 3.1 测试 projectMemoryEvent() 转换
- [ ] 3.2 测试 Text2MemInstruction 格式正确性
- [ ] 3.3 测试元数据保留
- [ ] 3.4 测试不设置 trackId
- [ ] 3.5 测试 kind: "memory" 设置

### 4. MemoryRouter 单元测试

- [ ] 4.1 测试 kind_match 规则匹配
- [ ] 4.2 测试规则优先级
- [ ] 4.3 测试默认行为
- [ ] 4.4 测试向后兼容性

### 5. 覆盖率验证

- [ ] 5.1 运行 `bun test --coverage`
- [ ] 5.2 验证覆盖率 > 80%
- [ ] 5.3 查看覆盖率报告
- [ ] 5.4 补充遗漏的测试

## Deliverables

- 完整的单元测试套件
- 覆盖率报告
- 所有测试通过

## Dependencies

- 2026-04-29-02-integration-hub-core（需要 IntegrationHub）
- 2026-04-29-03-memory-router-extension（需要 MemoryRouter）

## Next Steps

完成后可以开始：
- 2026-04-29-07-integration-tests（并行）

## 测试金字塔

```
      /\
     /  \    E2E Tests (10%)
    /____\
   /      \  集成测试 (20%)
  /________\
 /          \ 单元测试 (70%) ← 本 change
/____________\
```
