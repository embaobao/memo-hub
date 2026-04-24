# MemoHub v1 - MCP 协议集成指南

> **🎯 适用对象**: 所有支持 MCP 协议的 AI Agent（Claude, ChatGPT, 等）
> **⚡ 集成难度**: ⭐ (非常简单)
> **🔧 功能完整度**: ⭐⭐⭐⭐⭐ (100%)

---

## 📋 目录

- [快速开始](#快速开始)
- [前置条件：安装 CLI](#前置条件安装-cli)
- [MCP Server 配置](#mcp-server-配置)
- [可用工具](#可用工具)
- [工具使用示例](#工具使用示例)
- [环境变量](#环境变量)
- [故障排除](#故障排除)

---

## 🚀 快速开始

### AI Agent 集成 3 步骤

#### 步骤 0: 安装 CLI（前置条件）

**重要**: 在配置 MCP Server 之前，必须先全局安装 MemoHub CLI。

```bash
# 1. 克隆或下载项目
cd /path/to/memo-hub

# 2. 安装依赖
bun install

# 3. 构建项目
bun run build

# 4. 全局安装 CLI
cd apps/cli
npm link --force

# 5. 验证安装
memohub --version
```

**预期输出**:
```
3.0.0
```

如果看到版本号，说明 CLI 安装成功！

---

#### 步骤 1: 获取 CLI 路径

安装完成后，获取 CLI 的绝对路径：

```bash
# 方法 1: 使用 which 命令
which memohub

# 方法 2: 使用 where 命令（Windows）
where memohub

# 方法 3: 查看 npm 全局路径
npm list -g --depth=0 | grep memohub
```

**示例输出**:
```bash
# macOS/Linux
/usr/local/bin/memohub

# 或
/Users/your-username/.npm-global/bin/memohub

# Windows
C:\Users\your-username\AppData\Roaming\npm\memohub.cmd
```

**记录这个路径**，配置 MCP Server 时需要使用。

---

#### 步骤 2: 配置 MCP Server

在你的 AI Agent 配置文件中添加 MemoHub MCP Server。

**重要**: 
- **使用 `memohub serve` 命令启动 MCP Server**
- **不要使用绝对路径指向 `dist/index.js`**

---

#### 步骤 3: 重启 AI Agent

重启你的 AI Agent 应用。

---

## 🔧 MCP Server 配置

### 配置方式

**使用 `memohub serve` 命令启动 MCP Server**

### Claude Code 配置

**配置文件**: `~/.claude/config.json`

```json
{
  "mcpServers": {
    "memohub": {
      "command": "memohub",
      "args": ["serve"],
      "env": {
        "MEMOHUB_DB_PATH": "~/.claude/data/memohub.lancedb",
        "MEMOHUB_CAS_PATH": "~/.claude/data/memohub-cas",
        "EMBEDDING_URL": "http://localhost:11434/v1",
        "EMBEDDING_MODEL": "nomic-embed-text-v2-moe"
      }
    }
  }
}
```

**说明**:
- `command`: 使用 `memohub` 命令（全局安装后可用）
- `args`: 使用 `["serve"]` 参数启动 MCP Server

---

### ChatGPT 配置

**在 ChatGPT 设置中添加 MCP Server**:

1. 打开 ChatGPT 设置
2. 找到 "MCP Servers" 配置
3. 添加新的 MCP Server：

**配置信息**:
- **Name**: MemoHub
- **Command**: `memohub`
- **Args**: `["serve"]`
- **Environment Variables**:
  ```
  MEMOHUB_DB_PATH=~/.chatgpt/data/memohub.lancedb
  MEMOHUB_CAS_PATH=~/.chatgpt/data/memohub-cas
  EMBEDDING_URL=http://localhost:11434/v1
  EMBEDDING_MODEL=nomic-embed-text-v2-moe
  ```

---

### 其他 AI Agent 配置

**通用配置格式**:

```json
{
  "mcpServers": {
    "memohub": {
      "command": "memohub",
      "args": ["serve"],
      "env": {
        "MEMOHUB_DB_PATH": "你的数据库路径",
        "EMBEDDING_URL": "http://localhost:11434/v1"
      }
    }
  }
}
```

---

## 🛠️ 可用工具

MemoHub MCP Server 提供 7 个工具：

### 1. add_knowledge

**功能**: 添加知识到知识轨道

**参数**:
```typescript
{
  text: string;           // 知识内容 (必填)
  category?: string;      // 分类 (可选，默认: "other")
  importance?: number;    // 重要性 0-1 (可选，默认: 0.5)
  tags?: string[];        // 标签列表 (可选)
}
```

**返回**:
```typescript
{
  success: boolean;
  data?: {
    id: string;           // 记录 ID
    hash: string;         // CAS 哈希
  };
  error?: string;
}
```

**使用示例**:
```json
{
  "text": "用户喜欢使用 TypeScript 进行开发",
  "category": "user",
  "importance": 0.8,
  "tags": ["preference", "typescript", "development"]
}
```

---

### 2. query_knowledge

**功能**: 查询知识（语义搜索）

**参数**:
```typescript
{
  query: string;          // 查询内容 (必填)
  limit?: number;         // 返回数量 (可选，默认: 5)
}
```

**返回**:
```typescript
{
  success: boolean;
  data?: Array<{
    id: string;
    text: string;
    _distance: number;    // 相似度距离 (越小越相似)
    metadata?: {
      category: string;
      tags: string[];
      importance: number;
    };
  }>;
  error?: string;
}
```

**使用示例**:
```json
{
  "query": "TypeScript 开发偏好",
  "limit": 5
}
```

---

### 3. delete_knowledge

**功能**: 删除知识

**参数**:
```typescript
{
  ids?: string[];         // ID 列表 (可选)
  category?: string;      // 按分类删除 (可选)
}
```

**返回**:
```typescript
{
  success: boolean;
  error?: string;
}
```

**使用示例**:
```json
{
  "ids": ["insight-1713990000-abc123", "insight-1713990001-def456"]
}
```

或

```json
{
  "category": "user"
}
```

---

### 4. list_categories

**功能**: 列出所有分类

**参数**: 无

**返回**:
```typescript
{
  success: boolean;
  data?: {
    categories: {
      [category: string]: number;  // 分类名 -> 数量
    };
    total: number;                 // 总数
  };
  error?: string;
}
```

---

### 5. add_code

**功能**: 添加代码到代码轨道

**参数**:
```typescript
{
  code: string;           // 代码内容 (必填)
  language?: string;      // 编程语言 (可选，默认: "typescript")
  file_path?: string;     // 文件路径 (可选)
}
```

**返回**:
```typescript
{
  success: boolean;
  data?: {
    count: number;        // 添加的符号数量
  };
  error?: string;
}
```

**使用示例**:
```json
{
  "code": "export function hello() {\n  console.log('Hello World');\n}",
  "language": "typescript",
  "file_path": "./src/hello.ts"
}
```

---

### 6. search_code

**功能**: 搜索代码（语义搜索）

**参数**:
```typescript
{
  query: string;          // 查询内容 (必填)
  limit?: number;         // 返回数量 (可选，默认: 5)
}
```

**返回**:
```typescript
{
  success: boolean;
  data?: Array<{
    id: string;
    text: string;
    _distance: number;
    metadata?: {
      symbol_name: string;
      ast_type: string;
      file_path: string;
      language: string;
    };
  }>;
  error?: string;
}
```

**使用示例**:
```json
{
  "query": "hello function",
  "limit": 5
}
```

---

### 7. get_stats

**功能**: 获取统计信息

**参数**: 无

**返回**:
```typescript
{
  tracks: string[];       // 已注册的轨道列表
  insight: {
    categories: { [category: string]: number };
    total: number;
  };
}
```

---

## 💡 工具使用示例

### 场景 1: 记住用户偏好

**AI Agent 对话**:
```
用户: 我喜欢用 TypeScript 开发，比较注重类型安全。

AI: 我记住了你的偏好。
   [调用 add_knowledge]
   {
     "text": "用户喜欢使用 TypeScript 进行开发，注重类型安全",
     "category": "user",
     "importance": 0.9,
     "tags": ["preference", "typescript", "type-safety"]
   }
```

---

### 场景 2: 查询用户偏好

**AI Agent 对话**:
```
用户: 我应该用什么语言开发这个项目？

AI: 根据我记住的信息，你喜欢 TypeScript。
   [调用 query_knowledge]
   {
     "query": "开发语言偏好",
     "limit": 3
   }

   结果: 你喜欢 TypeScript，注重类型安全，所以推荐使用 TypeScript。
```

---

### 场景 3: 添加代码片段

**AI Agent 对话**:
```
用户: 保存这个 React Hook 模板

AI: 好的，我帮你保存。
   [调用 add_code]
   {
     "code": "export function useCustom() {\n  const [state, setState] = useState(null);\n  // ...\n}",
     "language": "typescript",
     "file_path": "./hooks/useCustom.ts"
   }
```

---

### 场景 4: 搜索代码

**AI Agent 对话**:
```
用户: 我之前写过一个 useFetch hook，在哪里？

AI: 让我帮你找找。
   [调用 search_code]
   {
     "query": "useFetch hook",
     "limit": 5
   }

   结果: 找到了！在 ./src/hooks/useFetch.ts
```

---

## 🔐 环境变量

### 必需环境变量

无（所有配置都有默认值）

### 可选环境变量

```bash
# 数据库配置
MEMOHUB_DB_PATH=~/.memohub/data/memohub.lancedb
MEMOHUB_CAS_PATH=~/.memohub/blobs

# AI 嵌入配置
EMBEDDING_URL=http://localhost:11434/v1
EMBEDDING_MODEL=nomic-embed-text-v2-moe
EMBEDDING_DIMENSIONS=768
EMBEDDING_TIMEOUT=30
```

### 环境变量优先级

```
环境变量 (最高) > MCP Server env > 代码默认值 (最低)
```

---

## 🔍 故障排除

### 问题 1: MCP Server 无法启动

**症状**: AI Agent 无法连接到 MemoHub

**排查步骤**:

1. **检查 CLI 是否安装**
   ```bash
   memohub --version
   ```
   - 如果显示 `command not found`，需要先安装 CLI

2. **手动测试 CLI**
   ```bash
   memohub serve
   ```
   - 看是否能正常启动

3. **检查 Node.js 版本**
   ```bash
   node --version  # 应该 >= 22.0.0
   ```

---

### 问题 2: 工具调用失败

**症状**: 调用工具时返回错误

**排查步骤**:

1. **检查 Ollama 是否运行**
   ```bash
   ollama list
   ```
   - 如果没有运行，启动: `ollama serve`

2. **检查嵌入模型**
   ```bash
   ollama list | grep nomic-embed-text-v2-moe
   ```
   - 如果没有，拉取模型: `ollama pull nomic-embed-text-v2-moe`

3. **检查数据库路径**
   ```bash
   ls -la ~/.memohub/data/memohub.lancedb
   ```
   - 检查是否有写权限

---

### 问题 3: 查询结果为空

**症状**: `query_knowledge` 或 `search_code` 返回空结果

**排查步骤**:

1. **检查是否有数据**
   ```json
   调用 get_stats 工具
   ```

2. **检查查询文本**
   - 确保查询文本与存储内容语义相关

3. **调整 limit 参数**
   - 增加 limit 值

---

## 🎯 最佳实践

### 1. 数据隔离

**推荐**: 不同 AI Agent 使用不同数据库路径

```json
// Claude Code
"MEMOHUB_DB_PATH": "~/.claude/data/memohub.lancedb"

// ChatGPT
"MEMOHUB_DB_PATH": "~/.chatgpt/data/memohub.lancedb"

// 其他 Agent
"MEMOHUB_DB_PATH": "~/.other-agent/data/memohub.lancedb"
```

**原因**:
- ✅ 避免数据冲突
- ✅ 便于独立管理
- ✅ 易于数据迁移

---

### 2. 错误处理

**推荐**: AI Agent 应检查 `success` 字段

```typescript
// AI Agent 伪代码
const result = await callMCPTool("add_knowledge", {...});

if (!result.success) {
  // 处理错误
  console.error("添加知识失败:", result.error);
  return "抱歉，添加知识时出错了。";
}

// 继续处理
return "成功添加知识！";
```

---

### 3. 分类规范

**推荐**: 使用统一的分类体系

```typescript
// 用户偏好
{ category: "user", tags: ["preference", ...] }

// 项目信息
{ category: "project", tags: ["config", ...] }

// 环境信息
{ category: "environment", tags: ["system", ...] }

// 代码片段
{ category: "code", tags: ["snippet", ...] }

// 其他
{ category: "other", tags: [...] }
```

---

## 📚 相关文档

- [集成指南首页](./index.md) - 所有集成方式
- [Hermes AI 集成](./hermes-guide.md) - Hermes 特定集成
- [CLI 集成](./cli-integration.md) - 命令行集成
- [配置指南](../guides/configuration.md) - 详细配置
- [架构文档](../architecture/overview.md) - 系统架构

---

## 🤝 获取帮助

遇到问题？

1. **查看文档**: [docs/README.md](../README.md)
2. **提交 Issue**: [GitHub Issues](https://github.com/your-repo/issues)
3. **查看日志**: 检查 AI Agent 的日志输出

---

**版本**: 3.0.0
**最后更新**: 2026-04-24
**集成难度**: ⭐ (非常简单)
**功能完整度**: ⭐⭐⭐⭐⭐ (100%)
