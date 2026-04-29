# MemoryRouter Extension

## Why

Integration Hub 生成的 Text2Mem 指令不包含 `trackId`，而是使用 `kind` 字段。我们需要扩展 MemoryRouter 以支持基于 `kind` 的路由规则。

## What Changes

### 修改功能

- **RoutingRuleSchema**: 添加 `kind_match` 规则类型
- **MemoryRouter.route()**: 实现 `kind_match` 规则匹配逻辑
- **默认配置**: 添加 `kind: "memory" → track-insight` 规则

### 位置

- `packages/core/src/router.ts` - 扩展现有路由器

## Success Criteria

- [ ] kind_match 规则类型定义完成
- [ ] MemoryRouter 支持 kind 匹配
- [ ] 默认配置正确
- [ ] 单元测试覆盖率 > 90%

## Tasks

### 1. 扩展路由规则类型

- [ ] 1.1 在 `packages/config/src/types.ts` 添加 `KindMatchRule` 类型
- [ ] 1.2 更新 `RoutingRuleSchema` 联合类型
- [ ] 1.3 添加类型导出

### 2. 实现 kind 匹配逻辑

- [ ] 2.1 在 `MemoryRouter.route()` 添加 kind 匹配逻辑
- [ ] 2.2 实现 `matchKindRule()` 辅助方法
- [ ] 2.3 确保规则优先级正确
- [ ] 2.4 添加单元测试

### 3. 添加默认配置

- [ ] 3.1 在默认配置中添加 kind_match 规则
- [ ] 3.2 配置 `kind: "memory" → track-insight`
- [ ] 3.3 添加配置示例到文档
- [ ] 3.4 添加配置验证

### 4. 向后兼容性

- [ ] 4.1 验证现有规则仍然工作
- [ ] 4.2 验证显式 trackId 覆盖
- [ ] 4.3 添加回归测试

## Deliverables

- 扩展的 `MemoryRouter` 类
- 扩展的路由规则类型
- 默认配置更新
- 完整的单元测试

## Dependencies

- 2026-04-29-01-event-protocol（需要 EventKind 类型）

## Next Steps

完成后可以开始：
- 2026-04-29-04-mcp-ingest-tool（并行）
- 2026-04-29-05-mcp-query-tool（并行）

## 注意事项

- 必须保持向后兼容
- 现有路由行为不能改变
- 规则优先级需要明确定义
