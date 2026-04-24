# 常见问题 (FAQ)

本文档收集了 MemoHub 的常见问题和解决方案。

---

## 安装和配置

### Q: 如何检查 Node.js 版本？

```bash
node --version
# 需要 >= 22.0.0
```

### Q: 如何检查 Bun 版本？

```bash
bun --version
# 需要 >= 1.3.0
```

### Q: 如何检查 Ollama 是否运行？

```bash
curl http://localhost:11434/api/tags
```

如果看到 JSON 响应，说明 Ollama 正在运行。

### Q: Ollama 服务启动失败？

**A**: 检查端口是否被占用：

```bash
# macOS/Linux
lsof -i :11434

# 杀死占用端口的进程
kill -9 <PID>
```

### Q: 如何切换到不同的嵌入模型？

**A**: 修改 `config/config.jsonc`：

```yaml
embedding:
  model: "nomic-embed-text-v1"  # 或其他模型
  dimension: 768  # 根据模型调整
```

然后重新初始化数据库：

```bash
rm -rf ~/.memohub/*.lancedb
```

### Q: 配置文件位置在哪里？

**A**:
- 配置文件：`config/config.jsonc`
- 示例配置：`config/config.example.yaml`

---

## 数据库

### Q: 数据库文件在哪里？

**A**: 默认位置：
- GBrain: `~/.memohub/track-insight.lancedb`
- ClawMem: `~/.memohub/track-source.lancedb`

### Q: 如何备份数据库？

**A**:
```bash
# 备份整个目录
cp -r ~/.memohub/ ~/.memohub-backup-$(date +%Y%m%d)/

# 或创建 tar 归档
tar -czf memohub-backup-$(date +%Y%m%d).tar.gz ~/.memohub/
```

### Q: 如何恢复数据库？

**A**:
```bash
# 从备份恢复
cp -r ~/.memohub-backup-YYYYMMDD/* ~/.memohub/

# 或从 tar 归档恢复
tar -xzf memohub-backup-YYYYMMDD.tar.gz -C ~/
```

### Q: 如何重置数据库？

**A**:
```bash
rm -rf ~/.memohub/*.lancedb
```

**警告**: 这会删除所有数据！

### Q: 数据库损坏怎么办？

**A**:
1. 尝试从备份恢复
2. 使用私有仓库同步恢复
3. 重新初始化数据库（会丢失所有数据）

```bash
rm -rf ~/.memohub/*.lancedb
mh stats  # 会自动创建新数据库
```

---

## 搜索功能

### Q: 搜索结果不相关？

**A**: 检查以下几点：
1. 确认嵌入模型正确
2. 确认搜索查询清晰
3. 尝试增加返回结果数量
4. 检查知识内容是否完整

```bash
mh search-knowledge "TypeScript" -l 10
```

### Q: 搜索速度慢？

**A**:
1. 确认 Ollama 服务正常运行
2. 检查数据库大小
3. 考虑使用更小的嵌入模型
4. 清理不需要的记录

### Q: 如何搜索特定分类的知识？

**A**: 使用 `-c` 选项：

```bash
mh search-knowledge "TypeScript" -c user -l 5
```

### Q: 如何搜索特定类型的代码？

**A**: 使用 `-a` 选项：

```bash
mh search-code "User" -a interface -l 5
mh search-code "search" -a function -l 5
```

---

## CLI 使用

### Q: 命令行帮助在哪里？

**A**:
```bash
mh --help
```

### Q: 如何查看当前配置？

**A**:
```bash
mh config --show
```

### Q: 如何验证配置是否有效？

**A**:
```bash
mh config --validate
```

### Q: 如何批量删除知识？

**A**:
```bash
mh delete-knowledge id1,id2,id3
```

### Q: 命令行颜色显示不正常？

**A**: 检查终端是否支持颜色：
```bash
echo $TERM
```

---

## 性能优化

### Q: 如何提高搜索速度？

**A**:
1. 使用更快的嵌入模型
2. 减少数据库大小
3. 增加系统内存
4. 使用 SSD 存储

### Q: 数据库太大怎么办？

**A**:
1. 删除不需要的记录
2. 定期备份和归档
3. 使用增量同步
4. 考虑使用分片

### Q: 如何减少内存使用？

