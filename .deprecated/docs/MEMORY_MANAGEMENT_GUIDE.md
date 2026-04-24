# MemoHub 记忆管理增强功能使用指南

**日期**: 2026-04-20
**版本**: v1.1.0

---

## 📋 新增功能总览

### 1. 记忆总结
**命令**: `mh summarize-knowledge`

功能：
- 自动总结指定分类或关键词的相关记忆
- 提取关键点
- 统计重要性分布
- 支持语义搜索和分类过滤

### 2. 关键知识萃取
**命令**: `mh extract-knowledge`

功能：
- 从大量记忆中萃取最重要的高质量信息
- 自动去重（可选）
- 按重要性排序
- 解释每条知识的重要性原因

### 3. 记忆列表（改进版）
**命令**: `mh list-knowledge`

改进：
- 按重要性降序排序（最重要的在前面）
- 文本自动截断（避免显示过长）
- 显示 ID、来源、标签等元数据
- 支持分类和数量过滤

### 4. 代码列表（改进版）
**命令**: `mh list-code`

改进：
- 按重要性降序排序
- 支持语言和 AST 类型过滤
- 显示符号名、文件路径等元数据

### 5. 删除知识
**命令**: `mh delete-knowledge <ids>`

功能：
- 按指定 ID 删除知识
- 支持批量删除（逗号分隔）

### 6. 按分类清理知识
**命令**: `mh clean-knowledge <category>`

功能：
- 删除指定分类的所有知识
- 支持预览（dry-run）
- 交互式确认

---

## 🚀 使用示例

### 1. 查看所有用户相关记忆（按重要性排序）

```bash
mh list-knowledge -c user -l 10
```

输出示例：
```
[1] user 重要性: 0.90
ID: gbrain-1776429063742-jfn13r
--------------------------------------------------------------------------------
用户喜欢 TypeScript 和 React 开发，偏好使用 VSCode 编辑器
来源: cli

[2] user 重要性: 0.90
ID: gbrain-1776419499506-9t9rek
--------------------------------------------------------------------------------
盟哥的用户偏好：喜欢被问候，喜欢通过企微和飞书接收通知
来源: mcp-gbrain
```

---

### 2. 总结用户相关记忆

需要先配置 OpenAI API 密钥：
```bash
export OPENAI_API_KEY="sk-xxx"
export OPENAI_BASE_URL="https://api.openai.com/v1"
```

然后执行：
```bash
mh summarize-knowledge -c user
```

输出示例：
```
📊 记忆总结
================================================================================

统计信息:
  总记录数: 4
  高重要性 (≥0.8): 3
  中等重要性 (0.6-0.8): 1
  低重要性 (<0.6): 0

总结:
用户盟哥的偏好包括喜欢 TypeScript 和 React 开发，偏好使用 VSCode 编辑器，并且喜欢被问候。他通过企业微信和飞书接收通知，工作产物默认保存在目标仓库中。

关键点:
  1. 名字是盟哥，喜欢被问候
  2. 偏好 TypeScript 和 React 开发
  3. 使用 VSCode 编辑器
  4. 通过企微和飞书接收通知
  5. 工作产物保存在目标仓库
```

---

### 3. 萃取项目相关的关键知识

```bash
mh extract-knowledge -c project -n 5 --min-importance 0.8
```

输出示例：
```
💎 关键知识萃取
================================================================================

萃取统计:
  处理记录数: 15
  去重删除数: 3
  萃取结果数: 5

萃取结果:
================================================================================

[1] project 重要性: 0.95
--------------------------------------------------------------------------------
MemoHub 双轨记忆系统发布完成
原因: 项目发布的重要里程碑

[2] project 重要性: 0.90
--------------------------------------------------------------------------------
MemoHub 是我的双轨记忆中心 CLI 工具
原因: 重要的系统配置

...
```

---

### 4. 清理无意义的临时消息

先预览要删除的记录：
```bash
mh clean-knowledge other --dry-run
```

确认后执行删除（需要交互式确认）：
```bash
mh clean-knowledge other
```

或者直接按 ID 删除：
```bash
mh delete-knowledge id1,id2,id3
```

---

### 5. 搜索后查看结构化列表

搜索 + 列表结合使用：
```bash
# 先搜索
mh search-knowledge "TypeScript" -l 10

# 然后列表查看（按重要性排序）
mh list-knowledge -c user -l 10
```

---

## 🔧 配置说明

### 总结和萃取模式

**模式 1: 使用 OpenAI API（推荐）**

如果配置了 OpenAI API，总结和萃取功能会自动完成。

```bash
export OPENAI_API_KEY="sk-xxx"
export OPENAI_BASE_URL="https://api.openai.com/v1"
export OPENAI_MODEL="gpt-4o-mini"
```

**模式 2: 使用 Hermes Agent（无需 API）**

如果没有配置 OpenAI API，CLI 会输出结构化的任务指令，指导 Hermes Agent 使用现有的 MCP 工具（`mcp_memohub_query_knowledge` 和 `mcp_memohub_add_knowledge`）完成总结和萃取。

示例输出：
```
📋 Hermes Agent 任务指令
================================================================================

未配置 OpenAI API，请使用以下 MCP 工具完成总结：

步骤 1: 查询知识
  调用 mcp_memohub_query_knowledge 查询知识
  参数: {
    "category": "user",
    "limit": 50
  }

步骤 2: 总结知识
  使用返回的记录，生成总结：
  - 统计高/中/低重要性记录数量
  - 生成整体总结（100-200 字）
  - 提取 3-5 个关键点

步骤 3: 保存总结
  调用 mcp_memohub_add_knowledge 保存总结
  参数: {
    "text": "生成的总结文本",
    "category": "user",
    "importance": 0.9,
    "tags": ["summary", "auto-generated"]
  }
```

