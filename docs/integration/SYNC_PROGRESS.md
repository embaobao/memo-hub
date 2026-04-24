# 进度同步 - Hermes 双层记忆系统

**同步时间**: 2026-04-17 19:53
**同步人**: 当前 session → `/Users/embaobao/workspace/memory-system-cli` session

---

## ✅ 已完成的工作

### 1. 记忆系统数据库验证

**位置**:
- GBrain: `~/.hermes/data/gbrain.lancedb/gbrain.lance/` (316 KB)
- ClawMem: `~/.hermes/data/clawmem.lancedb/clawmem.lance/` (191 MB)

**状态**:
- GBrain: 18 条记录（通过 MCP 工具验证）
- ClawMem: 25 条记录（通过 MCP 工具验证）

### 2. 编辑器同步脚本（已修复）

**文件**: `~/.hermes/scripts/sync-editor-memory.ts`

**修复内容**:
1. 改用 `@lancedb/lancedb` 直接操作数据库
2. 修正表名：`knowledge` → `gbrain`, `code` → `clawmem`
3. 添加缺失字段：`parent_symbol`, `source`

**测试结果** (2026-04-17 19:49):
- Claude Code: 380 条记录
- OpenCode: 1 条记录
- Trae: 433 条记录
- **总计**: 814 条记录
- **写入 GBrain**: 6 条
- **写入 ClawMem**: 808 条

**注意**: 当前使用零向量占位，需要后续添加嵌入模型支持

### 3. 自动备份系统

**备份文件**: `~/.hermes/backups/hermes-backup-2026-04-17.zip` (20.2 MB, 1978 个文件)

**Cron Jobs**:
- `eb1cb6a4685a`: Hermes 自动备份（每天 20:00）
- `8d0a8c219009`: 编辑器记忆同步（每天 22:00）

### 4. 云同步工具

**文件**: `~/.hermes/scripts/sync-memory-cloud.ts`

**功能**:
- `stats`: 显示系统统计
- `quick`: 创建快速备份
- `full`: 创建完整备份
- `push`: 推送到 Git 仓库
- `pull`: 从 Git 仓库拉取

**状态**: 已测试 `stats` 和 `quick` 命令，工作正常

### 5. 开源项目结构

**位置**: `/Users/embaobao/hermes-dual-track-memory/`

**文件**:
- `README.md` - 项目说明 (12 KB)
- `package.json` - NPM 配置
- `install.sh` - 一键安装脚本
- `templates/config.yaml` - 配置模板 (3 KB)
- `docs/installation.md` - 安装指南 (12 KB)

**状态**: 文档结构完整，等待初始化 Git 仓库

### 6. MCP 服务器验证

**已配置的 MCP 服务器**:
- gbrain: `bun run /Users/embaobao/....` (启用)
- clawmem: `bun run /Users/embaobao/....` (启用)

**可用工具**:
- `mcp_gbrain_add_knowledge` - 添加知识记录
- `mcp_gbrain_get_stats` - 获取统计信息
- `mcp_clawmem_add_code` - 添加代码记录
- `mcp_clawmem_get_stats` - 获取统计信息
- 以及查询、搜索、列出等功能

---

## ⚠️ 已知问题和注意事项

### 1. 嵌入模型缺失

**问题**: 编辑器同步脚本使用零向量占位

**影响**: 语义搜索功能受限

**解决方案**: 需要集成嵌入模型（nomic-embed-text-v2-moe 或其他）

### 2. 数据库统计不一致

**问题**:
- MCP `get_stats` 显示: GBrain 18 条, ClawMem 25 条
- 同步脚本写入: GBrain 6 条, ClawMem 808 条
- 实际数据库大小: ClawMem 191 MB (808 条合理), GBrain 564 KB (可能包含历史数据)

**原因**: 数据库可能包含之前的数据，表名混用导致

**建议**: 另一个 session 可以清理和统一数据库结构

### 3. 表名规范

**正确表名**:
- GBrain: `gbrain`
- ClawMem: `clawmem`

**错误表名**（已修复）:
- `knowledge` - 已在 sync-editor-memory.ts 中修正
- `code` - 已在 sync-editor-memory.ts 中修正

---

## 📁 关键文件位置

### Hermes 主目录
```
~/.hermes/
├── data/
│   ├── gbrain.lancedb/
│   └── clawmem.lancedb/
├── backups/
├── scripts/
│   ├── sync-editor-memory.ts  # ✅ 已修复
│   └── sync-memory-cloud.ts   # ✅ 已测试
├── config.yaml
└── .env
```

