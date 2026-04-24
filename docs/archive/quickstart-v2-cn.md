# MemoHub 快速入门

欢迎来到 MemoHub - 你的双轨记忆中心！

## 🚀 5 分钟快速开始

### 1. 安装 MemoHub

```bash
# 克隆或下载项目
cd ~/workspace/memory-system-cli

# 运行安装脚本
./install.sh

# 验证安装
mh --help
```

### 2. 查看当前状态

```bash
# 查看数据库统计
mh stats

# 验证集成状态
./scripts/verify-integration.sh
```

### 3. 添加第一条知识

```bash
# 添加用户偏好
mh add-knowledge "我偏好 TypeScript 和 React 开发，使用 VSCode 编辑器" -c user -i 0.9

# 添加工作环境
mh add-knowledge "工作环境：macOS, Node.js v22.22.2, Bun 运行时" -c environment
```

### 4. 搜索知识

```bash
# 搜索知识
mh search-knowledge "TypeScript" -l 5

# 搜索环境信息
mh search-knowledge "macOS" -l 3
```

### 5. 添加代码片段

```bash
# 添加接口定义
mh add-code "interface MemoryConfig { embedding: EmbeddingConfig; gbrain: GBrainConfig; }" \
  -f src/types/index.ts \
  -s MemoryConfig \
  -a interface

# 添加函数定义
mh add-code "async function getEmbedding(text: string): Promise<number[]>" \
  -f src/core/embedder.ts \
  -s getEmbedding \
  -a function
```

### 6. 搜索代码

```bash
# 搜索代码
mh search-code "MemoryConfig interface" -l 5

# 搜索函数
mh search-code "embedding function" -l 3
```

## 🎯 常用命令

```bash
# 统计信息
mh stats

# 添加知识
mh add-knowledge "知识内容" -c 分类 -i 重要性

# 搜索知识
mh search-knowledge "搜索词" -l 结果数

# 添加代码
mh add-code "代码" -f 文件路径 -s 符号名 -a 符号类型

# 搜索代码
mh search-code "搜索词" -l 结果数

# 验证配置
mh config --validate
```

## 🤝 在 Hermes 中使用

MemoHub 已集成到 Hermes 中，提供 9 个 MCP 工具：

### 查询知识
```
使用 query_knowledge 工具搜索通用知识
参数:
  - query (必需): 搜索查询
  - limit (可选): 最大结果数，默认 5
  - category (可选): 按分类过滤
```

### 添加知识
```
使用 add_knowledge 工具添加通用知识
参数:
  - text (必需): 知识文本
  - category (可选): 分类，默认 "other"
  - importance (可选): 重要性 0-1，默认 0.5
  - tags (可选): 标签数组
```

### 搜索代码
```
使用 search_code 工具搜索代码片段
参数:
  - query (必需): 自然语言描述
  - limit (可选): 最大结果数，默认 5
  - language (可选): 按语言过滤
  - ast_type (可选): 按 AST 类型过滤
```

### 添加代码
```
使用 add_code 工具添加代码片段
参数:
  - text (必需): 代码文本
  - file_path (可选): 文件路径
  - symbol_name (可选): 符号名称
  - ast_type (可选): AST 类型，默认 "unknown"
  - language (可选): 语言，默认 "typescript"
  - importance (可选): 重要性 0-1，默认 0.5
  - tags (可选): 标签数组
```

### 统一搜索
```
使用 search_all 工具同时搜索知识和代码
参数:
  - query (必需): 搜索查询
  - limit (可选): 每条轨道的最大结果数，默认 5
```

### 其他工具
```
- list_categories: 列出所有知识分类
- delete_knowledge: 删除知识记录
- list_symbols: 列出所有代码符号
- get_stats: 获取数据库统计
```

## 📊 当前数据

```
GBrain:  70 条记录（通用知识）
ClawMem: 833 条记录（代码记忆）
总计:    903 条记录
```

## 📚 更多资源

- **完整文档**: [README.md](README.md)
- **架构概述**: [OVERVIEW.md](OVERVIEW.md)
- **配置指南**: [guides/configuration.md](guides/configuration.md)
- **Hermes 集成**: [guides/hermes-integration.md](guides/hermes-integration.md)
- **API 文档**: [docs/api.md](docs/api.md)
- **常见问题**: [docs/faq.md](docs/faq.md)

## 🔧 故障排除

### 问题: "command not found: mh"
解决:
```bash
# 检查安装
ls -la /usr/local/bin/mh

# 重新安装
./install.sh
```

### 问题: "Ollama 服务不可用"
解决:
```bash
# 启动 Ollama
ollama serve

# 验证服务
curl http://localhost:11434/api/tags
```

### 问题: "嵌入模型未找到"
解决:
```bash
# 下载模型
ollama pull nomic-embed-text-v2-moe

# 验证模型
ollama list
```

### 问题: "Hermes 配置未更新"
解决:
```bash
# 运行迁移脚本
./scripts/migrate-to-memohub.sh

# 重启 Hermes
hermes restart
hermes logs
```

### 问题: "需要回滚"
解决:
```bash
# 运行回滚脚本
./scripts/rollback-from-memohub.sh ~/.hermes/data/memory-system/mcp-servers-backup-20260417

# 重启 Hermes
hermes restart
```

## 🎉 开始使用

现在你已经准备好使用 MemoHub 了！

1. **独立使用**: 使用 `mh` CLI 命令管理记忆
2. **Hermes 集成**: 在 Hermes 中使用 MemoHub MCP 工具
3. **验证状态**: 定期运行 `./scripts/verify-integration.sh`

祝使用愉快！ 🚀

---

**文档版本**: 1.0.0
**最后更新**: 2026-04-17
