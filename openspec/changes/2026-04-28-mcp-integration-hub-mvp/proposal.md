# MCP Integration Hub MVP

## Why

MemoHub 已经有了坚实的内部基础：Text2Mem 协议、`MemoryKernel.dispatch()` 单一执行入口、四个语义轨道、CAS 内容存储和 Soul 检索层。但缺少一个**最小的集成层**，让 Hermes 和 IDE MCP 客户端能够读写项目记忆，而无需了解 MemoHub 的内部轨道布局。

**第一个产品的目标非常具体**：Hermes 应该能够通过 MCP 读写记忆，IDE MCP 客户端应该能够快速检索项目记忆和编码上下文，以减少代码生成和迭代过程中的重复搜索。

**这不是一个大而全的重构**。这是一个验证核心路径的最小实现：外部事件 → Text2Mem → 查询。后续的扩展（多会话状态、结构化索引、便捷工具）将基于实际使用数据在独立的 changes 中实现。

## What Changes

### 新增功能

- **Integration Hub**: 接受外部事件包，验证源/频道/类型元数据，通过 CAS 去重内容，投影到 Text2Mem 指令
- **Memory Router 扩展**: 通过配置规则支持基于 `kind` 元数据的路由
- **MCP 工具（仅 2 个）**:
  - `memohub_ingest_event`: 通用事件摄取
  - `memohub_query`: 统一查询接口（支持多种查询类型）

### 修改功能

- **memory-kernel-api**: 保持内部分发路径；Integration Hub 只通过 `Text2MemInstruction` 和 `MemoryKernel.dispatch()` 写入
- **track-insight**: 存储通过 Integration Hub 投影的记忆和项目事实

### 明确不包括

- ❌ 其他事件类型的投影器（repo_analysis, api_capability, session_state, habit）- 在后续 changes 中添加
- ❌ 多会话状态共享 - 在后续 change 中实现
- ❌ 额外的 Soul 结构化索引 - 在后续 change 中基于性能数据添加
- ❌ 便捷 MCP 工具 - 在后续 change 中基于实际使用模式添加
- ❌ 完整的 VSCode/Trae/Gemini IDE 插件

## Capabilities

### 新增 Capabilities

- **integration-hub**: 接受外部事件包，验证，CAS 去重，投影到 Text2Mem 指令
- **memory-router-extension**: 支持基于 `kind` 字段的路由规则
- **mcp-ingestion**: 通用事件摄取 MCP 工具
- **mcp-query**: 统一查询 MCP 工具

### 修改 Capabilities

- **memory-kernel-api**: 保持不变；Integration Hub 作为标准客户端使用 `dispatch()`
- **track-insight**: 接受来自 Integration Hub 的记忆投影

## Impact

- **架构**: 添加一个薄集成层（Integration Hub），保持 Text2Mem、Track、CAS、Soul 核心架构不变
- **存储**: 所有内容继续在 CAS 中去重；Soul 暂时不添加新索引（使用现有向量检索）
- **MCP**: 现有 `memohub_add/search` 保持不变；新增 2 个高级工具
- **性能**: 目标是 `ingest_event` 延迟 < 基准 + 50ms，`query` 延迟 < 基准 + 100ms

## Non-Goals

为了保持 MVP 范围可控，明确不包括：

- 实现所有事件类型的投影器（只实现 `memory` 类型）
- 多会话状态聚合和冲突解决
- 额外的 Soul 结构化索引（api_capabilities, relations, session_states, habits）
- 便捷的 MCP 包装工具（write_memory, read_memory 等）
- 完整的 IDE 插件或 UI 组件
- 自主的 Librarian 治理逻辑

这些功能将在后续独立的 changes 中实现，基于本 MVP 的实际使用数据和性能测量。

## Success Criteria

### 功能标准

- [ ] Hermes 可以通过 `memohub_ingest_event` 写入记忆
- [ ] Hermes 可以通过 `memohub_query` 检索项目记忆
- [ ] IDE MCP 客户端可以查询编码上下文
- [ ] 所有写入通过 `MemoryKernel.dispatch()`，不直接操作轨道
- [ ] CAS 去重正常工作

### 性能标准

- [ ] `memohub_ingest_event` P99 延迟 < 基准 + 50ms
- [ ] `memohub_query` P99 延迟 < 基准 + 100ms
- [ ] 单元测试覆盖率 > 80%

### 集成标准

- [ ] 至少 1 个端到端测试（Hermes → MCP → IntegrationHub → Text2Mem → Query）
- [ ] 现有 `memohub_add/search` 工具不受影响

## Next Steps

1. 实现基础设计（design.md）
2. 定义规格（specs/）
3. 创建任务清单（tasks.md）
4. 实施和验证
5. 基于实际数据规划后续 phases