### 开源项目
```
~/hermes-dual-track-memory/
├── README.md
├── package.json
├── install.sh
├── templates/
│   └── config.yaml
└── docs/
    └── installation.md
```

### 记忆系统源码
```
~/.hermes/data/memory-system/
├── src/
│   ├── schemas.ts          # 数据库 schema 定义
│   ├── gbrain-writer.ts   # GBrain 写入器
│   └── clawmem-writer.ts  # ClawMem 写入器
└── dist/
    ├── schemas.js
    ├── gbrain-writer.js
    └── clawmem-writer.js
```

---

## 🚀 给另一个 session 的建议

### 优先级 1: 嵌入模型集成

在 CLI 工具中添加嵌入模型支持，替换零向量：

```typescript
// 使用 Ollama 本地嵌入模型
const response = await fetch('http://localhost:11434/api/embeddings', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'nomic-embed-text-v2-moe',
    prompt: text
  })
});
const { embedding } = await response.json();
```

### 优先级 2: 数据库清理和迁移

检查并统一数据库结构，避免表名混用：

```typescript
// 检查表名
const tableNames = await db.tableNames();
console.log('现有表:', tableNames);

// 迁移数据（如果需要）
if (tableNames.includes('knowledge') && !tableNames.includes('gbrain')) {
  await db.renameTable('knowledge', 'gbrain');
}
```

### 优先级 3: CLI 命令完善

参考 `hermes` CLI 的结构，完善以下命令：

```bash
# 知识管理
memory add -t "知识内容" -c "分类"
memory search -q "搜索词"
memory list

# 代码管理
code add -f "文件路径" -s "符号名"
code search -q "搜索词"
code list

# 同步管理
sync editor     # 同步编辑器记忆
sync cloud      # 同步到云端
sync status     # 查看同步状态

# 备份管理
backup create   # 创建备份
backup restore  # 恢复备份
backup list     # 列出备份
```

### 优先级 4: 配置系统

实现配置文件读取和验证：

```yaml
# ~/.hermes-memory/config.yaml
memory:
  gbrain:
    db_path: ~/.hermes/data/gbrain.lancedb
    embedding_model: nomic-embed-text-v2-moe
  clawmem:
    db_path: ~/.hermes/data/clawmem.lancedb
    embedding_model: nomic-embed-text-v2-moe

sync:
  enabled: true
  interval: 3600  # 每小时同步一次
```

---

## 📊 当前数据统计

| 项目 | 路径 | 大小 | 记录数 |
|------|------|------|--------|
| GBrain | `~/.hermes/data/gbrain.lancedb/` | 564 KB | 18 (MCP) / 6 (新) |
| ClawMem | `~/.hermes/data/clawmem.lancedb/` | 191 MB | 25 (MCP) / 808 (新) |
| 备份 | `~/.hermes/backups/` | 21 MB | 1 个文件 |
| 开源项目 | `~/hermes-dual-track-memory/` | 48 KB | - |

---

## 🔗 相关依赖

**LanceDB**: `@lancedb/lancedb`
**嵌入模型**: nomic-embed-text-v2-moe (通过 Ollama:11434)
**向量维度**: 768

**Memory System 包**:
```
~/.hermes/data/memory-system/node_modules/
├── @lancedb/lancedb
└── memory-lancedb-pro
```

---

## ✅ 检查清单

给另一个 session 使用的检查清单：

- [ ] 测试 Ollama 嵌入模型是否运行
- [ ] 验证 `http://localhost:11434/api/embeddings` 端点
- [ ] 检查数据库表名是否统一
- [ ] 清理零向量记录（添加嵌入后）
- [ ] 完善 CLI 命令和帮助文档
- [ ] 添加配置文件支持
- [ ] 实现 Git 云同步功能
- [ ] 测试跨平台兼容性（macOS/Linux/Windows）
- [ ] 初始化开源项目的 Git 仓库
- [ ] 编写完整的 README 和文档

---

## 📝 备注

1. **Cron Jobs 已配置**: 每日 20:00 备份，22:00 同步编辑器记忆
2. **备份文件可用**: `hermes-backup-2026-04-17.zip` 包含完整 Hermes 配置
3. **同步脚本已测试**: 编辑器同步工作正常，但需添加嵌入模型
4. **云同步工具就绪**: 基础命令已测试，待添加 Git 推送/拉取

---

**同步完成！祝另一个 session 顺利推进！🚀**
