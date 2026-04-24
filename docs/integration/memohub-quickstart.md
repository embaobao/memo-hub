# MemoHub v1 快速集成指南

**5分钟集成到 Hermes**

---

## 🚀 快速开始

### 前置条件检查

```bash
# 检查 Node.js
node --version  # 应该 >= 22.0.0

# 检查 Bun
bun --version  # 应该 >= 1.3.0

# 检查 Ollama
ollama list  # 应该包含 nomic-embed-text-v2-moe
```

如果缺少任何依赖，请先安装：
```bash
# 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 Bun
curl -fsSL https://bun.sh/install | bash

# 安装 Ollama
curl -fsSL https://ollama.com/install.sh | sh
ollama pull nomic-embed-text-v2-moe
```

### 一键安装

```bash
# 1. 克隆项目
git clone https://github.com/embaobao/memo-hub.git
cd memo-hub

# 2. 安装并构建
bun install && bun run build

# 3. 配置 Hermes (自动配置)
# 编辑 ~/.hermes/config.yaml，添加以下内容：
```

```yaml
mcp_servers:
  memohub:
    command: node
    args:
      - /absolute/path/to/memo-hub/apps/cli/dist/index.js
      - serve
    env:
      MEMOHUB_DB_PATH: ~/.hermes/data/memohub.lancedb
      MEMOHUB_CAS_PATH: ~/.hermes/data/memohub-cas
      EMBEDDING_URL: http://localhost:11434/v1
      EMBEDDING_MODEL: nomic-embed-text-v2-moe
    timeout: 60
```

```bash
# 4. 重启 Hermes
hermes restart

# 5. 验证安装
# 在 Hermes 中运行:
# mcp_memohub_get_stats()
```

---

## 🧪 验证安装

### 基础测试

在 Hermes 对话中测试:

```javascript
// 1. 检查系统状态
mcp_memohub_get_stats()
// 预期: {"tracks": ["track-insight", "track-source", "track-librarian"], ...}

// 2. 添加测试知识
mcp_memohub_add_knowledge(
  text="这是一条测试记录",
  category="test",
  importance=0.5
)
// 预期: {"success": true, "id": "insight-..."}

// 3. 检索知识
mcp_memohub_query_knowledge(
  query="测试记录",
  limit=3
)
// 预期: 返回刚才添加的记录
```

### 故障排除

**问题1**: MCP 服务器无法启动
```bash
# 检查 Ollama 服务
curl http://localhost:11434/v1/models

# 如果失败，启动 Ollama
ollama serve
```

**问题2**: 构建失败
```bash
# 清理并重新安装
rm -rf node_modules apps/*/dist packages/*/dist tracks/*/dist
bun install
bun run build
```

**问题3**: 检索无结果
```bash
# 检查数据库
ls -la ~/.hermes/data/memohub.lancedb/

# 重新添加数据
mcp_memohub_add_knowledge(...)
```

---

## 📚 核心功能

### 1. 知识存储

```javascript
// 添加知识
mcp_memohub_add_knowledge(
  text="重要决策：使用 MemoHub 作为记忆系统",
  category="decision",
  importance=0.9,
  tags=["memo", "system", "decision"]
)
```

### 2. 知识检索

```javascript
// 语义检索
mcp_memohub_query_knowledge(
  query="决策相关的记忆",
  limit=5
)
```

### 3. 代码管理

```javascript
// 添加代码
mcp_memohub_add_code(
  code="const hello = () => 'world';",
  language="javascript",
  file_path="src/example.js"
)

// 搜索代码
mcp_memohub_search_code(
  query="hello world function"
)
```

### 4. 分类管理

```javascript
// 查看分类统计
mcp_memohub_list_categories()

// 删除知识
mcp_memohub_delete_knowledge(
  ids=["insight-xxx", "insight-yyy"]
)
```

---

## 🔧 高级配置

### 自定义数据路径

```yaml
mcp_servers:
  memohub:
    env:
      MEMOHUB_DB_PATH: /custom/path/to/database.lancedb
      MEMOHUB_CAS_PATH: /custom/path/to/cas-storage
```

### 自定义嵌入模型

```yaml
mcp_servers:
  memohub:
    env:
      EMBEDDING_URL: http://your-embedding-service/v1
      EMBEDDING_MODEL: your-model-name
```

### 性能调优

```yaml
mcp_servers:
  memohub:
    timeout: 120  # 增加超时时间
```

---

## 📊 数据管理

### 备份数据

```bash
# 备份数据库
cp -r ~/.hermes/data/memohub.lancedb ~/backup/memohub-db-$(date +%Y%m%d)

# 备份 CAS 存储
cp -r ~/.hermes/data/memohub-cas ~/backup/memohub-cas-$(date +%Y%m%d)
```

### 清理数据

```javascript
// 查看所有分类
mcp_memohub_list_categories()

// 删除特定分类的数据
// (需要手动操作数据库)
```

---

## 🎓 最佳实践

### 1. 知识分类

```javascript
// 使用清晰的分类
mcp_memohub_add_knowledge(
  text="...",
  category="decision|config|debug|document|...",
  importance=0.9
)
```

### 2. 重要性标记

```javascript
// 重要性范围: 0.1 ~ 1.0
// 0.1-0.3: 临时信息
// 0.4-0.6: 常规记录
// 0.7-0.9: 重要决策
// 1.0: 核心知识
```

### 3. 标签使用

```javascript
// 使用标签增强检索
mcp_memohub_add_knowledge(
  text="...",
  tags=["memo", "system", "config", "debug"]
)
```

---

## 🆘 获取帮助

### 日志查看

```bash
# 查看 Hermes MCP 日志
hermes logs | grep memohub
```

### 诊断工具

```javascript
// 系统状态
mcp_memohub_get_stats()

// 分类统计
mcp_memohub_list_categories()

// 检索测试
mcp_memohub_query_knowledge({query: "test", limit: 1})
```

---

## 📖 更多文档

- **完整文档**: `/Users/embaobao/workspace/ai/memo-hub/docs/README.md`
- **架构说明**: `docs/architecture/overview.md`
- **协议文档**: `docs/architecture/text2mem-protocol.md`
- **集成详情**: `docs/integration/memohub-v1-integration-complete.md`

---

## ✅ 检查清单

安装完成后，请确认:

- [ ] Hermes 配置文件包含 MemoHub MCP 配置
- [ ] Ollama 服务运行正常
- [ ] `mcp_memohub_get_stats()` 返回正常结果
- [ ] 成功添加至少一条测试记录
- [ ] 成功检索到添加的记录
- [ ] 理解核心功能的使用方法

---

**快速集成版本**: 1.0.0  
**最后更新**: 2026-04-24  
**维护者**: MemoHub Team
