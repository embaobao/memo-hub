# MemoHubEvent Schema 参考

## 概述

MemoHubEvent 是 Integration Hub 的标准事件格式，用于从外部系统向 MemoHub 传递数据和元数据。

## 完整 Schema

```typescript
interface MemoHubEvent {
  // === 标识符 ===
  id?: string;                   // 事件唯一标识符（可选，自动生成）
  timestamp?: number;            // 事件时间戳（可选，自动添加）

  // === 事件属性 ===
  source: EventSource;           // 事件来源（必需）
  channel: string;               // 事件通道（必需）
  kind: EventKind;               // 事件类型（必需）
  projectId: string;             // 项目标识符（必需）

  // === 置信度 ===
  confidence: EventConfidence;   // 事件置信度（必需）

  // === 可选关联 ===
  sessionId?: string;            // 会话标识符（可选）
  taskId?: string;               // 任务标识符（可选）
  userId?: string;               // 用户标识符（可选）

  // === 事件负载 ===
  payload: {
    text: string;                // 主要文本内容（必需）

    // === 路由辅助 ===
    kind?: EventKind;            // 用于路由的事件类型（可选）
    file_path?: string;          // 文件路径（可选）

    // === 分类 ===
    category?: string;           // 内容分类（可选）
    tags?: string[];             // 内容标签（可选）

    // === 元数据 ===
    metadata?: Record<string, any>;  // 额外元数据（可选）
  };
}
```

## 字段详解

### 标识字段

#### id
- **类型**: `string`
- **必需**: 否
- **自动生成**: 是 (格式: `evt_<uuid>`)
- **描述**: 事件的唯一标识符
- **示例**: `"evt_abc123-def456-ghi789"`

#### timestamp
- **类型**: `number` (Unix 时间戳，毫秒)
- **必需**: 否
- **自动添加**: 是
- **描述**: 事件发生的时间
- **示例**: `1714348800000`

### 事件属性

#### source
- **类型**: `EventSource`
- **必需**: 是
- **描述**: 事件的来源系统
- **枚举值**:
  - `hermes`: Hermes AI 系统
  - `ide`: IDE 扩展 (VS Code, JetBrains 等)
  - `cli`: 命令行工具
  - `mcp`: MCP 工具调用
  - `external`: 其他外部系统

#### channel
- **类型**: `string`
- **必需**: 是
- **描述**: 事件的通道标识符，用于细分来源
- **示例**:
  - `"session-123"` (会话通道)
  - `"vscode-extension"` (VS Code 扩展)
  - `"ci-build-456"` (CI 构建)

#### kind
- **类型**: `EventKind`
- **必需**: 是
- **描述**: 事件的类型，决定投影和路由方式
- **当前支持**:
  - `memory`: 通用记忆事件
- **未来支持**:
  - `repo_analysis`: 代码库分析
  - `api_capability`: API 能力描述
  - `session_state`: 会话状态

#### projectId
- **类型**: `string`
- **必需**: 是
- **描述**: 事件所属的项目标识符
- **示例**:
  - `"my-app"`
  - `"client-project-xyz"`
  - `"internal-tools"`

### 置信度

#### confidence
- **类型**: `EventConfidence`
- **必需**: 是
- **描述**: 事件内容的可信度级别
- **枚举值**:
  - `reported`: 用户明确报告的内容
  - `observed`: 系统观察到的内容
  - `inferred`: 系统推断的内容
  - `provisional`: 临时的、可能变化的内容
  - `verified`: 已验证的内容

**使用指南**:
- 用户输入 → `reported`
- 自动分析 → `observed`
- AI 推断 → `inferred`
- 临时缓存 → `provisional`
- 人工验证 → `verified`

### 可选关联

#### sessionId
- **类型**: `string`
- **必需**: 否
- **描述**: 关联的会话标识符
- **示例**: `"session-20250429-123456"`

#### taskId
- **类型**: `string`
- **必需**: 否
- **描述**: 关联的任务标识符
- **示例**: `"task-implement-api-123"`

#### userId
- **类型**: `string`
- **必需**: 否
- **描述**: 关联的用户标识符
- **示例**: `"user-john-doe"`

### 事件负载

#### text
- **类型**: `string`
- **必需**: 是
- **描述**: 事件的主要文本内容
- **限制**: 建议 < 10KB
- **示例**:
  - `"用户反馈：需要改进性能"`
  - `"API 端点：POST /api/users"`

#### payload.kind
- **类型**: `EventKind`
- **必需**: 否
- **描述**: 用于路由的事件类型，与顶层 `kind` 相同
- **用途**: 当事件需要基于 payload 内容路由时使用

#### payload.file_path
- **类型**: `string`
- **必需**: 否
- **描述**: 关联的文件路径
- **示例**:
  - `"src/components/Button.tsx"`
  - `"docs/api-guide.md"`

#### payload.category
- **类型**: `string`
- **必需**: 否
- **描述**: 内容的分类标识
- **示例**:
  - `"user-feedback"`
  - `"code-snippet"`
  - `"design-decision"`

#### payload.tags
- **类型**: `string[]`
- **必需**: 否
- **描述**: 内容的标签列表
- **示例**:
  - `["typescript", "api", "rest"]`
  - `["bug", "high-priority"]`

