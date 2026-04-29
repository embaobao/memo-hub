# Event Protocol Definition

## Why

Integration Hub 需要一个稳定的事件包格式来接受外部事件。我们需要定义 `MemoHubEvent` TypeScript 类型和验证 schema，为后续实现提供类型安全。

## What Changes

### 新增功能

- **MemoHubEvent 类型**: 定义外部事件的 TypeScript 类型
- **验证 schema**: 使用 zod 或类似库进行运行时验证
- **错误类型**: 定义集成相关的错误类型

### 位置

- `packages/protocol/src/event.ts` - 事件类型定义
- `packages/protocol/src/errors.ts` - 错误类型

## Success Criteria

- [ ] MemoHubEvent TypeScript 类型定义完成
- [ ] 运行时验证 schema 完成
- [ ] 错误类型定义完成
- [ ] 单元测试覆盖率 > 90%

## Tasks

### 1. 定义 MemoHubEvent 类型

- [ ] 1.1 在 `packages/protocol/src/event.ts` 定义 `MemoHubEvent` 类型
- [ ] 1.2 定义 `EventSource` 枚举类型
- [ ] 1.3 定义 `EventKind` 枚举类型（MVP 只支持 "memory"）
- [ ] 1.4 定义 `EventConfidence` 枚举类型
- [ ] 1.5 定义 `EventPayload` 类型

### 2. 定义验证 schema

- [ ] 2.1 添加 zod 依赖到 `packages/protocol`
- [ ] 2.2 创建 `MemoHubEventSchema` 验证 schema
- [ ] 2.3 实现验证函数 `validateMemoHubEvent()`
- [ ] 2.4 添加详细的错误消息

### 3. 定义错误类型

- [ ] 3.1 在 `packages/protocol/src/errors.ts` 定义 `IntegrationHubError`
- [ ] 3.2 定义错误码枚举 `ErrorCode`
- [ ] 3.3 实现错误工厂函数

### 4. 单元测试

- [ ] 4.1 测试有效事件验证
- [ ] 4.2 测试缺少必需字段
- [ ] 4.3 测试无效的枚举值
- [ ] 4.4 测试错误类型和消息

## Deliverables

- `packages/protocol/src/event.ts` - 事件类型定义
- `packages/protocol/src/errors.ts` - 错误类型
- `packages/protocol/src/event.test.ts` - 单元测试
- 导出类型到 `packages/protocol/src/index.ts`

## Dependencies

无（可以立即开始）

## Next Steps

完成后可以开始：
- 2026-04-29-02-integration-hub-core（依赖此 change）
