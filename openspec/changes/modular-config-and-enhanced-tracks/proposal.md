## Why

目前的架构中，内置工具（Built-in Tools）与内核类（MemoryKernel）存在强耦合，工具依赖于内核的私有实例，导致代码维护困难、暴露给外部 MCP 麻烦且参数对接过于僵化。
我们需要引入类似 **n8n/Dify** 的先进调度理念：
1. **状态共享**: 引入统一的 `ExecutionState` 存储全量上下文。
2. **变量插值**: 支持 `{{payload.x}}` 风格的声明式引用。
3. **能力注入**: 工具通过宿主环境注入能力资源，彻底切断与内核的血缘关系。

## What Changes

- **核心包拆分**: 新增 `@memohub/interfaces`（或在 core 中明确定义）规范节点契约。
- **调度引擎升级**: 
    - 实现 `VariableResolver`，支持对节点输入的自动解析。
    - 实现 `FlowRunner` 状态机，维护全局 `State`。
- **能力令牌化**: 定义 `IHostResources` (flesh, soul, ai, logger)，在运行时动态注入工具。
- **工具目录对齐**: 将所有内置工具重写为符合 `INode` 契约的无状态函数/类，物理位置独立。
- **配置语法增强**: 支持 `flow` 中的隐式传递与显式插值引用。

## Capabilities

### New Capabilities
- `variable-resolver`: 负责处理 `{{...}}` 变量映射。
- `execution-state-manager`: 管理 Flow 运行时的中间数据。
- `resource-injector`: 运行时动态注入底层能力。

### Modified Capabilities
- `flow-engine`: 升级为状态机驱动，支持非线性（通过状态引用）数据流。
- `builtin-tools`: 全部重构为解耦的节点模式。

## Impact

- **架构纯净度**: `MemoryKernel` 变为纯粹的资源池和调度入口。
- **开发优雅度**: 新增工具无需了解内核实现，只需声明 `require: ['ai']`。
- **配置灵活性**: 配置文件能够表达复杂的跨步骤数据传递，且结构极其简洁。
