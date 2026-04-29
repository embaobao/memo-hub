# 迁移指南

## 概述

本指南帮助您从旧的 MemoHub 工具迁移到新的 Integration Hub 系统。

## 主要变化

### 旧系统

- 直接使用 `memohub_add` 添加记忆
- 手动指定 `trackId`
- 有限的事件元数据
- 无内容去重

### 新系统

- 使用 `memohub_ingest_event` 摄取事件
- 自动路由到合适的轨道
- 丰富的事件元数据
- CAS 内容去重
- 事件溯源和审计

## 迁移步骤

### 步骤 1: 更新 MCP 工具调用

#### 旧代码

```typescript
await mcp.callTool("memohub_add", {
  text: "用户反馈：需要改进性能",
  trackId: "track-insight",
  meta: {
    category: "feedback"
  }
});
```

#### 新代码

```typescript
await mcp.callTool("memohub_ingest_event", {
  event: {
    source: "mcp",
    channel: "default",
    kind: "memory",
    projectId: "my-project",
    confidence: "reported",
    payload: {
      text: "用户反馈：需要改进性能",
      kind: "memory",
      category: "feedback"
    }
  }
});
```

### 步骤 2: 添加必需的事件字段

新系统需要以下额外字段：

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| `source` | `EventSource` | 事件来源 | `"hermes"`, `"ide"`, `"cli"`, `"mcp"`, `"external"` |
| `channel` | `string` | 事件通道 | `"session-123"`, `"vscode-extension"` |
| `kind` | `EventKind` | 事件类型 | `"memory"` (目前仅支持此类型) |
| `projectId` | `string` | 项目 ID | `"my-project"`, `"client-xyz"` |
| `confidence` | `EventConfidence` | 置信度 | `"reported"`, `"observed"`, `"inferred"`, `"provisional"`, `"verified"` |

### 步骤 3: 更新查询逻辑

#### 旧代码

```typescript
const results = await mcp.callTool("memohub_search", {
  query: "API 设计",
  trackId: "track-insight",
  limit: 5
});
```

#### 新代码

```typescript
const results = await mcp.callTool("memohub_query", {
  type: "memory",
  projectId: "my-project",
  query: "API 设计",
  limit: 5
});
```

### 步骤 4: 更新错误处理

#### 旧错误格式

```typescript
{
  success: false,
  error: {
    code: "ERR_TRACK_NOT_FOUND",
    message: "Track 'track-xyz' not found"
  }
}
```

#### 新错误格式

```typescript
{
  success: false,
  error: "Invalid event structure",
  details: ["Missing required field: projectId"]
}
```

## 迁移映射表

### 字段映射

| 旧字段 | 新字段 | 说明 |
|--------|--------|------|
| `text` | `payload.text` | 内容文本 |
| `trackId` | (自动路由) | 由 MemoryRouter 自动决定 |
| `meta.category` | `payload.category` | 内容分类 |
| `meta.*` | `payload.metadata.*` | 其他元数据 |

### 新增字段

| 新字段 | 默认值 | 说明 |
|--------|--------|------|
| `source` | - | 事件来源 (必需) |
| `channel` | `"default"` | 事件通道 |
| `kind` | `"memory"` | 事件类型 |
| `projectId` | - | 项目 ID (必需) |
| `confidence` | `"reported"` | 置信度 |
| `sessionId` | - | 会话 ID (可选) |
| `taskId` | - | 任务 ID (可选) |

## 常见迁移场景

### 场景 1: Hermes AI Agent

#### 旧实现

```typescript
// Hermes Agent 记忆用户对话
async function rememberMessage(userMessage: string) {
  await mcp.callTool("memohub_add", {
    text: `用户: ${userMessage}`,
    trackId: "track-insight"
  });
}
```

#### 新实现

```typescript
async function rememberMessage(
  sessionId: string,
  userMessage: string
) {
  await mcp.callTool("memohub_ingest_event", {
    event: {
      source: "hermes",
      channel: sessionId,
      kind: "memory",
      projectId: "hermes-integration",
      confidence: "reported",
      payload: {
        text: `用户: ${userMessage}`,
        kind: "memory"
      }
    }
  });
}
```

**改进点**:
- ✅ 添加了会话追踪 (`sessionId`)
- ✅ 明确了事件来源 (`source: "hermes"`)
- ✅ 支持事件溯源和审计

### 场景 2: IDE 扩展

#### 旧实现

```typescript
// VS Code 扩展记录代码片段
async function saveCodeSnippet(code: string, description: string) {
  await mcp.callTool("memohub_add", {
    text: `${description}\n\n${code}`,
    trackId: "track-source",
    meta: {
      language: "typescript",
      file_path: "src/utils.ts"
    }
  });
}
```

#### 新实现

