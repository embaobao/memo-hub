## Why

随着系统能力的丰富，单体 `memohub.json` 配置文件将变得异常庞大且难以维护。同时，各个业务场景（如对话流、百科、代码库）对检索和处理的精度有不同要求，需要进一步完善轨道业务的逻辑深度。为了确保系统长期稳定，必须建立一套涵盖多场景的全链路验证体系。

## What Changes

- **配置模块化 (Modular Config)**: 支持从 `~/.memohub/conf.d/` 目录自动扫描并加载 `tracks/*.json`, `tools/*.json` 等子配置，实现主从配置分离。
- **业务场景补全**:
  - **track-stream**: 实现上下文感知的对话流存储与检索流程。
  - **track-wiki**: 实现实体关联的结构化知识流程。
  - **检索增强**: 在 Flow 中引入重排 (Rerank) 和条件过滤工具，提升检索精度。
- **全链路测试体系**: 建立 `tests/e2e` 集成测试，模拟真实运行环境验证所有原子操作。
- **高性能验证**: 优化 LanceDB 查询参数，并在 Trace 日志中记录性能瓶颈指标。

## Capabilities

### New Capabilities
- `config-modular-loader`: 支持文件夹拆分的配置加载引擎。
- `builtin:reranker`: 原子重排工具，用于优化检索结果。
- `builtin:condition-filter`: 流控工具，支持基于元数据的检索后过滤。
- `track-stream-flow`: 预置的对话流业务闭环。
- `track-wiki-flow`: 预置的百科关系业务闭环。

### Modified Capabilities
- `config-kernel`: 升级以支持配置引用与递归合并。
- `flow-engine`: 优化多工具间大数据量传递的内存占用。

## Impact

- **文件结构**: `~/.memohub/` 下新增 `conf.d/` 目录结构。
- **稳定性**: 覆盖 90% 以上核心场景的自动化测试。
- **检索体验**: 检索结果将包含重排后的分数，更加精准。
