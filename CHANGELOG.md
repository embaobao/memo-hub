# MemoHub Changelog

## [1.1.0] - 2026-04-27

### 🎉 Added - Web Console v1.0 Complete

#### Web Development Environment
- ✅ 升级 Vite 配置优化 Bun 集成（Vite 6.x + 代理配置）
- ✅ 设置开发环境代理连接后端 API
- ✅ 创建自动化开发启动脚本 (`scripts/dev.sh`)
- ✅ 实现前后端分离开发（热重载支持）

#### New Components
- ✅ `WikiPreview`: Wiki 沉浸式预览组件
  - Markdown 渲染支持
  - 实体关系图展示
  - 相关资产推荐
  - 多标签页切换（Content/Entities/Relations）

- ✅ `ClarifyCenter`: 完整的 CLARIFY 治理中心
  - A/B Diff 对比视图
  - 多策略解决（保留/合并/删除）
  - 冲突严重程度标记
  - 实时冲突检测

- ✅ `AgentPlayground`: 增强的 MCP Agent Playground
  - 多轮对话支持
  - 工具调用追踪
  - 系统提示词自定义
  - 对话记录导出

#### Backend Improvements
- ✅ 修复 CLI 构建问题（使用 Bun 原生构建）
- ✅ 修复 tree-sitter WASM 文件缺失问题
- ✅ 完善所有 API 端点（inspect, workspaces, assets, chat, search）
- ✅ WebSocket 实时追踪日志流
- ✅ 工作区动态切换支持

#### Developer Experience
- ✅ 完整的 Web 使用手册 (`docs/guides/web-console.md`)
- ✅ 端到端 E2E 验证测试脚本
- ✅ 开发环境一键启动（前端 + 后端）
- ✅ 详细的故障排除指南

### 🔧 Fixed

- 修复 API 服务器启动问题（WASM 文件路径）
- 修复前端代理配置（开发/生产环境分离）
- 修复 TypeScript 构建错误（Bun 原生构建）
- 修复 WebSocket 连接问题（端口和协议）

### 📚 Documentation

- 新增 Web Console 使用手册（8 大章节）
  - 快速启动指南
  - 功能详细说明（5 大模块）
  - 界面特色介绍
  - 开发指南
  - API 端点文档
  - 故障排除
  - 进阶主题
  - 最佳实践

- 新增开发环境快速启动指南
- 新增 API 端点完整文档
- 新增故障排除指南

### 🎯 Features Summary

1. **Studio** - 可视化流编排
   - 节点视图 + 实时脉冲
   - 自动连线 + 实时反馈

2. **Playground** - Agent 对话沙盒
   - 多轮对话 + 工具调用
   - 系统提示词 + 导出功能

3. **Clarify** - 冲突治理中心
   - A/B 对比 + 多策略解决
   - 严重程度标记

4. **Matrix** - 记忆资产大盘
   - 卡片视图 + Wiki 预览
   - 多维度筛选

5. **Logs** - 实时追踪日志
   - WebSocket 流式更新
   - 时间戳 + 详细信息

### 🧪 Testing

- ✅ 所有 E2E 测试通过（7/7）
- ✅ API 端点验证通过
- ✅ WebSocket 连接验证通过
- ✅ 前端代理验证通过
- ✅ 开发环境启动验证通过

### 📊 Performance

- 前端构建时间优化（Vite 6.x）
- 热重载速度提升
- API 响应时间优化
- WebSocket 连接稳定性提升

---

## [1.0.0] - 2026-04-25

### 🚀 主要特性 (Major Features)
- **Node-RED/Dify 流编排架构 (Flow Engine)**: 彻底废弃硬编码轨道，所有业务流转均通过 `config.jsonc` 声明式配置。支持 `$.nodes.step.output` 上下文变量隐式传递，实现高度可拔插的记忆工作流。
- **动态原子工具箱 (Atomic Tools)**: 新增 `builtin:cas`, `builtin:vector`, `builtin:retriever`, `builtin:code-analyzer`, `builtin:deduplicator` 等 10+ 无状态原子工具节点。
- **LightRAG 跨轨检索流**: 基于实体扩展 (Entity Expansion) 的三段式检索流水线 (Pre/Exec/Post)，有效解决传统向量检索"只见树木不见森林"的问题。
- **主动记忆流与后台守护 (Daemon & Proactive Workflow)**: 新增 `memohub daemon` 命令，支持常驻内存调度 Librarian 去重与对话记录自动蒸馏 (`track-stream` -> `track-insight`)。
- **Web-Ready 基础设施**: 引入基于输入哈希的 `ExecutionCache` (性能提升)，以及基于 `env://` 前缀的 `SecretManager` (安全性提升)。

### 🏗 架构升级 (Architecture & Infrastructure)
- **Bun Workspace Monorepo**: 将原有的 `src` 单体彻底拆分为 `packages/core`, `packages/config`, `packages/protocol`, `packages/librarian` 等高内聚模块。
- **灵肉分离存储**: 引入 CAS (Content-Addressable Storage) 解决原文物理去重，结合 LanceDB 向量索引，实现高性能检索。
- **Tree-sitter AST 解析**: `track-source` 轨道正式接入 WASM 级代码解析，精准提取函数、类等符号关系。
- **JSONC 模块化配置**: 支持全局与项目级配置的深度合并，统一移除旧版 YAML 配置体系。

### 🚨 破坏性变更 (Breaking Changes)
- **概念移除**: 彻底移除 `gbrain` 与 `clawmem` 概念，统一更名为 `track-insight` (经验轨道) 与 `track-source` (源码轨道)。
- **配置迁移**: 不再兼容旧版 `config.yaml`，必须通过 `memohub config --init` 生成新版 `config.jsonc` 规范。
- **API 变更**: MCP Server 与 CLI 入口完全重写，取消了底层强耦合的面向对象 API。