#### payload.metadata
- **类型**: `Record<string, any>`
- **必需**: 否
- **描述**: 额外的元数据
- **示例**:
  ```typescript
  {
    author: "John Doe",
    timestamp: "2025-04-29T12:00:00Z",
    priority: "high",
    related_issues: ["ISSUE-123", "ISSUE-456"]
  }
  ```

## 验证规则

### 必需字段检查

```typescript
import { validateMemoHubEventBasic } from "@memohub/protocol";

const validation = validateMemoHubEventBasic(event);

if (!validation.valid) {
  console.error("验证失败:", validation.errors);
  // 修复错误...
}
```

### 常见验证错误

1. **缺少必需字段**
```json
{
  "valid": false,
  "errors": [
    "Missing required field: source",
    "Missing required field: kind"
  ]
}
```

2. **无效的枚举值**
```json
{
  "valid": false,
  "errors": [
    "Invalid enum value for source: 'invalid-source'"
  ]
}
```

3. **空文本内容**
```json
{
  "valid": false,
  "errors": [
    "Field 'text' cannot be empty"
  ]
}
```

## 示例事件

### 基础记忆事件

```json
{
  "source": "hermes",
  "channel": "agent-session-123",
  "kind": "memory",
  "projectId": "my-project",
  "confidence": "reported",
  "payload": {
    "text": "用户反馈：需要添加批量导入功能"
  }
}
```

### 代码片段事件

```json
{
  "source": "ide",
  "channel": "vscode-extension",
  "kind": "memory",
  "projectId": "codebase-analyzer",
  "confidence": "observed",
  "payload": {
    "text": "TypeScript 接口定义：\n```typescript\ninterface User {\n  id: string;\n  name: string;\n}\n```",
    "kind": "memory",
    "file_path": "src/types/user.ts",
    "category": "code-snippet",
    "tags": ["typescript", "interface"]
  }
}
```

### 设计决策事件

```json
{
  "source": "cli",
  "channel": "architect-meeting",
  "kind": "memory",
  "projectId": "product-roadmap",
  "confidence": "verified",
  "sessionId": "meeting-20250429",
  "payload": {
    "text": "决定采用 RESTful API 设计，使用 JSON 格式",
    "category": "design-decision",
    "tags": ["architecture", "api"],
    "metadata": {
      participants": ["Alice", "Bob", "Charlie"],
      meeting_date: "2025-04-29",
      decision_type: "technical"
    }
  }
}
```

## TypeScript 类型定义

### 导入类型

```typescript
import {
  MemoHubEvent,
  EventSource,
  EventKind,
  EventConfidence
} from "@memohub/protocol";
```

### 创建事件

```typescript
const event: MemoHubEvent = {
  source: EventSource.HERMES,
  channel: "session-123",
  kind: EventKind.MEMORY,
  projectId: "my-project",
  confidence: EventConfidence.REPORTED,
  payload: {
    text: "事件内容",
    kind: EventKind.MEMORY,
    category: "general"
  }
};
```

### 类型安全

```typescript
function processEvent(event: MemoHubEvent) {
  // 完全的类型安全
  switch (event.source) {
    case EventSource.HERMES:
      // TypeScript 知道这是 Hermes 事件
      break;
    case EventSource.IDE:
      // TypeScript 知道这是 IDE 事件
      break;
  }

  // event.kind 的类型是 EventKind
  // event.confidence 的类型是 EventConfidence
  // event.payload.text 的类型是 string
}
```

## 最佳实践

### 1. 选择正确的 Source

```typescript
// ✅ 好
event.source = EventSource.HERMES;  // 明确的来源

// ❌ 差
event.source = EventSource.EXTERNAL;  // 过于通用
```

### 2. 使用有意义的 Channel

```typescript
// ✅ 好
event.channel = "agent-session-123";      // 清晰的通道标识
event.channel = "vscode-extension";       // 明确的来源工具

// ❌ 差
event.channel = "default";                // 过于通用
event.channel = "channel-1";              // 无意义的名称
```

### 3. 选择适当的 Confidence

```typescript
// ✅ 好
event.confidence = EventConfidence.REPORTED;   // 用户输入
event.confidence = EventConfidence.INFERRED;   // AI 推断
event.confidence = EventConfidence.VERIFIED;   // 人工验证

// ❌ 差
event.confidence = EventConfidence.REPORTED;   // AI 生成的内容（应该用 INFERRED）
```

### 4. 适当使用元数据

```typescript
// ✅ 好
event.payload = {
  text: "API 设计决策",
  category: "design-decision",
  metadata: {
    author: "John Doe",
    date: "2025-04-29",
    related_issues: ["ISSUE-123"]
  }
};

// ❌ 差
event.payload = {
  text: "API 设计决策",
  metadata: {
    // 把所有内容都放在 metadata 中
    text: "API 设计决策",  // 重复
    category: "design-decision",  // 应该作为独立字段
    data: { /* 大量嵌套数据 */ }
  }
};
```

## 参考资料

- [Integration Hub 架构](architecture.md)
- [MCP 工具指南](mcp-tools.md)
- [迁移指南](migration.md)
