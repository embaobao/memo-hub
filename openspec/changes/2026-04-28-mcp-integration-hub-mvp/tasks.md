## 1. 基础设施和性能基准

- [ ] 1.1 测量现有 `memohub_add` 的 P99 延迟基准
- [ ] 1.2 测量现有 `memohub_search` 的 P99 延迟基准
- [ ] 1.3 添加性能监控基础设施（`kernel.event` 机制）
- [ ] 1.4 定义性能预算常量（INGEST_EVENT_TARGET, QUERY_TARGET）

## 2. Integration Hub 实现

- [ ] 2.1 定义 `MemoHubEvent` TypeScript 类型和验证 schema
- [ ] 2.2 实现 `IntegrationHub.ingest(event)` 方法
  - [ ] 2.2.1 验证必需字段（source, channel, kind, projectId, confidence, payload）
  - [ ] 2.2.2 验证 `kind` 只支持 "memory"（MVP）
  - [ ] 2.2.3 生成事件 ID（如果未提供）
  - [ ] 2.2.4 添加时间戳（如果未提供）
- [ ] 2.3 实现 CAS 内容去重逻辑
  - [ ] 2.3.1 计算 `payload.text` 的哈希
  - [ ] 2.3.2 写入 CAS 并获取 `contentHash`
  - [ ] 2.3.3 检查重复并返回现有哈希（如果已存在）
- [ ] 2.4 实现 `projectMemoryEvent(event)` 投影器
  - [ ] 2.4.1 转换为 `Text2MemInstruction` 格式
  - [ ] 2.4.2 不指定 `trackId`，设置 `kind: "memory"`
  - [ ] 2.4.3 保留所有元数据（source, channel, sessionId, taskId 等）
- [ ] 2.5 确保 IntegrationHub 通过 `MemoryKernel.dispatch()` 写入
  - [ ] 2.5.1 不直接调用 track provider
  - [ ] 2.5.2 不直接操作 storage backend

## 3. MemoryRouter 扩展

- [ ] 3.1 在 `RoutingRuleSchema` 中添加 `kind_match` 规则类型
- [ ] 3.2 在 `MemoryRouter.route()` 中实现 `kind_match` 规则匹配
- [ ] 3.3 添加默认配置规则：`kind: "memory" → track-insight`
- [ ] 3.4 添加配置示例和文档

## 4. MCP 工具实现

- [ ] 4.1 实现 `memohub_ingest_event` MCP 工具
  - [ ] 4.1.1 定义输入 schema（MemoHubEvent）
  - [ ] 4.1.2 调用 `IntegrationHub.ingest()`
  - [ ] 4.1.3 返回成功/错误响应
- [ ] 4.2 实现 `memohub_query` MCP 工具
  - [ ] 4.2.1 定义输入 schema（type, projectId, query 等）
  - [ ] 4.2.2 实现 `type: "memory"` 查询逻辑
  - [ ] 4.2.3 实现 `type: "coding_context"` 聚合查询
  - [ ] 4.2.4 返回带元数据的结果

## 5. 单元测试

- [ ] 5.1 IntegrationHub 单元测试
  - [ ] 5.1.1 测试必需字段验证
  - [ ] 5.1.2 测试 `kind` 验证（只允许 "memory"）
  - [ ] 5.1.3 测试事件 ID 生成
  - [ ] 5.1.4 测试时间戳添加
- [ ] 5.2 CAS 去重单元测试
  - [ ] 5.2.1 测试哈希计算
  - [ ] 5.2.2 测试重复内容返回相同哈希
  - [ ] 5.2.3 测试不同内容返回不同哈希
- [ ] 5.3 投影器单元测试
  - [ ] 5.3.1 测试 `projectMemoryEvent()` 转换
  - [ ] 5.3.2 测试 `Text2MemInstruction` 格式正确性
  - [ ] 5.3.3 测试元数据保留
  - [ ] 5.3.4 测试不设置 `trackId`
- [ ] 5.4 MemoryRouter 扩展单元测试
  - [ ] 5.4.1 测试 `kind_match` 规则匹配
  - [ ] 5.4.2 测试规则优先级
  - [ ] 5.4.3 测试默认行为

## 6. 集成测试

- [ ] 6.1 IntegrationHub → Text2Mem 集成测试
  - [ ] 6.1.1 测试完整投影流程
  - [ ] 6.1.2 验证指令格式
  - [ ] 6.1.3 验证元数据传递
- [ ] 6.2 IntegrationHub → MemoryKernel → Track 集成测试
  - [ ] 6.2.1 测试写入到 track-insight
  - [ ] 6.2.2 验证 CAS 引用正确
  - [ ] 6.2.3 验证向量已嵌入
- [ ] 6.3 MCP → IntegrationHub → Track 集成测试
  - [ ] 6.3.1 测试 `memohub_ingest_event` 端到端
  - [ ] 6.3.2 测试 `memohub_query` 端到端
  - [ ] 6.3.3 测试错误处理

## 7. 端到端测试

- [ ] 7.1 Hermes 模拟客户端 E2E 测试
  - [ ] 7.1.1 模拟 Hermes 写入记忆
  - [ ] 7.1.2 模拟 Hermes 查询记忆
  - [ ] 7.1.3 验证往返一致性

## 8. 性能测试

- [ ] 8.1 测量 `memohub_ingest_event` P99 延迟
  - [ ] 8.1.1 生成不同大小的负载（小/中/大）
  - [ ] 8.1.2 测量冷启动和热启动
  - [ ] 8.1.3 验证 < INGEST_EVENT_TARGET
- [ ] 8.2 测量 `memohub_query` P99 延迟
  - [ ] 8.2.1 测试不同查询类型
  - [ ] 8.2.2 测试不同结果集大小
  - [ ] 8.2.3 验证 < QUERY_TARGET
- [ ] 8.3 性能回归测试
  - [ ] 8.3.1 添加 CI 性能基准测试
  - [ ] 8.3.2 设置性能预算告警

## 9. 文档

- [ ] 9.1 编写 Integration Hub 架构文档
- [ ] 9.2 编写 MemoHubEvent schema 文档
- [ ] 9.3 编写 MCP 工具使用示例
- [ ] 9.4 编写迁移指南（从现有 MCP 工具）
- [ ] 9.5 更新 CLAUDE.md 和 AGENT.md

## 10. 向后兼容性验证

- [ ] 10.1 验证现有 `memohub_add` 工具正常工作
- [ ] 10.2 验证现有 `memohub_search` 工具正常工作
- [ ] 10.3 验证现有 track 功能不受影响
- [ ] 10.4 验证现有 storage 功能不受影响

## 11. 代码审查和优化

- [ ] 11.1 代码审查
- [ ] 11.2 性能优化（如果超出预算）
- [ ] 11.3 错误处理改进
- [ ] 11.4 日志和监控改进

## 12. 发布准备

- [ ] 12.1 运行 `bun run build` 验证构建
- [ ] 12.2 运行 `bun run test` 验证测试
- [ ] 12.3 运行 `bun run lint` 验证代码风格
- [ ] 12.4 更新 CHANGELOG
- [ ] 12.5 准备 release notes

## 定义

- **P99 延迟**: 99% 请求的响应时间
- **性能预算**: 允许的最大性能开销
- **单元测试**: 测试单个函数/类的行为
- **集成测试**: 测试多个组件协作
- **端到端测试**: 测试完整的用户场景
