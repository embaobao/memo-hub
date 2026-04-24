# 文档维护规则

本文档定义 MemoHub v3 项目的文档维护规则和最佳实践。

---

## 📁 文档目录结构

```
docs/
├── README.md           # 文档中心首页
├── api/                # API 文档
│   └── reference.md    # API 参考手册
├── guides/             # 用户文档
│   ├── quickstart.md   # 快速开始
│   └── configuration.md # 配置指南
├── development/        # 开发文档
│   ├── project-structure.md # 项目结构
│   ├── contributing.md  # 贡献指南
│   └── testing.md      # 测试指南
├── integration/        # 集成文档
│   ├── hermes.md       # Hermes 集成
│   ├── hermes-quickstart.md # Hermes 快速开始
│   └── *.md            # 其他集成文档
├── architecture/       # 架构文档
│   ├── overview.md     # 架构概览
│   ├── text2mem-protocol.md # 协议规范
│   └── storage.md      # 存储架构
└── archive/            # 归档文档
    ├── v2/             # v2 文档
    └── deprecated/     # 已弃用文档
```

---

## 📝 文档分类规则

### 根目录文档（必须保留）
- **README.md** - 项目主页
- **CLAUDE.md** - AI 协作入口
- **AGENT.md** - 开发规范
- **LICENSE** - 许可证
- **CHANGELOG.md** - 变更日志

### 应删除的文档
- 根目录下的所有 .md 文件（除上述必须保留的）
- 重复的文档
- 过时的 v2 文档
- 临时测试文档

### 归档规则
- v2 相关文档 → `docs/archive/v2/`
- 旧版本指南 → `docs/archive/deprecated/`
- 历史总结报告 → `docs/archive/reports/`

---

## 📋 文档命名规范

### 文件命名
- 使用小写字母和连字符：`quick-start.md`
- 功能描述性：`hermes-integration.md`
- 版本标识：`api-v2.md`（当有多个版本时）

### 标题层级
- 一级标题 `#` 只在文档首页使用
- 二级标题 `##` 用于主要章节
- 三级标题 `###` 用于子章节
- 避免超过四级标题

### 文档元数据
```markdown
---
title: 文档标题
version: 3.0.0
lastUpdated: 2026-04-24
maintainer: 维护者
---
```

---

## 🔗 文档链接规范

### 相对路径
```markdown
// ✅ 正确：使用相对路径
[快速开始](../guides/quickstart.md)
[API 文档](api/reference.md)

// ❌ 错误：使用绝对路径
[快速开始](/Users/embaobao/workspace/ai/memo-hub/docs/guides/quickstart.md)
```

### 链接维护
- CLAUDE.md 链接到所有开发文档
- README.md 链接到用户文档
- docs/README.md 作为文档索引
- 避免断链：移动文档时更新所有引用

---

## ✍️ 文档内容规范

### Markdown 格式
- 使用标准 Markdown 语法
- 代码块指定语言：```typescript
- 表格对齐：确保列宽一致
- 列表：使用 `-` 作为无序列表

### 代码示例
- 必须可运行
- 添加必要注释
- 说明输出结果
- 标注依赖条件

### 图表和图片
- 使用 ASCII 字符画简单图表
- 复杂图表使用 Mermaid 语法
- 图片放在 `docs/images/` 目录

---

## 📊 文档质量标准

### 必需内容
- 清晰的标题结构
- 适当的目录/索引
- 代码示例（如有）
- 相关文档链接
- 最后更新日期

### 质量检查
- 无断链
- 无错别字
- 代码示例可运行
- 与代码实现一致

---

## 🔄 文档更新流程

### 功能变更时
1. 更新相关 API 文档（`docs/api/`）
2. 更新用户指南（`docs/guides/`）
3. 更新架构文档（`docs/architecture/`）
4. 更新 CHANGELOG.md

### 新增功能时
1. 创建或更新 API 文档
2. 添加使用示例到指南
3. 更新相关架构文档
4. 在 CHANGELOG.md 中记录

### 文档归档时
1. 移动到 `docs/archive/` 相应子目录
2. 添加归档说明
3. 更新相关链接

---

## 📚 文档审查

### 审查清单
- [ ] 内容准确无误
- [ ] 代码示例可运行
- [ ] 链接正确有效
- [ ] 格式符合规范
- [ ] 语言清晰简洁

### 审查流程
1. 作者自审
2. 同行审查
3. 维护者批准
4. 合并更新

---

## 🛠️ 文档工具

### 推荐工具
- **编辑器**: VS Code + Markdown 插件
- **预览**: VS Code Markdown 预览
- **检查**: Markdown Lint
- **生成**: 文档生成工具（如需要）

### CLI 命令
```bash
# 检查文档链接
markdown-link-check docs/

# 格式化 Markdown
prettier --write docs/**/*.md

# 检查拼写
cspell docs/**/*.md
```

---

## 📖 文档模板

### API 文档模板
```markdown
# API 名称

## 描述

API 的详细描述。

## 方法

### method1()

**参数**:
- `param1` (type): 说明

**返回**: type 说明

**示例**:
\`\`\`typescript
const result = method1('arg');
\`\`\`
```

### 指南文档模板
```markdown
# 标题

## 概述

简要说明。

## 前置条件

- 条件1
- 条件2

## 步骤

### 步骤1: 标题

详细说明...

### 步骤2: 标题

详细说明...

## 故障排除

常见问题和解决方案。
```

---

## 🔗 外部参考

- [Markdown 规范](https://spec.commonmark.org/)
- [GitHub Flavored Markdown](https://github.github.com/gfm/)
- [文档写作最佳实践](https://www.writethedocs.org/)

---

**规则版本**: 1.0.0  
**最后更新**: 2026-04-24  
**维护者**: 文档团队
