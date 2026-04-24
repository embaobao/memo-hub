# 私有仓库同步指南

本指南说明如何设置 MemoHub 的私有仓库同步功能，实现跨设备记忆同步。

## 概述

私有仓库同步允许你将 MemoHub 数据库同步到私有 Git 仓库，实现：
- 跨设备数据备份
- 多设备记忆共享
- 版本历史追踪
- 灾难恢复

---

## 前置条件

1. **私有 Git 仓库**（GitHub、GitLab、Gitee 等）
2. **Git 已配置**（用户名、邮箱）
3. **SSH 密钥已添加**（如果使用 SSH）

---

## 创建私有仓库

### GitHub

```bash
# 创建私有仓库
# 访问 https://github.com/new 创建新仓库
# 访问级别选择 Private
```

### GitLab

```bash
# 创建私有仓库
# 访问 https://gitlab.com/projects/new 创建新项目
# 可见性选择 Private
```

### Gitee

```bash
# 创建私有仓库
# 访问 https://gitee.com/projects/new 创建新仓库
# 可见性选择私有
```

---

## 配置同步

### 1. 生成 SSH 密钥（如果还没有）

```bash
# 生成 SSH 密钥
ssh-keygen -t ed25519 -C "your-email@example.com"

# 启动 SSH 代理
eval "$(ssh-agent -s)"

# 添加私钥
ssh-add ~/.ssh/id_ed25519

# 复制公钥
cat ~/.ssh/id_ed25519.pub
```

### 2. 添加 SSH 密钥到 Git 服务器

**GitHub**：
1. 访问 https://github.com/settings/keys
2. 点击 "New SSH key"
3. 粘贴公钥

**GitLab**：
1. 访问 https://gitlab.com/-/profile/keys
2. 点击 "Add new key"
3. 粘贴公钥

**Gitee**：
1. 访问 https://gitee.com/profile/sshkeys
2. 点击 "添加公钥"
3. 粘贴公钥

### 3. 配置 MemoHub

编辑 `config/config.jsonc`：

```yaml
sync:
  enabled: true
  repoUrl: "git@github.com:your-username/memohub-memory-private.git"
  branch: "main"
  syncInterval: "1h"
  dataPath: "~/.memohub/"
```

### 4. 初始化同步仓库

```bash
# 创建临时目录
mkdir -p /tmp/memohub-sync
cd /tmp/memohub-sync

# 初始化 Git 仓库
git init
git branch -M main

# 复制 MemoHub 数据
cp -r ~/.memohub/* .

# 创建 .gitignore（排除大文件和临时文件）
cat > .gitignore << 'EOF'
*.lancedb/_versions/
*.tmp
.DS_Store
EOF

# 添加并提交
git add .
git commit -m "Initial MemoHub sync"

# 添加远程仓库
git remote add origin git@github.com:your-username/memohub-memory-private.git

# 推送到远程仓库
git push -u origin main

# 清理临时目录
cd -
rm -rf /tmp/memohub-sync
```

---

## 同步工作流程

### 手动同步

```bash
# 推送到远程仓库
cd ~/.memohub
git add .
git commit -m "Update MemoHub data"
git push origin main

# 从远程仓库拉取
cd ~/.memohub
git pull origin main
```

### 自动同步（开发中）

```yaml
sync:
  enabled: true
  repoUrl: "git@github.com:your-username/memohub-memory-private.git"
  branch: "main"
  syncInterval: "1h"
  dataPath: "~/.memohub/"
```

---

## 跨设备同步

### 设备 A（源设备）

```bash
# 1. 配置同步
# 编辑 config/config.jsonc
sync:
  enabled: true
  repoUrl: "git@your-git-server:user/repo.git"
  branch: "main"
  dataPath: "~/.memohub/"

# 2. 推送数据
cd ~/.memohub
git init
git add .
git commit -m "Initial sync"
git branch -M main
git remote add origin git@your-git-server:user/repo.git
git push -u origin main
```

### 设备 B（目标设备）

