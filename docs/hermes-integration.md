# MemoHub 对接 Hermes 流程文档

## 📋 概述

本文档说明如何将现有的分散记忆系统（mcp-gbrain 和 mcp-clawmem）替换为统一的 MemoHub MCP 服务器，并与 Hermes 对接。

---

## 🔍 现状分析

### 现有配置

当前 Hermes 配置文件 `~/.hermes/config.yaml` 中有两个独立的 MCP 服务器：

```yaml
mcp_servers:
  gbrain:
    command: bun
    args:
      - run
      - /Users/embaobao/.hermes/data/memory-system/mcp-servers/mcp-gbrain/index.ts
    timeout: 30

  clawmem:
    command: bun
    args:
      - run
      - /Users/embaobao/.hermes/data/memory-system/mcp-servers/mcp-clawmem/index.ts
    timeout: 30
```

### 存在的问题

1. **配置复杂**：需要管理两个独立的 MCP 服务器
2. **资源占用**：两个进程同时运行
3. **维护困难**：需要分别更新两个服务器
4. **统一搜索困难**：无法一次搜索知识和代码

---

## 🎯 目标

将分散的 MCP 服务器替换为统一的 MemoHub MCP 服务器：

- ✅ 一个 MCP 服务器管理双轨记忆
- ✅ 统一的接口和配置
- ✅ 降低资源占用
- ✅ 支持统一搜索

---

## 📦 对接步骤

### 步骤 1：备份现有配置

```bash
# 创建备份目录
BACKUP_DIR="~/.hermes/data/memory-system/mcp-servers-backup-$(date +%Y%m%d)"

# 备份现有 MCP 服务器
mkdir -p "$BACKUP_DIR"

# 备份 mcp-gbrain
cp -r ~/.hermes/data/memory-system/mcp-servers/mcp-gbrain "$BACKUP_DIR/"

# 备份 mcp-clawmem
cp -r ~/.hermes/data/memory-system/mcp-servers/mcp-clawmem "$BACKUP_DIR/"

# 备份 Hermes 配置
cp ~/.hermes/config.yaml "$BACKUP_DIR/config.yaml.backup"

echo "✅ 备份完成: $BACKUP_DIR"
```

### 步骤 2：构建 MemoHub MCP 服务器

```bash
# 进入 MemoHub MCP 服务器目录
cd ~/workspace/memory-system-cli/mcp-server

# 安装依赖
bun install

# 构建项目
bun run build

# 验证构建
ls -la dist/
```

### 步骤 3：更新 Hermes 配置

编辑 `~/.hermes/config.yaml`：

**移除**：
```yaml
mcp_servers:
  gbrain:
    command: bun
    args:
      - run
      - /Users/embaobao/.hermes/data/memory-system/mcp-servers/mcp-gbrain/index.ts
    timeout: 30

  clawmem:
    command: bun
    args:
      - run
      - /Users/embaobao/.hermes/data/memory-system/mcp-servers/mcp-clawmem/index.ts
    timeout: 30
```

**添加**：
```yaml
mcp_servers:
  memohub:
    command: node
    args:
      - /Users/embaobao/workspace/memory-system-cli/mcp-server/dist/index.js
    env:
      GBRAIN_DB_PATH: ~/.hermes/data/gbrain.lancedb
      CLAWMEM_DB_PATH: ~/.hermes/data/clawmem.lancedb
      EMBEDDING_URL: http://localhost:11434/v1
      EMBEDDING_MODEL: nomic-embed-text-v2-moe
    timeout: 30
```

### 步骤 4：测试 MemoHub MCP 服务器

```bash
# 启动 MemoHub MCP 服务器
cd ~/workspace/memory-system-cli/mcp-server
bun run start

# 在另一个终端测试
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node dist/index.js 2>&1 | jq '.result.tools | length'

# 应该输出：9 (9 个工具)
```

### 步骤 5：重启 Hermes

```bash
# 停止 Hermes
hermes stop

# 启动 Hermes
hermes start

# 查看日志
hermes logs
```

### 步骤 6：验证工具可用性

在 Hermes 中测试：

```python
# 测试搜索知识
{
  "name": "query_knowledge",
  "arguments": {
    "query": "TypeScript",
    "limit": 3
  }
}

# 测试搜索代码
{
  "name": "search_code",
  "arguments": {
    "query": "interface User",
    "limit": 3
  }
}

# 测试统一搜索
{
  "name": "search_all",
  "arguments": {
    "query": "记忆系统",
    "limit": 5
  }
}

# 测试获取统计
{
  "name": "get_stats",
  "arguments": {}
}
```

---

## 🔧 配置详解

### MemoHub MCP 服务器配置

```yaml
mcp_servers:
  memohub:
    command: node                    # 使用 Node.js 运行
    args:
      - /Users/embaobao/workspace/memory-system-cli/mcp-server/dist/index.js
    env:                             # 环境变量
      GBRAIN_DB_PATH: ~/.hermes/data/gbrain.lancedb
      CLAWMEM_DB_PATH: ~/.hermes/data/clawmem.lancedb
      EMBEDDING_URL: http://localhost:11434/v1
      EMBEDDING_MODEL: nomic-embed-text-v2-moe
    timeout: 30                       # 超时时间（秒）
```

### 环境变量说明

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `GBRAIN_DB_PATH` | GBrain 数据库路径 | `~/.hermes/data/gbrain.lancedb` |
| `CLAWMEM_DB_PATH` | ClawMem 数据库路径 | `~/.hermes/data/clawmem.lancedb` |
| `EMBEDDING_URL` | Ollama 嵌入 API 地址 | `http://localhost:11434/v1` |
| `EMBEDDING_MODEL` | 嵌入模型名称 | `nomic-embed-text-v2-moe` |

