## Context

当前架构中工具与内核耦合严重。我们将借鉴 n8n 的消息流模型和 Dify 的状态池模型进行重构。

## Goals / Non-Goals

**Goals:**
- **资源与逻辑绝对隔离**: Kernel 管理资源，Tool 管理逻辑。
- **声明式数据流**: 支持 `{{ }}` 插值引用。
- **无状态化设计**: 节点执行不依赖本地状态。

**Non-Goals:**
- 不涉及异步长任务（Long-running tasks）的处理。
- 暂时不引入图形化编辑器（由后续 Web Change 负责）。

## Decisions

### D1: 统一资源令牌 (Resource Map)
引擎在执行工具时，注入一个 `resources` 对象：
- `resources.flesh`: CAS 物理存储接口
- `resources.soul`: VectorDB 向量存储接口
- `resources.ai`: AIHub 包装后的 SDK

### D2: 状态机执行模型 (State-Machine Runner)
1. **Init**: 创建 `state = { payload: initial, nodes: {} }`。
2. **Cycle**:
    - 根据配置中的 `input` 定义，调用 `Resolver` 将插值替换为真实数据。
    - 查找工具实例，注入 `resources`。
    - 执行 `output = await tool.execute(resolvedInput, resources)`。
    - 将 `output` 存入 `state.nodes[stepId]`。

### D3: 插值语法规范
- `{{payload.xxx}}`: 访问指令原始数据。
- `{{nodes.step1.hash}}`: 访问名为 `step1` 的步骤的输出。
- `{{env.KEY}}`: 访问环境变量。

## Risks / Trade-offs

- **[性能] 频繁 JSON 操作**: Resolver 会涉及较多的对象遍历，但在内存中对小型 JSON 操作（<ctrl95>1KB）性能损耗可控。
- **[复杂性] 调试难度**: 隐式传递可能导致开发者不清楚数据来源。缓解方案：在 Trace 日志中记录 `resolvedInput`。