```bash
# 1. 克隆仓库
git clone git@your-git-server:user/repo.git ~/.memohub

# 2. 配置 MemoHub 使用同步的数据
# 编辑 config/config.jsonc
track-insight:
  dbPath: "~/.memohub/track-insight.lancedb"

track-source:
  dbPath: "~/.memohub/track-source.lancedb"

# 3. 测试
mh stats
```

---

## 最佳实践

### 1. 定期备份

```bash
# 每日备份脚本
cat > ~/.local/bin/memohub-backup.sh << 'EOF'
#!/bin/bash
cd ~/.memohub
git add .
git commit -m "Backup: $(date +%Y-%m-%d)"
git push origin main
EOF

chmod +x ~/.local/bin/memohub-backup.sh

# 添加到 crontab（每天凌晨 2 点）
crontab -e
# 添加：0 2 * * * ~/.local/bin/memohub-backup.sh
```

### 2. 使用 .gitignore

```bash
cd ~/.memohub
cat > .gitignore << 'EOF'
# LanceDB 版本文件
*.lancedb/_versions/

# 临时文件
*.tmp
*.temp

# 系统文件
.DS_Store
Thumbs.db

# 缓存
.cache/
EOF
```

### 3. 分支策略

```bash
# 主分支：稳定版本
git branch main

# 开发分支：实验性功能
git branch dev

# 备份分支：定期备份
git branch backup-$(date +%Y%m%d)
```

---

## 安全建议

### 1. 使用私有仓库

✅ **必须**：仓库必须是私有的

### 2. 启用 2FA

在 Git 服务器上启用双因素认证

### 3. 限制访问权限

只允许受信任的用户访问

### 4. 定期审计

检查仓库访问日志和提交历史

### 5. 敏感数据处理

不要在仓库中存储：
- 明文密码
- API 密钥
- 个人身份信息

---

## 故障排除

### Q: 推送失败 - 权限被拒绝

**A**: 检查 SSH 密钥是否正确添加

```bash
# 测试 SSH 连接
ssh -T git@github.com
```

### Q: 拉取冲突

**A**: 解决冲突后提交

```bash
cd ~/.memohub
git pull origin main
# 手动解决冲突
git add .
git commit -m "Resolve conflict"
git push origin main
```

### Q: 数据库损坏

**A**: 从远程仓库恢复

```bash
cd ~/.memohub
git reset --hard HEAD
```

### Q: 同步慢

**A**: 使用 `.gitignore` 排除大文件和临时文件

---

## 性能优化

### 1. 增量同步

```bash
# 只提交更改的文件
git add -A
git commit -m "Incremental update"
```

### 2. 压缩数据库

```bash
# 定期清理未使用的向量
mh stats
```

### 3. 使用 LFS（可选）

对于大型数据库，考虑使用 Git LFS：

```bash
# 安装 Git LFS
git lfs install

# 追踪 .lancedb 文件
git lfs track "*.lancedb"
git add .gitattributes
git commit -m "Track .lancedb with LFS"
```

---

## 高级用法

### 1. 多环境配置

```bash
# 开发环境
~/.memohub-dev/config.jsonc

# 生产环境
~/.memohub-prod/config.jsonc
```

### 2. 定时同步

```bash
# 使用 systemd 定时器（Linux）
cat > ~/.config/systemd/user/memohub-sync.service << 'EOF'
[Unit]
Description=MemoHub Sync Service

[Service]
Type=oneshot
ExecStart=/bin/bash -c 'cd ~/.memohub && git add . && git commit -m "Auto sync" && git push origin main'

[Install]
WantedBy=default.target
EOF

cat > ~/.config/systemd/user/memohub-sync.timer << 'EOF'
[Unit]
Description=MemoHub Sync Timer

[Timer]
OnCalendar=hourly
Persistent=true

[Install]
WantedBy=timers.target
EOF

# 启用定时器
systemctl --user enable memohub-sync.timer
systemctl --user start memohub-sync.timer
```

### 3. 监控同步状态

```bash
# 查看同步状态
cd ~/.memohub
git status

# 查看远程分支
git branch -r

# 查看同步历史
git log --oneline -10
```

---

需要更多帮助？查看 [配置指南](configuration.md) 或 [常见问题](../docs/faq.md)。
