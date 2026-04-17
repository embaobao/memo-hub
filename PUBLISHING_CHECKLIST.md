# 发布前检查清单

在将 MemoHub 发布到 GitHub 之前，请完成以下检查：

## 📦 项目文件检查

### 核心文件
- [ ] `package.json` - 更新版本号和描述
- [ ] `README.md` - 完整的项目文档
- [ ] `LICENSE` - MIT 许可证
- [ ] `CHANGELOG.md` - 版本历史记录
- [ ] `CONTRIBUTING.md` - 贡献指南
- [ ] `.gitignore` - 确保排除敏感文件

### 文档
- [ ] `guides/quickstart.md` - 快速开始指南
- [ ] `guides/configuration.md` - 配置指南
- [ ] `guides/private-sync.md` - 私有仓库同步指南
- [ ] `docs/api.md` - API 文档
- [ ] `docs/faq.md` - 常见问题

### 配置
- [ ] `config/config.example.yaml` - 示例配置文件
- [ ] `install.sh` - 安装脚本（可执行）

---

## 🔒 安全和隐私检查

### 数据排除
- [ ] `config/config.yaml` 在 `.gitignore` 中（包含敏感配置）
- [ ] `*.lancedb/` 在 `.gitignore` 中（数据库文件）
- [ ] `*.db` 在 `.gitignore` 中（其他数据库）
- [ ] `*.local.env` 在 `.gitignore` 中（本地环境变量）
- [ ] `node_modules/` 在 `.gitignore` 中（依赖）

### 敏感信息检查
- [ ] 确认没有 API 密钥
- [ ] 确认没有密码
- [ ] 确认没有个人身份信息
- [ ] 确认没有私有仓库 URL（使用示例）

---

## ✅ 功能测试

### CLI 功能
```bash
# 构建项目
bun run build

# 测试帮助信息
node dist/cli/index.js --help

# 测试统计
node dist/cli/index.js stats

# 测试添加知识
node dist/cli/index.js add-knowledge "测试知识" -c test -i 0.8

# 测试搜索
node dist/cli/index.js search-knowledge "测试" -l 3

# 测试配置验证
node dist/cli/index.js config --validate
```

### 功能清单
- [ ] `mh --help` - 帮助信息正常
- [ ] `mh stats` - 统计信息正常
- [ ] `mh add-knowledge` - 添加知识正常
- [ ] `mh search-knowledge` - 搜索知识正常
- [ ] `mh add-code` - 添加代码正常
- [ ] `mh search-code` - 搜索代码正常
- [ ] `mh config` - 配置管理正常

---

## 📝 文档检查

### README.md
- [ ] 项目名称正确（MemoHub）
- [ ] CLI 命令正确（mh）
- [ ] 描述准确
- [ ] 安装步骤清晰
- [ ] 使用示例完整
- [ ] 徽章链接有效
- [ ] 贡献指南链接正确

### 文档链接
- [ ] 所有内部链接有效
- [ ] 外部链接可访问
- [ ] 代码示例可运行
- [ ] 截图/图表清晰

---

## 🔧 构建和发布检查

### 构建系统
- [ ] TypeScript 编译无错误
- [ ] `dist/` 目录包含所有必需文件
- [ ] `package.json` 的 `files` 字段正确
- [ ] `bin` 字段正确（mh 和 memohub）

### package.json
- [ ] 版本号正确（1.0.0）
- [ ] 名称正确（memohub）
- [ ] 描述准确
- [ ] 作者信息正确
- [ ] 依赖项完整
- [ ] 脚本命令可用
- [ ] 引擎版本正确

---

## 🌐 Git 检查

### Git 配置
- [ ] Git 用户信息已配置
- [ ] 远程仓库 URL 正确
- [ ] 分支名称正确（main）

### 提交历史
- [ ] 提交消息符合规范
- [ ] 没有 WIP 提交
- [ ] 没有临时文件

### Git 忽略检查
```bash
# 检查是否意外跟踪了敏感文件
git status

# 检查要提交的文件
git diff --cached --name-only
```

---

## 🚀 发布前最终检查

### 仓库信息
- [ ] 仓库名称：memohub
- [ ] 仓库描述：MemoHub - 我的双轨记忆中心
- [ ] 许可证：MIT
- [ ] 可见性：Public

### 发布说明
- [ ] 准备发布说明
- [ ] 列出主要功能
- [ ] 列出已知问题
- [ ] 列出迁移指南（如果有）

### 推广
- [ ] 准备社交媒体公告
- [ ] 准备博客文章（可选）
- [ ] 准备演示视频（可选）

---

## 📋 发布清单

1. 创建 GitHub 仓库
2. 初始化 Git 仓库（如果还没有）
3. 添加所有文件
4. 创建初始提交
5. 推送到 GitHub
6. 创建第一个 Release (v1.0.0)
7. 发布 npm 包（可选）
8. 公布仓库地址

---

## ⚠️ 重要提醒

- **不要发布 `config/config.yaml`** - 它包含本地数据库路径和敏感配置
- **不要发布数据库文件** - `*.lancedb` 和 `*.db` 文件都在 `.gitignore` 中
- **不要发布 `node_modules/`** - 用户会自己安装依赖
- **确认 `.gitignore` 正确** - 确保所有敏感文件都被排除
- **测试 CLI 功能** - 确保所有命令都正常工作
- **检查文档链接** - 确保所有链接都有效

---

## 🎉 完成后

完成所有检查后，你的项目就可以发布了！

记住：
- 发布后继续维护
- 及时响应 Issue 和 PR
- 定期更新文档
- 计划下一个版本的功能

祝发布顺利！🚀
