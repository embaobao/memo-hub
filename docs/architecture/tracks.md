# 业务轨道设计 (Tracks)

MemoHub 采用轨道（Track）隔离存储与处理逻辑。每条轨道均需实现 `ITrackProvider` 接口，并注册至 `MemoryKernel`。

## 轨道定义

| 轨道 ID | 名称 | 职责 | 原子工具依赖 |
| :--- | :--- | :--- | :--- |
| `track-insight` | Insight Track | 存储事实、决策定论及偏好 | cas, embedder, vector, retriever |
| `track-source` | Source Track | 代码 AST 解析、符号索引 | cas, embedder, vector, code-analyzer |
| `track-stream` | Stream Track | 高频原始记录会话流 | cas, embedder, vector |
| `track-wiki` | Wiki Track | 存储权威真理库知识 | cas, embedder, vector, entity-linker |

## 核心实现模式
所有轨道必须采用 **Tool-Based Execution** 模式，严禁直接调用内核底层的存储服务。

### 实现示例 (`WikiTrack`):
```typescript
private async handleAdd(inst: Text2MemInstruction): Promise<Text2MemResult> {
  // 1. 获取原子工具
  const casTool = this.kernel.getTool("builtin:cas");
  const embedderTool = this.kernel.getTool("builtin:embedder");
  const vectorTool = this.kernel.getTool("builtin:vector");

  // 2. 执行原子操作
  const { hash } = await casTool.execute({ op: 'write', content }, ...);
  const { vector } = await embedderTool.execute({ text }, ...);
  await vectorTool.execute({ op: 'add', id, vector, hash, ... }, ...);
  
  return { success: true };
}
```

## 路由流程 (Dispatching)
1. **Instruction In**: 指令进入 `MemoryKernel.dispatch`。
2. **MemoryRouter**: 内核通过 `router.route()` 计算目标轨道（支持配置路由规则或后缀匹配）。
3. **Execution**: 内核调用目标轨道的 `execute` 方法。
4. **Tool Execution**: 轨道调用原子工具并传递 `getResources()` 上下文。
