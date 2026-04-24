# MemoHub v3 集成指南

欢迎使用 MemoHub v3 集成指南！本文档为 AI Agent 和开发者提供完整的集成方式说明。

---

## 🎯 快速选择集成方式

### 🤖 AI Agent 集成

如果你是 AI Agent（如 Claude, ChatGPT, Hermes），推荐使用以下集成方式：

#### 1. **MCP 协议集成** (推荐 ⭐)

**适用场景**: 所有支持 MCP 协议的 AI Agent

**优势**:
- ✅ 标准协议，无需定制
- ✅ 7 个工具，覆盖所有功能
- ✅ 直接调用，无需额外开发

**集成方式**: 详见 [MCP 集成指南](./mcp-integration.md)

**快速集成**:
```bash
# 1. 构建项目
cd /path/to/memo-hub
bun run build

# 2. 配置 MCP Server (添加到你的 AI Agent 配置)
# command: node /path/to/memo-hub/apps/cli/dist/index.js serve
# env: { MEMOHUB_DB_PATH: "你的数据库路径" }

# 3. 重启 AI Agent
```

**可用工具**:
- `add_knowledge` - 添加知识
- `query_knowledge` - 查询知识
- `delete_knowledge` - 删除知识
- `list_categories` - 列出分类
- `add_code` - 添加代码
- `search_code` - 搜索代码
- `get_stats` - 获取统计

---

#### 2. **CLI 命令集成**

**适用场景**: 需要通过命令行调用的场景

**优势**:
- ✅ 简单直接
- ✅ 支持 Shell 脚本
- ✅ 易于调试

**集成方式**: 详见 [CLI 集成指南](./cli-integration.md)

**快速集成**:
```bash
# 全局安装 CLI
cd /path/to/memo-hub/apps/cli
npm link

# 使用 CLI 命令
memohub add "知识内容" -c category -t tags
memohub search "查询内容" -l 5
```

**可用命令**:
- `memohub add` - 添加知识
- `memohub search` - 搜索知识
- `memohub list` - 列出分类
- `memohub delete` - 删除知识
- `memohub add-code` - 添加代码
- `memohub search-code` - 搜索代码
- `memohub search-all` - 统一检索
- `memohub dedup` - 去重扫描
- `memohub distill` - 知识蒸馏
- `memohub config` - 配置管理

---

#### 3. **Hermes AI 集成**

**适用场景**: 使用 Hermes AI Agent 的用户

**优势**:
- ✅ 原生集成
- ✅ 配置简单
- ✅ 功能完整

**集成方式**: 详见 [Hermes 集成指南](./hermes-guide.md)

**快速集成**:
```yaml
# ~/.hermes/config.yaml
mcpServers:
  memohub:
    command: node
    args: ["/path/to/memo-hub/apps/cli/dist/index.js", "serve"]
    env:
      MEMOHUB_DB_PATH: ~/.hermes/data/memohub.lancedb
      EMBEDDING_URL: http://localhost:11434/v1
```

---

### 💻 开发者集成

如果你是开发者，想要在代码中使用 MemoHub：

#### 1. **TypeScript/JavaScript 集成** (开发中)

**适用场景**: Node.js 项目、Bun 项目

**状态**: 🚧 正在完善中

**预计支持**:
- ✅ 导入核心包
- ✅ 初始化内核
- ✅ 注册轨道
- ✅ 调用接口

**示例代码**:
```typescript
import { MemoryKernel } from '@memohub/core';
import { InsightTrack } from '@memohub/track-insight';

// 创建内核
const kernel = new MemoryKernel(config);
await kernel.registerTrack(new InsightTrack());

// 使用内核
const result = await kernel.dispatch({
  op: MemoOp.ADD,
  trackId: 'track-insight',
  payload: { text: "知识内容" }
});
```

**注意**: 目前建议使用 MCP 协议或 CLI 命令集成。SDK 集成正在完善中。

---

## 📋 集成方式对比

