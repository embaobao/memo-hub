# Integration Hub Core

## Why

Integration Hub 是外部系统与 MemoHub 之间的桥梁。它负责接受外部事件，验证内容，通过 CAS 去重，并投影到 Text2Mem 指令。

## What Changes

### 新增功能

- **IntegrationHub 类**: 核心集成逻辑
- **CAS 去重**: 内容哈希和去重逻辑
- **投影器**: 将事件转换为 Text2Mem 指令
- **性能监控**: 集成性能事件发射

### 位置

- `packages/integration-hub/` - 新建包
- `packages/integration-hub/src/integration-hub.ts` - 主类
- `packages/integration-hub/src/projector.ts` - 投影器
- `packages/integration-hub/src/cas-adapter.ts` - CAS 适配器

## Success Criteria

- [ ] IntegrationHub.ingest() 方法完成
- [ ] CAS 去重正常工作
- [ ] 投影器生成正确的 Text2Mem 指令
- [ ] 单元测试覆盖率 > 80%

## Tasks

### 1. 创建包结构

- [ ] 1.1 创建 `packages/integration-hub/package.json`
- [ ] 1.2 创建 `packages/integration-hub/tsconfig.json`
- [ ] 1.3 添加到 monorepo 根目录的 `package.json`

### 2. 实现 CAS 适配器

- [ ] 2.1 创建 `cas-adapter.ts` 模块
- [ ] 2.2 实现 `writeContent(content)` 方法
- [ ] 2.3 实现 `computeHash(content)` 方法
- [ ] 2.4 实现 `checkExists(hash)` 方法
- [ ] 2.5 添加单元测试

### 3. 实现投影器

- [ ] 3.1 创建 `projector.ts` 模块
- [ ] 3.2 实现 `projectMemoryEvent(event)` 方法
- [ ] 3.3 转换为 Text2MemInstruction 格式
- [ ] 3.4 不设置 trackId，使用 kind: "memory"
- [ ] 3.5 保留所有元数据
- [ ] 3.6 添加单元测试

### 4. 实现 IntegrationHub 主类

- [ ] 4.1 创建 `integration-hub.ts` 主类
- [ ] 4.2 实现 `ingest(event)` 方法
  - [ ] 4.2.1 验证事件（使用 event-protocol）
  - [ ] 4.2.2 生成事件 ID（如果需要）
  - [ ] 4.2.3 添加时间戳（如果需要）
  - [ ] 4.2.4 调用 CAS 适配器去重
  - [ ] 4.2.5 调用投影器转换
  - [ ] 4.2.6 发射性能事件
- [ ] 4.3 添加错误处理
- [ ] 4.4 添加单元测试

### 5. 集成 MemoryKernel

- [ ] 5.1 添加 MemoryKernel 依赖
- [ ] 5.2 在 ingest() 中调用 kernel.dispatch()
- [ ] 5.3 确保不直接操作 tracks
- [ ] 5.4 添加集成测试

## Deliverables

- `packages/integration-hub/` - 完整的包
- 单元测试和集成测试
- 导出到 monorepo

## Dependencies

- 2026-04-29-00-performance-baseline（性能监控）
- 2026-04-29-01-event-protocol（事件类型）

## Next Steps

完成后可以开始：
- 2026-04-29-03-memory-router-extension（并行）
- 2026-04-29-04-mcp-ingest-tool（依赖此 change）