---

## 📊 工具对照表

### 对比旧系统和新系统

| 旧系统工具 | 新系统工具 | 说明 |
|----------|----------|------|
| GBrain: query_knowledge | query_knowledge | 搜索知识（相同） |
| GBrain: add_knowledge | add_knowledge | 添加知识（相同） |
| GBrain: list_categories | list_categories | 列出分类（相同） |
| ClawMem: search_code | search_code | 搜索代码（相同） |
| ClawMem: add_code | add_code | 添加代码（相同） |
| ClawMem: list_symbols | list_symbols | 列出符号（相同） |
| - | delete_knowledge | 删除知识（新增） |
| - | get_stats | 获取统计（新增） |
| - | search_all | 统一搜索（新增） |

---

## ✅ 验证清单

### 功能验证

- [ ] MemoHub MCP 服务器成功启动
- [ ] GBrain 数据库连接成功（70 条记录）
- [ ] ClawMem 数据库连接成功（833 条记录）
- [ ] Hermes 成功识别 MemoHub MCP 工具
- [ ] 所有 9 个工具都可用

### 工具验证

- [ ] `query_knowledge` - 搜索知识
- [ ] `add_knowledge` - 添加知识
- [ ] `list_categories` - 列出分类
- [ ] `delete_knowledge` - 删除知识
- [ ] `search_code` - 搜索代码
- [ ] `add_code` - 添加代码
- [ ] `list_symbols` - 列出符号
- [ ] `get_stats` - 获取统计
- [ ] `search_all` - 统一搜索

### 性能验证

- [ ] 搜索响应时间 < 2 秒
- [ ] 添加响应时间 < 1 秒
- [ ] 统计信息获取 < 1 秒

---

## 🚨 故障排除

### 问题 1：MemoHub MCP 服务器启动失败

**症状**：Hermes 日志显示 MCP 服务器启动失败

**解决方案**：
```bash
# 检查 Ollama 服务
curl http://localhost:11434/api/tags

# 检查数据库路径
ls -la ~/.hermes/data/gbrain.lancedb
ls -la ~/.hermes/data/clawmem.lancedb

# 手动启动 MemoHub MCP 服务器
cd ~/workspace/memory-system-cli/mcp-server
bun run start

# 查看错误信息
```

### 问题 2：Hermes 无法识别 MemoHub 工具

**症状**：Hermes 中看不到 MemoHub 工具

**解决方案**：
```bash
# 检查 Hermes 配置
cat ~/.hermes/config.yaml | grep -A 10 mcp_servers

# 验证 MemoHub MCP 路径
ls -la /Users/embaobao/workspace/memory-system-cli/mcp-server/dist/index.js

# 重启 Hermes
hermes restart
```

### 问题 3：工具调用失败

**症状**：调用工具时返回错误

**解决方案**：
```bash
# 查看 Hermes 日志
hermes logs

# 检查数据库连接
cd ~/workspace/memory-system-cli/mcp-server
node -e "
import * as lancedb from '@lancedb/lancedb';
const db = await lancedb.connect('~/.hermes/data/gbrain.lancedb');
console.log('Connected!');
"

# 测试嵌入 API
curl -X POST http://localhost:11434/v1/embeddings \
  -H "Content-Type: application/json" \
  -d '{"model":"nomic-embed-text-v2-moe","input":"测试"}'
```

### 问题 4：回滚到旧系统

如果需要回滚到旧系统：

```bash
# 恢复备份
BACKUP_DIR="~/.hermes/data/memory-system/mcp-servers-backup-20260417"

# 恢复旧配置
cp "$BACKUP_DIR/config.yaml.backup" ~/.hermes/config.yaml

# 重启 Hermes
hermes restart
```

---

## 📈 优化建议

### 1. 嵌入模型优化

当前使用 `nomic-embed-text-v2-moe`，可以考虑：

```yaml
# 更快的模型（但可能精度略低）
EMBEDDING_MODEL: "all-minilm"

# 更准确的模型（但可能更慢）
EMBEDDING_MODEL: "nomic-embed-text-v1"
```

### 2. 数据库优化

```yaml
# 使用更快的存储介质
GBRAIN_DB_PATH: /fast-ssd/gbrain.lancedb
CLAWMEM_DB_PATH: /fast-ssd/clawmem.lancedb
```

### 3. 缓存优化

在 MemoHub MCP 服务器中添加结果缓存（未来功能）

---

## 🎯 迁移总结

### 迁移前

- 2 个独立的 MCP 服务器
- 6 个工具
- 需要分别配置和管理
- 无法统一搜索

### 迁移后

- 1 个统一的 MCP 服务器
- 9 个工具
- 统一配置和管理
- 支持统一搜索

### 优势

- ✅ 配置简化（从 2 个服务器到 1 个）
- ✅ 资源优化（从 2 个进程到 1 个）
- ✅ 维护简单（统一更新）
- ✅ 功能增强（新增 3 个工具）

---

## 📞 支持

如果遇到问题：

1. 查看 [MemoHub README](~/workspace/memory-system-cli/README.md)
2. 查看 [MCP Server README](~/workspace/memory-system-cli/mcp-server/README.md)
3. 查看 Hermes 日志
4. 联系维护者

---

## 📝 更新日志

### 2026-04-17
- ✅ 创建 MemoHub MCP 服务器
- ✅ 生成对接流程文档
- ✅ 备份现有 MCP 服务器
- ✅ 准备迁移配置

---

**文档版本**: 1.0.0
**最后更新**: 2026-04-17
**维护者**: 盟哥