| 集成方式 | 适用对象 | 难度 | 功能完整度 | 推荐度 |
|---------|---------|------|-----------|--------|
| **MCP 协议** | AI Agent | ⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **CLI 命令** | 所有用户 | ⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Hermes AI** | Hermes 用户 | ⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **TypeScript SDK** | 开发者 | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

---

## 🚀 快速开始

### AI Agent 集成步骤

1. **构建项目**
   ```bash
   cd /path/to/memo-hub
   bun run build
   ```

2. **配置 MCP Server**
   - 在你的 AI Agent 配置中添加 MemoHub MCP Server
   - 设置环境变量（数据库路径、Ollama 地址等）

3. **重启 AI Agent**
   - 重启后即可使用 7 个 MCP 工具

4. **验证集成**
   - 调用 `get_stats` 工具验证连接

### 开发者集成步骤

1. **安装依赖**
   ```bash
   npm install @memohub/core @memohub/protocol
   ```

2. **初始化内核**
   ```typescript
   import { MemoryKernel } from '@memohub/core';
   const kernel = new MemoryKernel(config);
   ```

3. **注册轨道**
   ```typescript
   await kernel.registerTrack(new InsightTrack());
   ```

4. **使用内核**
   ```typescript
   const result = await kernel.dispatch({
     op: MemoOp.ADD,
     trackId: 'track-insight',
     payload: { text: "知识内容" }
   });
   ```

---

## 📚 详细文档

### AI Agent 集成
- [MCP 协议集成](./mcp-integration.md) - 标准 MCP 协议集成
- [Hermes AI 集成](./hermes-guide.md) - Hermes AI Agent 集成
- [CLI 命令集成](./cli-integration.md) - 命令行集成

### 开发者集成
- [TypeScript 集成](./typescript-integration.md) - TypeScript/JavaScript 集成
- [API 参考](../api/reference.md) - 完整 API 文档

### 配置指南
- [配置指南](../guides/configuration.md) - 详细配置说明
- [私有同步](../guides/private-sync.md) - 私有仓库同步

---

## 🎯 集成最佳实践

### 1. 环境配置

**推荐**：使用环境变量配置

```bash
export MEMOHUB_DB_PATH=~/.memohub/data/memohub.lancedb
export MEMOHUB_CAS_PATH=~/.memohub/blobs
export EMBEDDING_URL=http://localhost:11434/v1
export EMBEDDING_MODEL=nomic-embed-text-v2-moe
```

**原因**:
- ✅ 灵活性高
- ✅ 不修改代码
- ✅ 支持多环境

### 2. 数据隔离

**推荐**：不同 Agent 使用不同数据库路径

```bash
# Hermes AI
export MEMOHUB_DB_PATH=~/.hermes/data/memohub.lancedb

# Claude Code
export MEMOHUB_DB_PATH=~/.claude/data/memohub.lancedb

# ChatGPT
export MEMOHUB_DB_PATH=~/.chatgpt/data/memohub.lancedb
```

**原因**:
- ✅ 数据隔离
- ✅ 避免冲突
- ✅ 易于管理

### 3. 错误处理

**推荐**：检查 `success` 字段

```typescript
const result = await kernel.dispatch(...);
if (!result.success) {
  console.error('Error:', result.error);
  // 处理错误
}
```

**原因**:
- ✅ 避免崩溃
- ✅ 友好提示
- ✅ 易于调试

---

## 🔍 故障排除

### 常见问题

**Q1: MCP Server 无法启动？**
- 检查 Ollama 是否运行: `ollama serve`
- 检查数据库路径是否有写权限
- 查看错误日志

**Q2: 集成后无法调用工具？**
- 验证 MCP Server 配置是否正确
- 检查环境变量是否设置
- 重启 AI Agent

**Q3: 数据库文件损坏？**
- 删除数据库文件重新创建
- 检查磁盘空间
- 查看 LanceDB 日志

### 获取帮助

- **文档中心**: [docs/README.md](../README.md)
- **架构文档**: [architecture/overview.md](../architecture/overview.md)
- **GitHub Issues**: [提交问题](https://github.com/your-repo/issues)

---

**版本**: 3.0.0
**最后更新**: 2026-04-24
