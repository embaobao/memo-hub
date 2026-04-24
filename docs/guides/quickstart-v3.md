# 🚀 MemoHub v1 快速开始指南

## 📋 前置要求

- Node.js >= 22.0.0
- Bun >= 1.3.0
- Ollama 服务运行中

## 🔧 安装和配置

### 1. 启动 Ollama 服务
```bash
# 安装 Ollama (如果还没安装)
curl -fsSL https://ollama.com/install.sh | sh

# 启动服务
ollama serve

# 拉取嵌入模型 (新终端)
ollama pull nomic-embed-text-v2-moe
```

### 2. 安装 MemoHub v1
```bash
cd /path/to/memo-hub
bun install
bun run build
```

### 3. 配置文件
```bash
# 复制示例配置
cp config/config.example.yaml config/config.jsonc

# 根据需要修改配置
vim config/config.jsonc
```

## 📖 基本使用

### CLI 命令

#### 1. 添加知识
```bash
# 添加简单知识
memohub add "MemoHub v1 是基于 Text2Mem 协议的智能记忆管理系统" \
  -c project \
  -i 0.8 \
  -t "memohub,text2mem"

# 添加带标签的知识
memohub add "用户喜欢使用 TypeScript 进行开发" \
  -c user \
  -i 0.9 \
  -t "typescript,preference"
```

#### 2. 搜索知识
```bash
# 基本搜索
memohub search "TypeScript" -l 5

# 按分类搜索
memohub search "开发" -l 10 --category project
```

#### 3. 统一检索 (推荐)
```bash
# 使用检索流水线 (LightRAG 风格)
memohub search-all "Memohub 协议架构" \
  --limit 10 \
  --entity-expansion

# 不使用实体扩展
memohub search-all "代码重构" \
  --limit 5 \
  --no-entity-expansion
```

#### 4. 管理知识
```bash
# 列出所有分类
memohub list

# 按分类删除
memohub delete --category test

# 按ID删除
memohub delete --ids insight-xxx,insight-yyy
```

### 代码记忆

#### 1. 添加代码
```bash
# 添加代码文件
memohub add-code ./src/index.ts \
  -l typescript \
  -i 0.8

# 添加代码片段
echo 'function hello() { return "world"; }' | \
  memohub add-code /dev/stdin \
  -l javascript \
  -i 0.7
```

#### 2. 搜索代码
```bash
# 搜索代码
memohub search-code "interface Config" -l 5

# 按语言搜索
memohub search-code "async function" -l 10 --language typescript
```

## 🤖 MCP 服务器集成

### 启动 MCP 服务器
```bash
# 方式1: 直接启动 (用于测试)
memohub serve

# 方式2: 通过 stdio (用于 AI Agent)
# 在 AI Agent 的配置中添加：
{
  "command": "node",
  "args": ["/path/to/memohub/apps/cli/dist/index.js", "serve"],
  "env": {
    "EMBEDDING_URL": "http://localhost:11434/v1",
    "EMBEDDING_MODEL": "nomic-embed-text-v2-moe"
  }
}
```

### MCP 工具列表

**知识管理**:
- `add_knowledge`: 添加知识
- `query_knowledge`: 搜索知识
- `delete_knowledge`: 删除知识
- `get_stats`: 获取统计信息

**代码管理**:
- `add_code`: 添加代码
- `search_code`: 搜索代码

**统一工具**:
- `search_all`: 统一检索 (使用检索流水线)

## 🎯 高级功能

### 1. 检索流水线 (LightRAG 风格)
```bash
# 完整流水线检索
memohub search-all "查询内容" \
  --limit 10 \
  --entity-expansion \    # 启用实体扩展
  --lexical              # 启用词法通道
```

**流水线阶段**:
- **Pre**: 意图识别 + 实体抽取 + Token化
- **Exec**: 向量召回 + 词法通道 + 实体扩展
- **Post**: 融合去重 + 综合排序

### 2. 数据迁移
```bash
# 从 v2 迁移到 v1
# 首先备份
cp -r ~/.memohub ~/.memohub.backup

# Dry run 测试
bun run scripts/migrate-track-insight.ts --dry-run
bun run scripts/migrate-track-source.ts --dry-run

# 实际迁移
bun run scripts/migrate-track-insight.ts
bun run scripts/migrate-track-source.ts
```

### 3. 治理功能
```bash
# 去重扫描
memohub dedup --track track-insight --threshold 0.95

# 知识蒸馏
memohub distill --track track-insight

# 配置验证
memohub config --validate
```

## 📊 性能优化

### 推荐配置
```yaml
# config/config.jsonc
embedding:
  url: "http://localhost:11434/v1"
  model: "nomic-embed-text-v2-moe"
  dimensions: 768
  timeout: 30

track-insight:
  db_path: "~/.memohub/data/track-insight.lancedb"
  table_name: "track-insight"
  default_category: "other"
  default_importance: 0.5

track-source:
  db_path: "~/.memohub/data/track-source.lancedb"
  table_name: "track-source"
  default_language: "typescript"
  default_importance: 0.5
```

### 环境变量
```bash
# 覆盖配置文件
export EMBEDDING_URL="http://localhost:11434/v1"
export EMBEDDING_MODEL="nomic-embed-text-v2-moe"
export MEMOHUB_DB_PATH="~/.memohub/data/memohub.lancedb"
export MEMOHUB_CAS_PATH="~/.memohub/blobs"
```

## 🧪 测试验证

### 功能测试
```bash
# 添加测试数据
memohub add "测试知识1" -c test -i 0.8
memohub add "测试知识2" -c test -i 0.7

# 搜索测试
memohub search "测试" -l 5

# 列出测试
memohub list
```

### 检索流水线测试
```bash
# 添加不同类型的知识
memohub add "Text2Mem 协议定义了12个原子操作" -c protocol
memohub add "Bun 是一个快速的 JavaScript 运行时" -c javascript

# 统一检索
memohub search-all "协议和运行时" --limit 5
```

## 🐛 故障排除

### 常见问题

#### 1. Ollama 连接失败
```bash
# 检查 Ollama 是否运行
ps aux | grep ollama

# 启动 Ollama
ollama serve

# 测试连接
curl http://localhost:11434/v1/models
```

#### 2. 数据库错误
```bash
# 删除并重建数据库
rm -rf ~/.memohub
# 重新添加数据
```

#### 3. 构建错误
```bash
# 清理并重新构建
bun run clean
bun install
bun run build
```

## 📚 更多资源

- **完整文档**: [README.md](README.md)
- **配置指南**: [guides/configuration.md](guides/configuration.md)
- **开发指南**: [CLAUDE.md](CLAUDE.md)
- **测试报告**: [TEST_RESULTS.md](TEST_RESULTS.md)
- **项目总结**: [PROJECT_COMPLETION_SUMMARY.md](PROJECT_COMPLETION_SUMMARY.md)

## 🎉 开始使用

MemoHub v1 已经准备就绪！按照上述步骤，您就可以开始体验：

- 🧠 **智能知识管理**: 基于语义相似度的知识检索
- 💻 **代码记忆**: AST 分析的代码片段管理
- 🔍 **LightRAG 检索**: 三阶段智能检索流水线
- 🤖 **MCP 集成**: 无缝接入 AI Agent

祝您使用愉快！ 🚀
