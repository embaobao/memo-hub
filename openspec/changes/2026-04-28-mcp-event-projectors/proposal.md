# MCP Event Projectors Extension

## Why

Phase 0 MVP 验证了核心集成路径（外部事件 → Text2Mem → Query）并实现了 `memory` 事件类型。基于实际使用数据，我们现在需要扩展 Integration Hub 以支持更多事件类型，满足 Hermes 和 IDE 的完整需求。

**依赖于 Phase 0 MVP 的成功部署和性能验证。**

## What Changes

### 新增投影器

- **repo_analysis 投影器**: 将仓库和 API 能力分析投影到 `track-source`
- **session_state 投影器**: 将会话状态更新投影到 `track-stream`
- **business_context 投影器**: 将业务上下文投影到 `track-insight` 和可选的 `track-wiki`
- **habit 投影器**: 将编码习惯投影到 `track-insight`

### 扩展 MemoHubEvent.kind

```typescript
kind:
  | "memory"           // Phase 0 已实现
  | "repo_analysis"    // 新增
  | "api_capability"   // 新增
  | "session_state"    // 新增
  | "business_context" // 新增
  | "habit"            // 新增
```

### 扩展 MemoryRouter 规则

```typescript
// 新增路由规则
{ kind: "repo_analysis", trackId: "track-source" }
{ kind: "session_state", trackId: "track-stream" }
{ kind: "business_context", trackId: "track-insight" }
{ kind: "habit", trackId: "track-insight" }
```

## Capabilities

### 新增 Capabilities

- **repo-analysis-projector**: 投影仓库和 API 分析到 track-source
- **session-state-projector**: 投影会话状态到 track-stream
- **business-context-projector**: 投影业务上下文到 track-insight/wiki
- **habit-projector**: 投影编码习惯到 track-insight

## Non-Goals

- ❌ 多会话状态共享（在 Phase 2 中实现）
- ❌ 结构化索引（在 Phase 3 中实现）
- ❌ 便捷 MCP 工具（在 Phase 4 中实现）

## Success Criteria

- [ ] 所有新投影器通过 `MemoryKernel.dispatch()` 写入
- [ ] 所有内容通过 CAS 去重
- [ ] 性能仍满足预算（基于 Phase 0 基准）
- [ ] 单元测试覆盖率 > 80%

## Next Steps

1. 等待 Phase 0 MVP 完成
2. 收集实际使用数据
3. 按优先级实现投影器
4. 性能验证和优化