**A**:
1. 使用更小的嵌入模型
2. 限制搜索返回数量
3. 定期清理缓存
4. 调整数据库配置

---

## 与其他系统集成

### Q: 如何与 Hermes 集成？

**A**: 修改配置文件使用 Hermes 数据库路径：

```yaml
track-insight:
  dbPath: "~/.hermes/data/track-insight.lancedb"

track-source:
  dbPath: "~/.hermes/data/track-source.lancedb"
```

### Q: 如何与 AI 智能体集成？

**A**: 使用 TypeScript API：

```typescript
import { GBrain, ClawMem, Embedder } from 'memohub';

const track-insight = new GBrain(config.track-insight, embedder);
await track-insight.initialize();

// 搜索相关知识
const results = await track-insight.search('用户偏好', 3);
```

### Q: 如何导出数据？

**A**:
```bash
# 导出为 JSON
mh search-knowledge "" -l 1000 > knowledge.json
```

### Q: 如何导入数据？

**A**: 使用 API 批量添加：

```typescript
import { readFileSync } from 'fs';
import { GBrain } from 'memohub';

const data = JSON.parse(readFileSync('knowledge.json', 'utf-8'));

for (const item of data) {
  await track-insight.add(item);
}
```

---

## 私有仓库同步

### Q: 如何设置私有仓库同步？

**A**: 查看 [私有仓库同步指南](../guides/private-sync.md)

### Q: 同步冲突怎么办？

**A**:
```bash
cd ~/.memohub
git pull origin main
# 手动解决冲突
git add .
git commit -m "Resolve conflict"
git push origin main
```

### Q: 如何取消同步？

**A**: 修改配置文件：

```yaml
sync:
  enabled: false
```

### Q: 同步速度慢？

**A**:
1. 使用 `.gitignore` 排除大文件
2. 增量同步（只提交更改）
3. 使用更快的 Git 服务器
4. 压缩数据库

---

## 错误排查

### Q: "Database not initialized" 错误？

**A**: 运行 `mh stats` 初始化数据库

### Q: "Embedding failed" 错误？

**A**:
1. 检查 Ollama 是否运行
2. 检查嵌入模型是否安装
3. 检查网络连接

### Q: "Record not found" 错误？

**A**: 检查 ID 是否正确

### Q: "Permission denied" 错误？

**A**:
```bash
# 修复权限
chmod -R 755 ~/.memohub/
```

### Q: "Config not found" 错误？

**A**:
```bash
# 复制示例配置
cp config/config.example.yaml config/config.jsonc
```

---

## 安全和隐私

### Q: 数据会被上传到云端吗？

**A**: 不会。所有数据存储在本地。

### Q: 如何确保数据安全？

**A**:
1. 使用私有仓库同步
2. 定期备份
3. 启用磁盘加密
4. 限制文件权限

### Q: 配置文件包含敏感信息吗？

**A**: 是的。`config/config.jsonc` 包含数据库路径和同步配置。

**不要提交到公共 Git 仓库！**

### Q: 如何清理敏感数据？

**A**:
1. 删除相关记录
2. 清理数据库
3. 从备份中删除
4. 从同步仓库中删除

---

## 其他

### Q: 如何更新 MemoHub？

**A**:
```bash
# 从源码更新
git pull origin main
bun install
bun run build

# 从 npm 更新
npm update -g memohub
```

### Q: 如何卸载 MemoHub？

**A**:
```bash
# 卸载全局包
npm uninstall -g memohub

# 删除数据
rm -rf ~/.memohub/

# 删除配置
rm -rf config/config.jsonc
```

### Q: 如何报告 Bug？

**A**: 提交 [GitHub Issue](https://github.com/your-username/memohub/issues)

### Q: 如何贡献代码？

**A**: 查看 [贡献指南](../CONTRIBUTING.md)

### Q: 有计划支持其他语言吗？

**A**: 目前支持 TypeScript 和 Python。未来可能支持更多语言。

---

## 未找到答案？

如果问题未在本文档中找到，请：

1. 查看 [快速开始](../guides/quickstart.md)
2. 查看 [配置指南](../guides/configuration.md)
3. 查看 [API 文档](api.md)
4. 提交 [GitHub Issue](https://github.com/your-username/memohub/issues)
5. 加入 [GitHub Discussions](https://github.com/your-username/memohub/discussions)
