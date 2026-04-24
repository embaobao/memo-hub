## 1. 基础修正：构建与发布 (Build & Publish)

- [x] 1.1 修正 `apps/cli/package.json`，增加 `files` 字段明确打包 `dist`
- [x] 1.2 确保 `dist/index.js` 具有正确的 shebang (`#!/usr/bin/env node`)
- [x] 1.3 更新根目录构建脚本，确保依赖项按正确顺序递归构建
- [x] 1.4 测试本地全局安装并执行 `memohub --help` 验证路径问题

## 2. 性能增强：执行缓存 (Execution Cache)

- [x] 2.1 在 `packages/core` 中实现 `CacheManager`，支持哈希键值存储
- [x] 2.2 在 `FlowEngine` 执行循环前注入缓存检查逻辑
- [x] 2.3 为耗时工具 (AI/AST) 默认开启缓存，提供 `MEMOHUB_CACHE_DISABLED` 开关
- [x] 2.4 实现缓存过期与手动清理命令 `memohub config --clear-cache`

## 3. 安全与规范：凭据管理与版本化 (Secrets & Versioning)

- [x] 3.1 修改 `@memohub/config`，支持 `env://` 动态变量解析
- [x] 3.2 实现配置版本迁移逻辑，支持从 `$schema` 进行平滑升级
- [x] 3.3 完善凭据掩码逻辑，确保 `inspect` API 不泄露敏感信息

## 4. 功能补全：缺失轨道 (Tracks Implementation)

- [x] 4.1 实现 `track-stream` 流程，支持时序消息存储
- [x] 4.2 实现 `track-wiki` 流程，支持实体关系映射
- [x] 4.3 将现有 `Librarian` 治理逻辑拆分为 `dedup` 和 `distill` 原子工具

## 5. Web 能力：可视化编排 (Web Flow Orchestration)

- [x] 5.1 初始化 `apps/web` (Vite + React + Reactflow)
- [x] 5.2 实现 `inspect` API，透传所有 Tool Manifests 和 Flow 结构
- [x] 5.3 在 Web 端实现 Flow 拓扑图渲染，支持拖拽和 Schema 属性编辑
- [x] 5.4 实现配置保存回写功能，保持 JSONC 格式及注释
