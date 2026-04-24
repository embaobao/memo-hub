# 自动记忆提取使用指南

## 📖 概述

MemoHub 现在支持自动从 Hermes 会话中提取重要信息并保存到记忆系统（GBrain 和 ClawMem）。

## 🚀 快速开始

### 1. 手动提取单个会话

使用最简单的方式，直接从会话文件中提取知识：

```bash
~/workspace/ai/memo-hub/scripts/extract-from-session.sh <session-file.json>
```

**示例**：
```bash
extract-from-session.sh ~/path/to/session-20240420.json
```

**输出**：
```
🤖 开始处理会话...
  文件: ~/path/to/session-20240420.json
  大小: 45K

[INFO] 分析 Session...
[INFO] Session 分析完成，提取 3 项重要信息
[INFO] 保存 3 项到记忆系统...
[INFO] 成功保存到 GBrain: gbrain-1713571234567-abc123
[INFO] 成功保存到 ClawMem: clawmem-1713571234568-def456
✔ 成功保存 3 项到记忆系统

✅ 记忆提取完成

记忆系统统计:
GBrain (通用知识):
  总记录数: 41
  ...
```

---

### 2. 添加会话到自动提取队列

将需要提取的会话添加到队列，定时任务会自动处理：

```bash
~/workspace/ai/memo-hub/scripts/queue-for-extraction.sh <session-file.json>
```

**示例**：
```bash
queue-for-extraction.sh ~/path/to/session-1.json
queue-for-extraction.sh ~/path/to/session-2.json
queue-for-extraction.sh ~/path/to/session-3.json
```

**查看队列**：
```bash
cat ~/.hermes/.extract-pending
```

**清空队列**：
```bash
rm ~/.hermes/.extract-pending
```

---

### 3. 设置定时自动提取

#### 方法一：使用系统 cron（推荐）

1. 编辑 crontab：
```bash
crontab -e
```

2. 添加以下行：
```bash
# 每天 21:00 自动提取记忆
0 21 * * * /Users/embaobao/workspace/ai/memo-hub/scripts/system-cron-extract.sh >> ~/.hermes/logs/cron-extract.log 2>&1
```

3. 保存并退出

#### 方法二：测试定时任务

手动运行一次定时任务，查看日志：
```bash
~/workspace/ai/memo-hub/scripts/system-cron-extract.sh
```

查看日志：
```bash
tail -f ~/.hermes/logs/cron-extract.log
```

---

## 📊 查看记忆系统

### 查看统计信息
```bash
mh stats
```

### 搜索知识
```bash
mh search-knowledge "TypeScript" -l 5
```

### 搜索代码
```bash
mh search-code "interface Config" -l 3
```

---

## 🔧 高级用法

### 批量提取会话

1. 将多个会话文件添加到队列：
```bash
for file in ~/sessions/*.json; do
    queue-for-extraction.sh "$file"
done
```

2. 手动触发批量提取：
```bash
~/workspace/ai/memo-hub/scripts/system-cron-extract.sh
```

### 查看提取历史

查看提取日志：
```bash
tail -100 ~/.hermes/logs/auto-extract-memory.log
```

查看定时任务日志：
```bash
tail -100 ~/.hermes/logs/cron-extract.log
```

### 查看最近更新的会话

```bash
~/workspace/ai/memo-hub/scripts/auto-extract-memory.sh recent 60
```

这将显示最近 60 分钟内修改的会话文件。

---

## 🎯 使用场景

### 场景 1：完成重要任务后立即提取

```bash
# 1. 完成 Hermes 任务后，找到会话文件
ls -lt ~/.hermes/data/sessions/*.json | head -5

# 2. 立即提取最新会话
extract-from-session.sh ~/.hermes/data/sessions/session-latest.json
```

### 场景 2：批量处理历史会话

