# MemoHub Changelog

## [1.0.0] - 2026-04-25

### 🚀 主要特性 (Major Features)
- **Node-RED/Dify 流编排架构 (Flow Engine)**: 彻底废弃硬编码轨道，所有业务流转均通过 `config.jsonc` 声明式配置。支持 `$.nodes.step.output` 上下文变量隐式传递，实现高度可拔插的记忆工作流。
- **动态原子工具箱 (Atomic Tools)**: 新增 `builtin:cas`, `builtin:vector`, `builtin:retriever`, `builtin:code-analyzer`, `builtin:deduplicator` 等 10+ 无状态原子工具节点。
- **LightRAG 跨轨检索流**: 基于实体扩展 (Entity Expansion) 的三段式检索流水线 (Pre/Exec/Post)，有效解决传统向量检索“只见树木不见森林”的问题。
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
