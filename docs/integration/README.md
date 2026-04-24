# MemoHub v1 集成文档目录

欢迎使用 MemoHub v1！本目录包含完整的集成指南，帮助您快速将 MemoHub 集成到 Hermes 系统。

---

## 📚 文档清单

### 1. 快速集成指南
**文件**: `memohub-quickstart.md`  
**适用**: 新用户快速上手  
**内容**: 
- 5分钟快速集成
- 基础功能演示
- 常见问题解决
- 最佳实践建议

---

### 2. 完整集成报告
**文件**: `memohub-v1-integration-complete.md`  
**适用**: 深度了解系统架构  
**内容**:
- 系统架构详解
- 集成验证报告
- 故障排除指南
- 性能指标分析
- 数据管理指南

---

### 3. MCP 配置示例
**文件**: `hermes-mcp-config-example.yaml`  
**适用**: 直接复制配置  
**内容**:
- 可用的 YAML 配置
- 详细的参数说明
- 故障排除指南
- 高级配置选项

---

## 🚀 推荐阅读路径

### 新手入门
1. 先读 `memohub-quickstart.md` - 了解基础概念和快速安装
2. 复制 `hermes-mcp-config-example.yaml` 中的配置到 Hermes
3. 按照 quickstart 中的验证步骤测试安装

### 深度学习
1. 先完成新手入门步骤
2. 阅读 `memohub-v1-integration-complete.md` 了解系统架构
3. 根据需要调整高级配置选项

### 故障解决
1. 查看对应文档中的"故障排除"部分
2. 检查 `hermes-mcp-config-example.yaml` 中的常见问题
3. 运行诊断工具: `mcp_memohub_get_stats()`

---

## 📋 快速参考

### 环境要求
- Node.js >= 22.0.0
- Bun >= 1.3.0
- Ollama (nomic-embed-text-v2-moe 模型)

### 安装命令
```bash
git clone https://github.com/embaobao/memo-hub.git
cd memo-hub
bun install && bun run build
```

### 验证安装
```bash
# 在 Hermes 中运行
mcp_memohub_get_stats()
```

---

## 📖 核心功能

### 知识管理
- 添加: `mcp_memohub_add_knowledge()`
- 检索: `mcp_memohub_query_knowledge()`
- 删除: `mcp_memohub_delete_knowledge()`
- 分类: `mcp_memohub_list_categories()`

### 代码管理
- 添加: `mcp_memohub_add_code()`
- 搜索: `mcp_memohub_search_code()`

### 系统管理
- 状态: `mcp_memohub_get_stats()`

---

## 🔧 配置路径

### 数据目录
```
~/.hermes/data/
├── memohub.lancedb/    # 向量数据库
└── memohub-cas/        # 内容存储
```

### 配置文件
```
~/.hermes/config.yaml    # Hermes 主配置
```

### 项目目录
```
/Users/embaobao/workspace/ai/memo-hub/
├── apps/cli/dist/      # 构建输出
└── docs/              # 项目文档
```

---

## 🆘 获取帮助

### 在线资源
- **GitHub Issues**: https://github.com/embaobao/memo-hub/issues
- **项目文档**: `/Users/embaobao/workspace/ai/memo-hub/docs/README.md`
- **架构文档**: `docs/architecture/overview.md`

### 本地诊断
```bash
# 检查 Hermes 日志
hermes logs | grep memohub

# 测试 Ollama 连接
curl http://localhost:11434/v1/models

# 检查数据库
ls -la ~/.hermes/data/memohub.lancedb/
```

---

## ✅ 安装检查清单

完成安装后，请确认:

- [ ] 已阅读 `memohub-quickstart.md`
- [ ] 环境要求已满足 (Node.js, Bun, Ollama)
- [ ] 项目已成功构建
- [ ] Hermes 配置已更新
- [ ] `mcp_memohub_get_stats()` 返回正常
- [ ] 成功添加测试数据
- [ ] 成功检索到数据
- [ ] 理解核心功能使用方法

---

## 📚 文档版本

| 文档 | 版本 | 最后更新 |
|------|------|----------|
| memohub-quickstart.md | 1.0.0 | 2026-04-24 |
| memohub-v1-integration-complete.md | 1.0.0 | 2026-04-24 |
| hermes-mcp-config-example.yaml | 1.0.0 | 2026-04-24 |

---

## 🎓 学习路径

### 基础级 (1-2小时)
1. 快速集成指南
2. MCP 配置示例
3. 基础功能测试

### 进阶级 (3-5小时)
1. 完整集成报告
2. 系统架构理解
3. 高级配置选项

### 专家级 (5-10小时)
1. 协议文档 (Text2Mem)
2. 架构设计文档
3. 源码阅读

---

## 🔗 相关链接

### 项目文档
- [项目主页](../README.md)
- [架构概览](../architecture/overview.md)
- [协议规范](../architecture/text2mem-protocol.md)

### 外部资源
- [Hermes 文档](https://hermes.ai)
- [MCP 协议](https://modelcontextprotocol.io)
- [Ollama 文档](https://ollama.ai/docs)

---

## 📝 反馈与贡献

如果您在集成过程中遇到问题或有改进建议:

1. 提交 GitHub Issue
2. 改进文档内容
3. 分享集成经验

---

**维护者**: MemoHub Team  
**联系方式**: 通过 GitHub Issues  
**文档版本**: 1.0.0  
**最后更新**: 2026-04-24

感谢您使用 MemoHub v1！ 🎉
