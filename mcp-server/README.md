# MemoHub MCP Server

**统一的 MemoHub MCP 服务器 - 整合 GBrain 和 ClawMem**

---

## 📋 简介

MemoHub MCP Server 是一个统一的 MCP（Model Context Protocol）服务器，整合了双轨记忆系统：

- **GBrain**：通用知识记忆
- **ClawMem**：代码记忆

---

## 🚀 特性

### 统一接口
- ✅ 一个 MCP 服务器，两个记忆轨道
- ✅ 标准化的工具接口
- ✅ 统一的配置管理

### GBrain 工具
- `query_knowledge` - 搜索知识
- `add_knowledge` - 添加知识
- `list_categories` - 列出分类
- `delete_knowledge` - 删除知识

### ClawMem 工具
- `search_code` - 搜索代码
- `add_code` - 添加代码
- `list_symbols` - 列出符号

### 统一工具
- `get_stats` - 获取统计信息
- `search_all` - 同时搜索知识和代码

---

## 📦 安装

### 从源码安装

```bash
cd ~/workspace/memory-system-cli/mcp-server
bun install
bun run build
```

### 作为依赖安装

```bash
cd ~/workspace/memory-system-cli/mcp-server
bun run build
npm install .
```

---

## ⚙️ 配置

### 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `GBRAIN_DB_PATH` | GBrain 数据库路径 | `~/.hermes/data/gbrain.lancedb` |
| `CLAWMEM_DB_PATH` | ClawMem 数据库路径 | `~/.hermes/data/clawmem.lancedb` |
| `EMBEDDING_URL` | 嵌入 API 地址 | `http://localhost:11434/v1` |
| `EMBEDDING_MODEL` | 嵌入模型 | `nomic-embed-text-v2-moe` |

### Hermes 配置

在 `~/.hermes/config.yaml` 中添加：

```yaml
mcpServers:
  memohub:
    command: node
    args:
      - /path/to/memohub/mcp-server/dist/index.js
    env:
      GBRAIN_DB_PATH: ~/.hermes/data/gbrain.lancedb
      CLAWMEM_DB_PATH: ~/.hermes/data/clawmem.lancedb
      EMBEDDING_URL: http://localhost:11434/v1
```

---

## 🛠️ 使用

### 启动服务器

```bash
cd ~/workspace/memory-system-cli/mcp-server
bun run start
```

### 工具使用示例

#### 查询知识

```typescript
{
  "name": "query_knowledge",
  "arguments": {
    "query": "用户喜欢 TypeScript",
    "limit": 3,
    "category": "user"
  }
}
```

#### 添加知识

```typescript
{
  "name": "add_knowledge",
  "arguments": {
    "text": "MemoHub 是我的双轨记忆中心",
    "category": "system",
    "importance": 0.9,
    "tags": ["memohub", "memory"]
  }
}
```

#### 搜索代码

```typescript
{
  "name": "search_code",
  "arguments": {
    "query": "interface User",
    "limit": 3,
    "language": "typescript",
    "ast_type": "interface"
  }
}
```

#### 添加代码

```typescript
{
  "name": "add_code",
  "arguments": {
    "text": "interface User { name: string; age: number; }",
    "ast_type": "interface",
    "symbol_name": "User",
    "file_path": "user.ts",
    "language": "typescript",
    "importance": 0.8
  }
}
```

#### 统一搜索

```typescript
{
  "name": "search_all",
  "arguments": {
    "query": "记忆系统",
    "limit": 5
  }
}
```

#### 获取统计

```typescript
{
  "name": "get_stats",
  "arguments": {}
}
```

---

## 🔧 开发

### 构建项目

```bash
bun run build
```

### 开发模式（热重载）

```bash
bun run dev
```

### 运行测试

```bash
bun test
```

---

## 📊 工具列表

### GBrain 工具