Hermes Agent 可以按照这些步骤完成总结和萃取，无需配置 OpenAI API。

### OpenAI API 配置（用于总结和萃取）

```bash
# 方法 1：临时配置（当前会话）
export OPENAI_API_KEY="sk-xxx"
export OPENAI_BASE_URL="https://api.openai.com/v1"
export OPENAI_MODEL="gpt-4o-mini"

# 方法 2：永久配置（添加到 ~/.bashrc 或 ~/.zshrc）
echo 'export OPENAI_API_KEY="sk-xxx"' >> ~/.bashrc
echo 'export OPENAI_BASE_URL="https://api.openai.com/v1"' >> ~/.bashrc
echo 'export OPENAI_MODEL="gpt-4o-mini"' >> ~/.bashrc
source ~/.bashrc
```

**推荐模型**：
- `gpt-4o-mini`：速度快，成本低，适合总结和萃取
- `gpt-4o`：质量高，适合复杂的知识整理

---

## 🎯 使用场景

### 场景 1：定期清理记忆

每周执行一次：
```bash
# 1. 查看 all 分类
mh list-knowledge -c other -l 20

# 2. 清理无意义记录
mh delete-knowledge id1,id2,id3

# 3. 总结用户偏好
mh summarize-knowledge -c user

# 4. 萃取项目关键信息
mh extract-knowledge -c project -n 10
```

---

### 场景 2：开始新任务前回顾

```bash
# 1. 总结用户偏好
mh summarize-knowledge -c user

# 2. 萃取项目关键信息
mh extract-knowledge -c project -n 5

# 3. 查看环境配置
mh list-knowledge -c environment -l 5
```

---

### 场景 3：记忆整理和优化

```bash
# 1. 查看所有记录，找出问题
mh list-knowledge -l 30

# 2. 清理临时消息
mh clean-knowledge other

# 3. 总结关键分类
mh summarize-knowledge -c user
mh summarize-knowledge -c project
mh summarize-knowledge -c environment

# 4. 萃取高价值知识
mh extract-knowledge -n 15 --min-importance 0.8
```

---

## 📊 命令对照表

| 命令 | 功能 | 关键选项 |
|------|------|----------|
| `mh list-knowledge` | 列出知识（按重要性排序） | `-c <category>`, `-l <limit>` |
| `mh list-code` | 列出代码（按重要性排序） | `-l <language>`, `-a <ast-type>`, `-l <limit>` |
| `mh summarize-knowledge` | 总结知识 | `-c <category>`, `-q <query>`, `--include-low` |
| `mh extract-knowledge` | 萃取关键知识 | `-c <category>`, `-q <query>`, `-n <n>`, `--min-importance <n>` |
| `mh delete-knowledge` | 删除知识 | `<ids>` (逗号分隔) |
| `mh delete-code` | 删除代码 | `<ids>` (逗号分隔) |
| `mh clean-knowledge` | 按分类清理 | `<category>`, `--dry-run` |

---

## 💡 最佳实践

### 1. 定期清理

建议每周执行一次：
- 查看 `other` 分类，删除临时消息
- 检查低重要性记录（< 0.5）
- 合并重复内容

### 2. 保持结构

- 使用明确的分类（user, project, environment 等）
- 为重要信息设置高重要性（≥ 0.8）
- 使用标签增强检索（typescript, react, config 等）

### 3. 定期总结

- 每月总结一次用户偏好
- 每周总结项目进展
- 萃取高价值知识（重要性 ≥ 0.8）

### 4. 质量控制

- 删除临时消息和测试数据
- 合并相似的内容
- 提高重要信息的重要性评分

---

## ❓ 常见问题

### Q1: 总结功能提示缺少 API 密钥怎么办？

**A**: 需要配置 OpenAI API 密钥：
```bash
export OPENAI_API_KEY="sk-xxx"
export OPENAI_BASE_URL="https://api.openai.com/v1"
```

### Q2: 如何找到需要删除的记录 ID？

**A**: 使用 list 命令查看：
```bash
mh list-knowledge -c other -l 50
```
每条记录都会显示 ID。

### Q3: 删除错了怎么办？

**A**: 目前不支持撤销删除。建议：
- 使用 `--dry-run` 先预览
- 删除前仔细确认
- 定期备份数据库

### Q4: 总结和萃取有什么区别？

**A**:
- **总结（summarize）**：生成整体概述和关键点
- **萃取（extract）**：挑选最重要的单条记录

### Q5: 如何避免记忆混乱？

**A**:
- 使用明确的分类
- 设置适当的重要性
- 定期清理和整理
- 避免存储临时信息

---

## 🎉 总结

现在你可以：

1. ✅ **删除记忆**：清理无意义的临时消息
2. ✅ **列表改进**：按重要性排序，文本自动截断
3. ✅ **记忆总结**：自动总结和提取关键点
4. ✅ **知识萃取**：从大量记忆中提炼高价值信息

**关键改进**：
- 不再是一大段混乱的文字
- 结构化显示，易于浏览
- 支持删除和清理
- 智能总结和萃取

---

**文档版本**: 1.0
**最后更新**: 2026-04-20
