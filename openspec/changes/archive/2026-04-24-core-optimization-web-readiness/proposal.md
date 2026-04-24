## Why

MemoHub 已经完成了基础的 Flow 驱动架构，但仍处于“毛坯”阶段。为了达到生产级标准，需要解决以下问题：
1. **构建与发布缺陷**: 目前的 npm 包无法正常运行。
2. **性能瓶颈**: 缺乏缓存机制，重复的 AI 调用和解析任务耗时过长。
3. **安全风险**: 凭据直接写在配置文件中。
4. **功能残缺**: `track-stream` 等规划中的核心轨道尚未实现。
5. **缺乏交互**: 没有可视化的 Web 界面来编排 Flow。

## What Changes

- **修复构建体系**: 修正 `apps/cli` 的 `package.json` 配置，确保 `dist` 正确打包且 `bin` 可执行。
- **性能层 (Execution Cache)**: 实现 Tool I/O 缓存和 AI 语义缓存。
- **安全层 (Secret Management)**: 支持 `env://` 动态引用，增强凭据脱敏。
- **缺失轨道实现**: 实现 `track-stream` (对话历史) 和 `track-wiki` (结构化知识)。
- **Web 可视化编排**: 在 `apps/web` 中实现基于元数据的 Flow 流程图编辑器。
- **系统版本化**: 引入 `$schema` 自动迁移机制。

## Capabilities

### New Capabilities
- `execution-cache`: 实现基于输入哈希的 Tool 结果缓存。
- `secret-manager`: 动态凭据解析引擎。
- `track-stream`: 专用于存储和检索对话上下文的轨道。
- `track-wiki`: 专用于长期结构化知识维护的轨道。
- `flow-visualizer-api`: 导出系统元数据供 Web 端渲染流程图。

### Modified Capabilities
- `config-kernel`: 增加版本迁移逻辑和 `$schema` 支持。
- `flow-engine`: 集成缓存逻辑和更细粒度的异常处理。

## Impact

- **apps/web**: 从占位符转变为功能完备的 React 管理后台。
- **packages/config**: 配置文件结构升级。
- **packages/core**: 内核集成缓存和追踪增强。
- **NPM Package**: 发布的包将具有生产可用性。
