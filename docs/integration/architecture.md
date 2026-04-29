# Integration Hub 架构

## 概述

Integration Hub 是 MemoHub v1 中的事件处理中心，负责接收外部系统的标准化事件，验证内容，并将其转换为 Text2Mem 指令进行内存管理。

## 核心组件

### 1. IntegrationHub

主要的事件处理器，协调整个摄取流程。

```typescript
import { IntegrationHub } from "@memohub/integration-hub";

const hub = new IntegrationHub({
  cas: contentAddressableStorage,
  kernel: memoryKernel,
  performance: performanceMonitor
});

const result = await hub.ingest(event);
```

### 2. CASAdapter

内容寻址存储适配器，负责内容去重和哈希计算。

**功能**:
- SHA256 内容哈希计算
- 重复内容检测
- CAS 写入操作

**性能**:
- 哈希计算: < 1ms (1KB 文本)
- 重复检测: < 0.1ms

### 3. EventProjector

事件投影器，将 MemoHubEvent 转换为 Text2Mem 指令。

**支持的转换**:
- `Memory` 事件 → `ADD` 指令
- 保留元数据 (eventId, contentHash, timestamp)

### 4. MemoryRouter

智能路由器，根据事件类型自动选择目标轨道。

**路由规则**:
- `kind_match`: 基于 EventKind
- `file_suffix`: 基于文件扩展名
- `content_keyword`: 基于内容关键词
- `default`: 默认回退

## 数据流

```
外部事件
    ↓
[MemoHubEvent 验证]
    ↓
[CAS 内容去重]
    ↓
[EventProjector 转换]
    ↓
[MemoryRouter 路由]
    ↓
[Text2Mem 指令]
    ↓
[MemoryKernel 分发]
    ↓
[Track 执行]
```

## 事件格式

```typescript
interface MemoHubEvent {
  id: string;                    // 自动生成
  timestamp: number;             // 自动添加
  source: EventSource;           // 事件来源
  channel: string;               // 通道标识
  kind: EventKind;               // 事件类型
  projectId: string;             // 项目 ID
  confidence: EventConfidence;   // 置信度
  payload: {
    text: string;                // 主要内容
    kind?: EventKind;            // 用于路由
    file_path?: string;          // 可选路径
    category?: string;           // 可选分类
  };
}
```

## 性能特征

### P99 延迟目标

| 操作 | 目标 | 实际 |
|------|------|------|
| 事件验证 | 0.1ms | 0.05ms |
| CAS 哈希 | 1ms | 0.8ms |
| 事件投影 | 0.5ms | 0.3ms |
| 路由决策 | 0.2ms | 0.15ms |
| **总延迟** | **2ms** | **1.3ms** |

### 吞吐量

- 单事件处理: ~1.3ms
- 批量处理: ~100 事件/秒
- 并发能力: 受 MemoryKernel 限制

## 错误处理

### 验证错误

```typescript
{
  success: false,
  error: "Invalid event structure",
  details: ["Missing required field: source"]
}
```

### CAS 错误

```typescript
{
  success: false,
  error: "CAS write failed",
  details: error.message
}
```

### 投影错误

```typescript
{
  success: false,
  error: "Unsupported event kind",
  details: "kind: 'unsupported_kind' is not supported"
}
```

## 设计决策

### 1. 为什么使用 CAS？

**优势**:
- 自动去重，避免重复存储
- 内容寻址，便于引用
- 哈希校验，确保完整性

**权衡**:
- 额外的哈希计算开销 (~0.8ms)
- 需要存储哈希索引

### 2. 为什么分离 Projector？

**优势**:
- 单一职责：事件转换逻辑独立
- 易于扩展：添加新事件类型不影响其他组件
- 可测试性：投影逻辑可独立测试

### 3. 为什么使用 MemoryRouter？

**优势**:
- 灵活的路由规则
- 支持动态配置
- 自动轨道选择

**权衡**:
- 增加了一层抽象
- 需要维护规则配置

## 扩展点

### 添加新的事件类型

1. 在 `@memohub/protocol` 中定义新的 `EventKind`
2. 在 `EventProjector` 中添加投影方法
3. 在 `MemoryRouter` 中添加路由规则（如果需要）
4. 更新验证 schema

### 添加新的路由规则

1. 在 `RoutingRuleSchema` 中定义新规则类型
2. 在 `MemoryRouter.matchRule` 中实现匹配逻辑
3. 在配置文件中添加规则实例

## 安全考虑

### 输入验证

- 所有事件必须通过 `validateMemoHubEventBasic`
- 枚举值验证 (`source`, `kind`, `confidence`)
- 字符串长度限制

### 内容安全

- CAS 哈希防止内容篡改
- 文本内容长度限制 (建议 < 10KB)
- 特殊字符过滤

### 访问控制

- ProjectId 隔离
- 通道权限验证（未来）
- 事件源白名单（未来）

## 监控和可观测性

### 性能监控

```typescript
import { globalPerformanceMonitor } from "@memohub/core";

const metrics = globalPerformanceMonitor.getMetrics("integration_hub_ingest");
console.log(metrics); // { p99: 1.3, avg: 0.8, ... }
```

### 日志记录

- 事件摄取日志
- 错误日志
- 性能日志

### 指标

- 事件摄取成功率
- 平均处理延迟
- CAS 去重率
- 路由分布

## 未来扩展

### Phase 2 功能

- [ ] 批量事件摄取优化
- [ ] 事件重试机制
- [ ] 事件归档
- [ ] 更多事件类型 (repo_analysis, api_capability, session_state)

### Phase 3 功能

- [ ] 事件流处理
- [ ] 实时事件总线
- [ ] 分布式事件处理
- [ ] 事件持久化

## 参考资料

- [Text2Mem 协议](../architecture/text2mem-protocol.md)
- [事件 Schema](event-schema.md)
- [MCP 工具指南](mcp-tools.md)
- [性能基准](../performance/baseline.md)
