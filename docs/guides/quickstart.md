# 快速开始指南

本指南将帮助你快速上手 MemoHub。

## 前置条件

### 1. 安装 Ollama

MemoHub 使用 Ollama 运行本地嵌入模型。

```bash
# macOS/Linux
curl -fsSL https://ollama.com/install.sh | sh

# Windows (使用 WSL)
wsl bash -c "curl -fsSL https://ollama.com/install.sh | sh"
```

### 2. 拉取嵌入模型

```bash
ollama pull nomic-embed-text-v2-moe
```

### 3. 启动 Ollama 服务

```bash
ollama serve
```

验证服务是否运行：

```bash
curl http://localhost:11434/api/tags
```

---

## 安装 MemoHub

### 从源码安装（推荐）

```bash
# 1. 克隆仓库
git clone https://github.com/your-username/memohub.git
cd memohub

# 2. 安装依赖
bun install

# 3. 构建项目
bun run build

# 4. 配置文件
cp config/config.example.yaml config/config.yaml

# 5. 测试安装
mh --help
```

### 全局安装

```bash
cd memohub
bun run build
npm install -g .

# 验证
mh --help
```

---

## 基础使用

### 1. 查看统计信息

```bash
mh stats
```

**输出示例**：
```
GBrain (通用知识):
  总记录数: 69
  数据库路径: ~/.memohub/gbrain.lancedb
  嵌入模型: nomic-embed-text-v2-moe
  向量维度: 768

ClawMem (代码记忆):
  总记录数: 833
  数据库路径: ~/.memohub/clawmem.lancedb
  嵌入模型: nomic-embed-text-v2-moe
  向量维度: 768
```

### 2. 添加知识

```bash
# 添加用户偏好
mh add-knowledge "用户喜欢 TypeScript 和 React 开发" \
  -c user \
  -i 0.9 \
  -t preference,typescript,react

# 添加环境信息
mh add-knowledge "项目使用 Node.js v22 和 Bun 运行时" \
  -c environment \
  -i 0.8 \
  -t system,nodejs,bun

# 添加项目信息
mh add-knowledge "项目是一个基于向量嵌入的双轨记忆系统" \
  -c project \
  -i 0.9 \
  -t project,memory,vector
```

### 3. 搜索知识

```bash
# 搜索用户偏好
mh search-knowledge "TypeScript" -l 3

# 搜索环境信息
mh search-knowledge "Node.js Bun" -l 3

# 搜索项目信息
mh search-knowledge "向量嵌入" -l 5
```

### 4. 添加代码片段

```bash
# 添加接口定义
mh add-code "interface User { name: string; age: number; }" \
  -f user.ts \
  -a interface \
  -s User \
  -l typescript \
  -i 0.8 \
  -t user,model

# 添加函数
mh add-code "async function search(query: string): Promise<Result[]>" \
  -f search.ts \
  -a function \
  -s search \
  -l typescript \
  -i 0.9 \
  -t search,async

# 添加类
mh add-code "class MemoryStore { constructor() {} add(data) {} }" \
  -f store.ts \
  -a class \
  -s MemoryStore \
  -l typescript \
  -i 0.9 \
  -t memory,store
```

### 5. 搜索代码

```bash
# 搜索接口
mh search-code "interface User" -l 3

# 搜索函数
mh search-code "async function search" -l 5

# 搜索类
mh search-code "class Memory" -l 3
```

---

## 配置文件

编辑 `config/config.yaml`：

```yaml
# 嵌入模型配置
embedding:
  url: "http://localhost:11434/v1"
  model: "nomic-embed-text-v2-moe"
  dimensions: 768
  timeout: 30

# CAS（内容寻址存储，可选）：用于“灵肉分离”
cas:
  root_path: "~/.hermes/data/memohub-cas"

# 写入路由配置（可选）
routing:
  enabled: true
  default_track: "gbrain"
  code_suffixes: [".ts", ".tsx", ".js", ".jsx", ".py", ".md"]

# 双轨数据库配置
gbrain:
  db_path: "~/.hermes/data/gbrain.lancedb"
  table_name: "gbrain"

clawmem:
  db_path: "~/.hermes/data/clawmem.lancedb"
  table_name: "clawmem"

# 同步配置（可选）
sync:
  editor_memory_paths:
    - "~/.claude-code/memory"
    - "~/.opencode/memory"
    - "~/.trae/memory"
  interval: 3600
  cloud:
    enabled: false
    provider: "github"
    repo: "your-username/memory-backup"
    branch: "main"
```

说明：
- 推荐直接复制示例配置：`cp config/config.example.yaml config/config.yaml`
- 配置优先级为：环境变量 > YAML > 默认值

## 进阶：2.0+ 能力快速体验

### 1) 带上下文写入（用于路由/审计）

```bash
mh add-knowledge "检索默认回填原文（Hydration）" -c memory -t architecture \
  --project memo-hub --session-id s-001 --source cli
```

### 2) 检索回填开关（Hydration）

```bash
# 默认开启（仅当索引 text 为空且存在 content_ref 时才会回填）
mh search-knowledge "Hydration" -l 5

# 关闭回填
mh search-knowledge "Hydration" -l 5 --no-hydrate
```

### 3) Git Hook 无感采集（post-commit）

```bash
mh hooks install
mh librarian ingest-git --commit HEAD --dry-run
```

---

## 与 Hermes 集成

如果你使用 Hermes，可以共享记忆数据：

```yaml
gbrain:
  dbPath: "~/.hermes/data/gbrain.lancedb"

clawmem:
  dbPath: "~/.hermes/data/clawmem.lancedb"
```

---

## 下一步

- [配置指南](configuration.md) - 深入了解配置选项
- [API 文档](../docs/api.md) - 查看 API 参考
- [插件开发](../docs/plugins.md) - 开发自定义插件
- [私有仓库同步](private-sync.md) - 设置私有仓库同步

---

## 常见问题

### Q: 如何检查 Ollama 是否运行？

```bash
curl http://localhost:11434/api/tags
```

### Q: 如何重置数据库？

```bash
rm -rf ~/.memohub/*.lancedb
```

### Q: 如何备份数据？

```bash
# 备份整个目录
cp -r ~/.memohub/ ~/.memohub-backup-$(date +%Y%m%d)/

# 或者创建 tar 归档
tar -czf memohub-backup-$(date +%Y%m%d).tar.gz ~/.memohub/
```

### Q: 如何验证配置？

```bash
mh config --validate
```

---

需要帮助？查看 [常见问题](../docs/faq.md) 或提交 [GitHub Issue](https://github.com/your-username/memohub/issues)。