```bash
# 1. 找到所有历史会话
find ~/hermes-sessions -name "*.json" -type f

# 2. 添加到队列
for file in ~/hermes-sessions/*.json; do
    queue-for-extraction.sh "$file"
done

# 3. 触发自动提取
~/workspace/ai/memo-hub/scripts/system-cron-extract.sh
```

### 场景 3：定期自动提取（设置一次，永久生效）

```bash
# 1. 设置 cron
crontab -e

# 2. 添加定时任务
0 21 * * * /Users/embaobao/workspace/ai/memo-hub/scripts/system-cron-extract.sh >> ~/.hermes/logs/cron-extract.log 2>&1

# 3. 保存后，每天 21:00 自动执行
```

---

## ⚙️ 配置说明

### 环境变量

可以通过环境变量配置提取器行为：

```bash
# OpenAI API 配置
export OPENAI_API_KEY="sk-xxx"
export OPENAI_BASE_URL="https://api.openai.com/v1"
export OPENAI_MODEL="gpt-4o-mini"

# 记忆系统配置
export GBRAIN_DB_PATH="~/.hermes/data/gbrain.lancedb"
export CLAWMEM_DB_PATH="~/.hermes/data/clawmem.lancedb"

# 日志配置
export EXTRACTOR_LOG_PATH="~/.hermes/logs/auto-extract-memory.log"
export TRACKING_PATH="~/.hermes/data/memory-updates"
```

### 提取规则

提取器会根据以下规则判断是否保存信息：

- **重要性 >= 0.6**：只提取重要信息
- **去重机制**：避免重复提取相同内容
- **智能分类**：
  - 用户偏好 → `user` 分类
  - 项目信息 → `project` 分类
  - 技术细节 → `knowledge` 或 `code` 类型
  - 配置信息 → `config` 分类

---

## 🐛 故障排查

### 问题 1：提取失败，提示 "记忆系统初始化失败"

**解决方案**：
1. 检查 Ollama 服务是否运行：
```bash
ollama serve
# 或在另一个终端中：ollama list
```

2. 检查数据库路径是否正确：
```bash
ls -la ~/.hermes/data/
```

3. 手动测试记忆系统：
```bash
mh stats
```

---

### 问题 2：OpenAI API 调用失败

**解决方案**：
1. 检查 API 密钥是否配置：
```bash
echo $OPENAI_API_KEY
```

2. 如果未配置，添加到 `~/.bashrc` 或 `~/.zshrc`：
```bash
export OPENAI_API_KEY="sk-xxx"
export OPENAI_BASE_URL="https://api.openai.com/v1"
```

3. 重新加载配置：
```bash
source ~/.bashrc
# 或
source ~/.zshrc
```

---

### 问题 3：没有提取到任何信息

**可能原因**：
1. 会话内容不包含重要信息（重要性 < 0.6）
2. OpenAI API 返回的提取结果为空

**解决方案**：
1. 查看详细日志：
```bash
tail -100 ~/.hermes/logs/auto-extract-memory.log
```

2. 手动分析会话内容，确认是否有值得保存的信息

3. 调整提取提示词，修改提取规则

---

## 📝 最佳实践

### 1. 定期提取

建议每天提取一次最近的会话，避免积累太多未提取的内容。

### 2. 优先提取重要任务

完成重要任务后立即提取，确保关键信息不会丢失。

### 3. 定期查看统计

定期查看记忆系统统计，了解记忆增长情况：
```bash
mh stats
```

### 4. 清理重复信息

定期检查并清理重复或过时的记忆记录：
```bash
mh search-knowledge "关键词" -l 10
```

---

## 🎉 总结

现在你有了三种方式来自动提取记忆：

1. **手动提取**：立即处理单个会话
2. **队列提取**：批量处理多个会话
3. **定时提取**：设置一次，每天自动执行

**推荐工作流**：
- 日常任务：使用队列 + 定时提取
- 重要任务：使用手动立即提取
- 批量处理：使用队列 + 手动触发

这样你就不需要手动提醒了，系统会自动记住重要信息！

---

**文档版本**: 1.0
**最后更新**: 2026-04-20