```typescript
async function saveCodeSnippet(
  code: string,
  description: string,
  filePath: string
) {
  await mcp.callTool("memohub_ingest_event", {
    event: {
      source: "ide",
      channel: "vscode-extension",
      kind: "memory",
      projectId: "codebase-analyzer",
      confidence: "observed",
      payload: {
        text: `${description}\n\n\`\`\`typescript\n${code}\n\`\`\``,
        kind: "memory",
        file_path: filePath,
        category: "code-snippet"
      }
    }
  });
}
```

**改进点**:
- ✅ 自动路由到合适的轨道
- ✅ 内容去重 (通过 CAS)
- ✅ 更好的代码格式化

### 场景 3: CLI 工具

#### 旧实现

```typescript
// CLI 工具记录命令执行结果
async function rememberCommand(command: string, output: string) {
  await mcp.callTool("memohub_add", {
    text: `命令: ${command}\n输出: ${output}`,
    trackId: "track-insight"
  });
}
```

#### 新实现

```typescript
async function rememberCommand(
  command: string,
  output: string,
  exitCode: number
) {
  await mcp.callTool("memohub_ingest_event", {
    event: {
      source: "cli",
      channel: "shell-command",
      kind: "memory",
      projectId: "dev-workflow",
      confidence: exitCode === 0 ? "verified" : "provisional",
      payload: {
        text: `命令: ${command}\n输出: ${output}`,
        kind: "memory",
        category: "command-execution",
        metadata: {
          command: command,
          exit_code: exitCode,
          timestamp: new Date().toISOString()
        }
      }
    }
  });
}
```

**改进点**:
- ✅ 根据退出码调整置信度
- ✅ 结构化的命令元数据
- ✅ 更好的错误追踪

## 向后兼容性

### 支持的旧功能

以下旧功能仍然完全支持：

- ✅ `memohub_add` 工具继续可用
- ✅ `memohub_search` 工具继续可用
- ✅ `memohub_delete` 工具继续可用
- ✅ 现有的 track 功能不受影响
- ✅ 现有的存储功能不受影响

### 不兼容的变化

以下变化需要更新代码：

- ❌ 旧的事件格式不再被 Integration Hub 接受
- ❌ 手动指定 `trackId` 可能被自动路由覆盖
- ❌ 没有必需字段的事件将被拒绝

## 迁移检查清单

### 准备阶段

- [ ] 阅读完整的 Integration Hub 架构文档
- [ ] 理解 MemoHubEvent schema
- [ ] 测试新的 MCP 工具
- [ ] 备份现有数据

### 实施阶段

- [ ] 更新所有 `memohub_add` 调用
- [ ] 添加必需的事件字段
- [ ] 更新查询逻辑
- [ ] 更新错误处理
- [ ] 测试迁移后的功能

### 验证阶段

- [ ] 验证所有功能正常工作
- [ ] 检查事件是否正确摄取
- [ ] 确认路由规则生效
- [ ] 测试查询功能
- [ ] 验证性能没有明显下降

### 部署阶段

- [ ] 更新生产环境配置
- [ ] 监控错误日志
- [ ] 收集性能指标
- [ ] 准备回滚计划

## 回滚计划

如果迁移后遇到问题，可以：

1. **回滚到旧工具**:
   ```typescript
   // 临时使用旧工具
   await mcp.callTool("memohub_add", {
     text: "紧急修复内容",
     trackId: "track-insight"
   });
   ```

2. **禁用自动路由**:
   ```json
   {
     "routing": {
       "enabled": false,
       "defaultTrack": "track-insight"
     }
   }
   ```

3. **切换到稳定分支**:
   ```bash
   git checkout stable-branch
   bun install
   bun run build
   ```

## 常见问题

### Q: 是否必须立即迁移？

**A**: 不是。旧工具仍然完全支持。您可以逐步迁移，或者同时使用新旧工具。

### Q: 迁移会影响性能吗？

**A**: 新系统增加了一些开销（事件验证、CAS 哈希），但总延迟仍然 < 2ms，对大多数应用没有明显影响。

### Q: 如何处理现有数据？

**A**: 现有数据不需要迁移。新系统与现有数据完全兼容。

### Q: 是否支持批量操作？

**A**: 支持。您可以直接使用 `IntegrationHub.ingestBatch()` 进行批量操作。

### Q: 如何自定义路由规则？

**A**: 在配置文件中添加自定义规则：

```json
{
  "routing": {
    "enabled": true,
    "defaultTrack": "track-insight",
    "rules": [
      {
        "type": "kind_match",
        "kind": "memory",
        "trackId": "track-insight"
      },
      {
        "type": "file_suffix",
        "suffixes": [".ts", ".js"],
        "trackId": "track-source"
      }
    ]
  }
}
```

## 获取帮助

如果在迁移过程中遇到问题：

1. 查看 [Integration Hub 架构](architecture.md)
2. 参考 [事件 Schema](event-schema.md)
3. 阅读 [MCP 工具指南](mcp-tools.md)
4. 检查 [故障排除](#故障排除) 部分
5. 联系技术支持

## 故障排除

### 问题：事件摄取失败

**症状**:
```typescript
{
  success: false,
  error: "Invalid event structure"
}
```

**解决方案**:
1. 检查所有必需字段是否存在
2. 验证枚举值是否正确
3. 使用 `validateMemoHubEventBasic` 进行验证

### 问题：路由不符合预期

**症状**: 事件被路由到错误的轨道

**解决方案**:
1. 检查路由规则配置
2. 验证 `payload.kind` 字段
3. 查看路由日志

### 问题：性能下降

**症状**: 摄取速度明显变慢

**解决方案**:
1. 使用批量操作
2. 检查 CAS 存储性能
3. 优化事件 payload 大小

## 参考资料

- [Integration Hub 架构](architecture.md)
- [事件 Schema](event-schema.md)
- [MCP 工具指南](mcp-tools.md)
- [Text2Mem 协议](../architecture/text2mem-protocol.md)
