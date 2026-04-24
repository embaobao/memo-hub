# MemoHub v3 项目清理计划

## 📋 当前状态分析

### Monorepo 架构 (正确)
- ✅ `apps/` - 应用入口 (92K)
- ✅ `packages/` - 核心包 (620K)  
- ✅ `tracks/` - 轨道实现 (96K)

### 需要清理的内容
- ❌ `src/` - 旧的 v2 代码 (812K) - **需要删除**
- ❌ `mcp-server.deprecated/` - 已弃用的 MCP 服务器 - **需要删除**
- ❌ `plugins/` - 独立插件，不兼容 monorepo - **需要归档**
- ❌ `dist/` - 混合的编译产物 - **需要清理重建**

### 需要归档的文档
- 📁 各种总结文档 (PROJECT_COMPLETION_SUMMARY.md 等)
- 📁 旧的指南文档 (QUICKSTART_CN.md 等)

---

## 🎯 清理步骤

### 步骤 1: 删除 src/ 目录 (旧的 v2 代码)
```bash
# 检查是否有重要的未迁移代码
# 然后删除
rm -rf src/
```

### 步骤 2: 删除弃用的 MCP 服务器
```bash
rm -rf mcp-server.deprecated/
```

### 步骤 3: 归档 plugins/ 目录
```bash
# 创建归档目录
mkdir -p .deprecated/
mv plugins/ .deprecated/
```

### 步骤 4: 清理并重建 dist/ 目录
```bash
rm -rf dist/
bun run build
```

### 步骤 5: 归档旧文档
```bash
mkdir -p .deprecated/docs
mv *_SUMMARY.md *_GUIDE.md *_CHECKLIST.md *_REPORT.md .deprecated/docs/ 2>/dev/null || true
```

---

## 📊 清理后的预期结构

```
memohub/
├── apps/              # ✅ 应用入口
│   └── cli/          # CLI + MCP Server
├── packages/          # ✅ 核心包
│   ├── protocol/
│   ├── core/
│   ├── storage-*/
│   ├── ai-provider/
│   └── librarian/
├── tracks/            # ✅ 轨道实现
│   ├── track-insight/
│   ├── track-source/
│   └── track-stream/
├── docs/              # ✅ 文档
├── guides/            # ✅ 指南
├── .deprecated/       # ✅ 归档的旧代码
├── config/            # ✅ 配置文件
└── dist/              # ✅ 统一的编译产物
```

---

## 🚀 执行清理

此脚本将安全地执行所有清理步骤。
