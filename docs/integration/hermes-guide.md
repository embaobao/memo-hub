# MemoHub v1 - Hermes AI Agent 集成完整指南

## 📋 目录

- [快速开始](#快速开始)
- [系统架构](#系统架构)
- [配置步骤](#配置步骤)
- [功能验证](#功能验证)
- [使用示例](#使用示例)
- [故障排除](#故障排除)
- [API 参考](#api-参考)

---

## 🚀 快速开始

### 3 步完成集成

1. **构建 MemoHub v1**
   ```bash
   cd /Users/embaobao/workspace/ai/memo-hub
   bun install
   bun run build
   ```

2. **配置 Hermes**
   编辑 `~/.hermes/config.jsonc`，添加以下配置：
   ```yaml
   mcpServers:
     memohub:
       command: node
       args:
         - /Users/embaobao/workspace/ai/memo-hub/apps/cli/dist/index.js
         - serve
       env:
         MEMOHUB_DB_PATH: ~/.hermes/data/memohub.lancedb
         MEMOHUB_CAS_PATH: ~/.hermes/data/memohub-cas
         EMBEDDING_URL: http://localhost:11434/v1
         EMBEDDING_MODEL: nomic-embed-text-v2-moe
       timeout: 60
   ```

3. **重启 Hermes**
   ```bash
   hermes restart
   ```

✅ 完成！Hermes 现在可以使用 MemoHub 的所有功能。

---

## 🏗️ 系统架构

### Monorepo 架构

MemoHub v1 采用 **Bun Workspace Monorepo** 架构：

```
memohub/
├── apps/
│   └── cli/              # CLI 入口 + MCP Server
│       ├── src/
│       │   ├── index.ts  # CLI 主入口
│       │   └── mcp.ts    # MCP 服务器实现
│       └── dist/
│           └── index.js  # 编译产物 ⭐
├── packages/             # 核心包
│   ├── protocol/         # Text2Mem 协议
│   ├── core/             # MemoryKernel
│   ├── ai-provider/      # AI 适配器
│   ├── storage-flesh/    # CAS 存储
│   ├── storage-soul/     # 向量存储
│   └── librarian/        # 检索流水线
├── tracks/               # 轨道实现
│   ├── track-insight/    # 知识轨道
│   ├── track-source/     # 代码轨道
│   └── track-stream/     # 流轨道
└── .deprecated/          # 已弃用的代码
    └── v2-src/           # 旧的 v2 代码
```

### Text2Mem 协议

MemoHub v1 基于 **Text2Mem 协议**，提供 12 个原子操作：

- **ADD** - 添加记录
- **RETRIEVE** - 检索记录
- **UPDATE** - 更新记录
- **DELETE** - 删除记录
- **MERGE** - 合并记录
- **CLARIFY** - 澄清记录
- **LIST** - 列出记录
- **EXPORT** - 导出记录
- **DISTILL** - 蒸馏知识
- **ANCHOR** - 锚定记录
- **DIFF** - 差异比较
- **SYNC** - 同步记录

### 双轨记忆架构

- **track-insight** - 知识/事实记忆
- **track-source** - 代码/AST 记忆

---

## 🔧 配置步骤

### 步骤 1: 环境准备

#### 1.1 安装依赖

```bash
# 进入项目目录
cd /Users/embaobao/workspace/ai/memo-hub

# 安装 Bun (如果还没安装)
curl -fsSL https://bun.sh/install | bash

# 安装项目依赖
bun install
```

#### 1.2 构建 CLI

```bash
# 构建所有 workspace 包
bun run build

# 验证构建产物
ls -la apps/cli/dist/index.js
```

#### 1.3 启动 Ollama

```bash
# 启动 Ollama 服务
ollama serve

# 下载嵌入模型
ollama pull nomic-embed-text-v2-moe

# 验证服务
curl http://localhost:11434/v1/models
```

### 步骤 2: Hermes 配置

#### 2.1 编辑 Hermes 配置文件

```bash
# 编辑 Hermes 配置
vim ~/.hermes/config.jsonc
```

#### 2.2 添加 MemoHub MCP 服务器

在 `mcpServers` 部分添加：

```yaml
mcpServers:
  memohub:
    command: node
    args:
      - /Users/embaobao/workspace/ai/memo-hub/apps/cli/dist/index.js
      - serve
    env:
      # 数据库配置
      MEMOHUB_DB_PATH: ~/.hermes/data/memohub.lancedb
      MEMOHUB_CAS_PATH: ~/.hermes/data/memohub-cas
      
      # 嵌入服务配置
      EMBEDDING_URL: http://localhost:11434/v1
      EMBEDDING_MODEL: nomic-embed-text-v2-moe
      
      # 可选: 调试模式
      # NODE_ENV: development
    timeout: 60
```

### 步骤 3: 重启 Hermes

```bash
# 停止 Hermes
hermes stop

# 启动 Hermes
hermes start

# 查看日志
hermes logs
```

---

## ✅ 功能验证

### 方法 1: 在 Hermes 中测试

在 Hermes 对话中输入：

```
请使用 get_stats 工具查看 MemoHub 的数据库统计信息
```

### 方法 2: 命令行测试

```bash
# 测试 MCP 服务器
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | \
  node /Users/embaobao/workspace/ai/memo-hub/apps/cli/dist/index.js serve 2>&1 | \
  jq '.result.tools[] | {name, description}'
```

### 方法 3: 直接使用 CLI

```bash
# 查看帮助
memohub help

# 测试 MCP 服务器
memohub serve
```

### 预期结果

如果配置成功，你应该看到 **7 个工具**：

1. `query_knowledge` - 搜索知识
2. `add_knowledge` - 添加知识
3. `search_code` - 搜索代码
4. `add_code` - 添加代码
5. `list_categories` - 列出分类
6. `delete_knowledge` - 删除知识
7. `get_stats` - 获取统计

---

## 💡 使用示例

### 知识管理示例

#### 示例 1: 添加知识

**在 Hermes 中说**：
```
请添加一条知识：MemoHub v1 基于 Text2Mem 协议实现双轨记忆管理，包含 track-insight (知识轨道) 和 track-source (代码轨道)
```

**工具调用**：
```json
{
  "name": "add_knowledge",
  "arguments": {
    "text": "MemoHub v1 基于 Text2Mem 协议实现双轨记忆管理，包含 track-insight (知识轨道) 和 track-source (代码轨道)",
    "category": "architecture",
    "importance": 0.9,
    "tags": ["memohub", "text2mem", "architecture"]
  }
}
```

#### 示例 2: 搜索知识

**在 Hermes 中说**：
```
请搜索关于 "Text2Mem 协议" 的知识，返回 3 条最相关的结果
```

**工具调用**：
```json
{
  "name": "query_knowledge",
  "arguments": {
    "query": "Text2Mem 协议",
    "limit": 3
  }
}
```

#### 示例 3: 查看分类统计

**在 Hermes 中说**：
```
请显示当前所有知识分类及其数量统计
```

**工具调用**：
```json
{
  "name": "list_categories",
  "arguments": {}
}
```

### 代码管理示例

#### 示例 4: 添加代码

**在 Hermes 中说**：
```
请添加以下代码片段到代码库：
interface Config {
  name: string;
  version: string;
}
这是 TypeScript 配置接口定义
```

**工具调用**：
```json
{
  "name": "add_code",
  "arguments": {
    "code": "interface Config {\n  name: string;\n  version: string;\n}",
    "language": "typescript",
    "file_path": "src/config.ts"
  }
}
```

#### 示例 5: 搜索代码

**在 Hermes 中说**：
```
请搜索包含 "interface Config" 的代码片段
```

**工具调用**：
```json
{
  "name": "search_code",
  "arguments": {
    "query": "interface Config",
    "limit": 5
  }
}
```

### 组合使用示例

#### 示例 6: 知识工作流

**在 Hermes 中说**：
```
请执行以下操作：
1. 搜索关于 "monorepo" 的知识
2. 如果找到相关知识，总结给我
3. 如果没有找到，添加一条新知识：MemoHub v1 使用 Bun Workspace Monorepo 架构
```

---

## 📊 环境变量说明

| 变量 | 说明 | 默认值 | 必需 |
|------|------|--------|------|
| `MEMOHUB_DB_PATH` | 统一向量数据库路径 | `~/.hermes/data/memohub.lancedb` | 否 |
| `MEMOHUB_CAS_PATH` | CAS 内容寻址存储路径 | `~/.hermes/data/memohub-cas` | 否 |
| `EMBEDDING_URL` | Ollama 嵌入 API 地址 | `http://localhost:11434/v1` | 否 |
| `EMBEDDING_MODEL` | 嵌入模型名称 | `nomic-embed-text-v2-moe` | 否 |
| `NODE_ENV` | Node.js 环境 | `production` | 否 |

### 高级配置

#### 使用不同的嵌入模型

```yaml
env:
  # 更快的模型 (降低精度)
  EMBEDDING_MODEL: "all-minilm"
  
  # 更准确的模型 (降低速度)
  # EMBEDDING_MODEL: "nomic-embed-text-v1.5"
  
  # 多语言支持
  # EMBEDDING_MODEL: "bge-m3"
```

#### 使用不同的数据库路径

```yaml
env:
  # 使用快速 SSD
  MEMOHUB_DB_PATH: /fast-ssd/memohub.lancedb
  
  # 使用自定义路径
  MEMOHUB_CAS_PATH: /custom/path/memohub-cas
```

---

## 🚨 故障排除

### 问题 1: Hermes 无法识别工具

**症状**：Hermes 中看不到 MemoHub 工具

**诊断步骤**：
```bash
# 1. 检查 CLI 文件是否存在
ls -la /Users/embaobao/workspace/ai/memo-hub/apps/cli/dist/index.js

# 2. 测试 MCP 服务器
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | \
  node /Users/embaobao/workspace/ai/memo-hub/apps/cli/dist/index.js serve 2>&1

# 3. 检查 Hermes 配置
cat ~/.hermes/config.jsonc | grep -A 10 "memohub"
```

**解决方案**：
- 确保 CLI 已构建：`bun run --filter @memohub/cli build`
- 确保 Hermes 配置路径正确
- 重启 Hermes：`hermes restart`

### 问题 2: 工具调用返回错误

**症状**：调用工具时返回错误或空结果

**诊断步骤**：
```bash
# 1. 查看 Hermes 日志
hermes logs | tail -50

# 2. 检查数据库路径
ls -la ~/.hermes/data/memohub.lancedb
ls -la ~/.hermes/data/memohub-cas

# 3. 检查 Ollama 服务
curl http://localhost:11434/v1/models
```

**解决方案**：
- 确保 Ollama 服务正在运行：`ollama serve`
- 确保嵌入模型已下载：`ollama pull nomic-embed-text-v2-moe`
- 创建数据库目录：`mkdir -p ~/.hermes/data`

### 问题 3: Ollama 连接失败

**症状**：`Error: connect ECONNREFUSED`

**解决方案**：
```bash
# 启动 Ollama
ollama serve

# 验证服务
curl http://localhost:11434/v1/models

# 下载模型
ollama pull nomic-embed-text-v2-moe
```

### 问题 4: 类型错误或编译错误

**症状**：构建失败或类型错误

**解决方案**：
```bash
# 清理并重新构建
rm -rf apps/cli/dist/
bun run --filter @memohub/cli build

# 检查依赖
bun install

# 验证 TypeScript
bun run --filter @memohub/cli test
```

### 问题 5: 权限错误

**症状**：`Error: EACCES`

**解决方案**：
```bash
# 确保文件可执行
chmod +x apps/cli/dist/index.js

# 确保数据库目录可写
chmod 755 ~/.hermes/data
```

---

## 📚 API 参考

### 知识管理工具

#### query_knowledge

搜索知识 (语义相似度)

**参数**：
- `query` (string, 必需) - 搜索查询文本
- `limit` (number, 可选) - 最大结果数，默认 5

**示例**：
```json
{
  "name": "query_knowledge",
  "arguments": {
    "query": "TypeScript 开发",
    "limit": 3
  }
}
```

#### add_knowledge

添加知识记录

**参数**：
- `text` (string, 必需) - 知识文本
- `category` (string, 可选) - 知识分类
- `importance` (number, 可选) - 重要性 (0.0-1.0)
- `tags` (array, 可选) - 标签数组

**示例**：
```json
{
  "name": "add_knowledge",
  "arguments": {
    "text": "MemoHub v1 基于 Text2Mem 协议",
    "category": "architecture",
    "importance": 0.9,
    "tags": ["memohub", "text2mem"]
  }
}
```

#### list_categories

列出所有知识分类及统计

**参数**：无

**示例**：
```json
{
  "name": "list_categories",
  "arguments": {}
}
```

#### delete_knowledge

删除知识记录

**参数**：
- `ids` (array, 可选) - 记录 ID 数组
- `category` (string, 可选) - 删除整个分类

**示例**：
```json
{
  "name": "delete_knowledge",
  "arguments": {
    "category": "test"
  }
}
```

### 代码管理工具

#### search_code

搜索代码 (语义相似度)

**参数**：
- `query` (string, 必需) - 搜索查询文本
- `limit` (number, 可选) - 最大结果数，默认 5

**示例**：
```json
{
  "name": "search_code",
  "arguments": {
    "query": "interface Config",
    "limit": 5
  }
}
```

#### add_code

添加代码记录

**参数**：
- `code` (string, 必需) - 代码内容
- `language` (string, 可选) - 编程语言
- `file_path` (string, 可选) - 文件路径

**示例**：
```json
{
  "name": "add_code",
  "arguments": {
    "code": "interface Config { name: string; }",
    "language": "typescript",
    "file_path": "src/config.ts"
  }
}
```

### 统计工具

#### get_stats

获取数据库统计信息

**参数**：无

**示例**：
```json
{
  "name": "get_stats",
  "arguments": {}
}
```

---

## 🎯 最佳实践

### 1. 知识组织

- **使用有意义的分类**：`architecture`, `development`, `deployment` 等
- **设置合适的重要性**：核心知识 0.8-1.0，普通知识 0.5-0.7
- **添加相关标签**：便于后续检索和组织

### 2. 代码管理

- **提供文件路径**：帮助理解代码上下文
- **指定正确的语言**：影响代码解析和检索
- **添加注释代码**：包含文档说明的代码片段

### 3. 性能优化

- **限制返回数量**：一般查询使用 3-5 条结果
- **使用具体的查询**：避免过于宽泛的搜索词
- **定期清理**：删除过时或错误的知识

### 4. 错误处理

- **检查返回结果**：验证 `success` 字段
- **处理错误信息**：查看 `error` 字段获取详情
- **重试机制**：网络错误时适当重试

---

## 📈 性能指标

### 预期性能

| 操作 | 预期时间 | 说明 |
|------|----------|------|
| 添加知识 | < 50ms | 不包含嵌入生成时间 |
| 搜索知识 | < 100ms | 向量搜索时间 |
| 搜索代码 | < 100ms | 向量搜索时间 |
| 获取统计 | < 50ms | 数据库查询时间 |

### 优化建议

1. **使用本地 Ollama**：避免网络延迟
2. **选择合适的模型**：平衡速度和精度
3. **限制结果数量**：减少数据处理时间
4. **使用 SSD 存储**：提升数据库性能

---

## 🔗 相关资源

### 官方文档

- **主文档**: [README.md](README.md)
- **开发指南**: [CLAUDE.md](CLAUDE.md)
- **快速开始**: [guides/quickstart.md](guides/quickstart.md)
- **配置指南**: [guides/configuration.md](guides/configuration.md)

### CLI 命令

```bash
# 查看所有命令
memohub help

# 查看版本
memohub --version

# 测试配置
memohub config --validate

# 启动 MCP 服务器
memohub serve
```

### 开发命令

```bash
# 构建所有包
bun run build

# 测试所有包
bun run test

# 开发模式
bun run dev

# 代码检查
bun run lint
```

---

## 🎉 总结

MemoHub v1 为 Hermes AI Agent 提供了强大的双轨记忆管理能力：

- ✅ **统一协议**：Text2Mem 协议提供标准化接口
- ✅ **双轨架构**：知识 + 代码，满足不同需求
- ✅ **Monorepo 设计**：模块化、可维护、可扩展
- ✅ **完整工具集**：7 个 MCP 工具覆盖所有功能
- ✅ **高性能**：向量搜索 + CAS 存储，快速响应

配置完成后，Hermes 就能够：
1. 记住你的知识和代码
2. 快速检索相关信息
3. 提供智能建议和总结
4. 辅助代码开发和学习

开始使用 MemoHub，让 AI 拥有持久记忆能力！🚀

---

**版本**: 3.0.0
**最后更新**: 2026-04-24
**维护者**: 盟哥
**状态**: ✅ 生产就绪 (Production Ready)