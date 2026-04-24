# 🚀 MemoHub + Hermes 快速开始

## 3 步完成集成 (3 分钟)

### 步骤 1: 构建项目 (1 分钟)

```bash
cd /Users/embaobao/workspace/ai/memo-hub
bun install
bun run build
```

### 步骤 2: 配置 Hermes (1 分钟)

编辑 `~/.hermes/config.yaml`，添加：

```yaml
mcpServers:
  memohub:
    command: node
    args:
      - /Users/embaobao/workspace/ai/memo-hub/apps/cli/dist/index.js
      - serve
    env:
      EMBEDDING_URL: http://localhost:11434/v1
      EMBEDDING_MODEL: nomic-embed-text-v2-moe
    timeout: 60
```

### 步骤 3: 重启并验证 (1 分钟)

```bash
# 启动 Ollama
ollama serve

# 重启 Hermes
hermes restart

# 在 Hermes 中测试
# 请说：请使用 get_stats 工具查看 MemoHub 的统计信息
```

✅ 完成！

---

## 🛠️ 可用的 7 个工具

### 知识管理
- `query_knowledge` - 搜索知识
- `add_knowledge` - 添加知识
- `list_categories` - 列出分类
- `delete_knowledge` - 删除知识

### 代码管理
- `search_code` - 搜索代码
- `add_code` - 添加代码

### 统计
- `get_stats` - 获取统计信息

---

## 💡 快速示例

### 在 Hermes 中说：

**搜索知识**：
```
请搜索关于 "monorepo 架构" 的知识
```

**添加知识**：
```
请添加知识：MemoHub v1 使用 Bun Workspace Monorepo 架构，包含 apps/、packages/、tracks/ 三个主要目录
```

**搜索代码**：
```
请搜索包含 "interface Config" 的代码片段
```

---

## 📚 详细文档

- **完整集成指南**: [HERMES_INTEGRATION_GUIDE.md](HERMES_INTEGRATION_GUIDE.md)
- **项目文档**: [README.md](README.md)
- **开发指南**: [CLAUDE.md](CLAUDE.md)

---

## 🚨 遇到问题？

### Hermes 看不到工具

```bash
# 检查构建
ls -la apps/cli/dist/index.js

# 重新构建
bun run --filter @memohub/cli build

# 重启 Hermes
hermes restart
```

### Ollama 连接失败

```bash
# 启动 Ollama
ollama serve

# 下载模型
ollama pull nomic-embed-text-v2-moe

# 验证服务
curl http://localhost:11434/v1/models
```

---

**版本**: 3.0.0 | **状态**: ✅ 生产就绪