| 工具 | 描述 | 参数 |
|------|------|------|
| `query_knowledge` | 搜索知识 | `query`, `limit`, `category` |
| `add_knowledge` | 添加知识 | `text`, `category`, `importance`, `tags` |
| `list_categories` | 列出分类 | 无 |
| `delete_knowledge` | 删除知识 | `ids` |

### ClawMem 工具

| 工具 | 描述 | 参数 |
|------|------|------|
| `search_code` | 搜索代码 | `query`, `limit`, `language`, `ast_type` |
| `add_code` | 添加代码 | `text`, `ast_type`, `symbol_name`, `file_path`, `language`, `importance`, `tags` |
| `list_symbols` | 列出符号 | `language`, `ast_type` |

### 统一工具

| 工具 | 描述 | 参数 |
|------|------|------|
| `get_stats` | 获取统计 | 无 |
| `search_all` | 统一搜索 | `query`, `limit` |

---

## 🔌 与 Hermes 集成

### 配置 Hermes

在 `~/.hermes/config.yaml` 中：

```yaml
mcpServers:
  memohub:
    command: node
    args:
      - /Users/embaobao/workspace/memory-system-cli/mcp-server/dist/index.js
    env:
      GBRAIN_DB_PATH: ~/.hermes/data/gbrain.lancedb
      CLAWMEM_DB_PATH: ~/.hermes/data/clawmem.lancedb
      EMBEDDING_URL: http://localhost:11434/v1
      EMBEDDING_MODEL: nomic-embed-text-v2-moe
```

### 重启 Hermes

```bash
# 重启 Hermes 服务
hermes restart
```

### 在 Hermes 中使用

Hermes 会自动发现 MemoHub MCP 工具，可以直接使用：

```
用户: 查找关于 TypeScript 的知识
Hermes: [调用 query_knowledge] 找到 3 条结果...
```

---

## 🎯 优势

### 对比独立的 MCP 服务器

| 特性 | 独立 MCP | MemoHub MCP |
|------|----------|-------------|
| 配置复杂度 | 需配置 2 个服务器 | 只需 1 个服务器 |
| 资源占用 | 2 个进程 | 1 个进程 |
| 统一搜索 | 需要分别调用 | `search_all` 一次调用 |
| 管理复杂度 | 需要管理 2 个项目 | 统一管理 |

### 对比 CLI

| 特性 | CLI | MCP |
|------|-----|-----|
| 使用方式 | 命令行 | 标准 MCP 协议 |
| 集成方式 | 独立使用 | 与 AI 智能体集成 |
| 自动化程度 | 手动调用 | AI 自动调用 |
| 使用场景 | 日常使用 | 智能体长期记忆 |

---

## 📝 注意事项

1. **Ollama 服务**：确保 Ollama 服务运行中
2. **数据库路径**：默认使用 Hermes 数据库路径
3. **权限**：确保有数据库读写权限
4. **兼容性**：完全兼容现有 GBrain 和 ClawMem 数据库

---

## 🐛 故障排除

### 启动失败

```bash
# 检查 Ollama 服务
curl http://localhost:11434/api/tags

# 检查数据库路径
ls -la ~/.hermes/data/
```

### 工具调用失败

```bash
# 查看日志
bun run start 2>&1 | grep "Error"
```

### 连接问题

```bash
# 测试数据库连接
cd mcp-server
node -e "
import * as lancedb from '@lancedb/lancedb';
const db = await lancedb.connect('~/.hermes/data/gbrain.lancedb');
console.log('Connected!');
"
```

---

## 🚀 路线图

- [ ] 添加批量操作工具
- [ ] 支持自定义嵌入模型
- [ ] 添加备份/恢复工具
- [ ] 支持增量同步
- [ ] 添加 Webhook 支持

---

## 📄 许可证

MIT

---

## 🤝 贡献

欢迎贡献！请查看主项目的 [CONTRIBUTING.md](../CONTRIBUTING.md)。

---

## 📮 联系方式

- 作者：盟哥
- 问题反馈：[GitHub Issues](https://github.com/your-username/memohub/issues)
