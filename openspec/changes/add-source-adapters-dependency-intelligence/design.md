## Overview

本变更把“外部数据进入 MemoHub”拆成独立接入层。核心记忆模型、Integration Hub、QueryPlanner 和 MCP/CLI 保持稳定；GitLab、npm、私有 registry、IDE、CI 等来源通过 adapters 产出标准事件，再由现有统一运行时写入和检索。

目标不是做一个只能服务 GitLab 的一次性脚本，而是建立可扩展的 adapter framework：后续新增 Gemini、GitHub、Confluence、浏览器、CI 产物或私有代码平台，只需要实现 adapter，不需要修改核心存储和检索链路。

## Target Chain

```text
Hermes / CLI / MCP / scheduler
  -> source-adapter-runtime
  -> code-repository-adapter / dependency-intelligence
  -> CanonicalMemoryEvent / MemoryObject
  -> IntegrationHub ingest
  -> code-intelligence / dependency-intelligence / project-knowledge
  -> coding_context / project_context / recent_activity
  -> Hermes 回溯仓库、API、依赖和历史分析
```

## Adapter Runtime

Adapter runtime 负责通用生命周期：

- 注册 adapter manifest，例如 `gitlab-repository`、`npm-dependency`。
- 读取配置和 credential reference，但不直接暴露 token。
- 执行 scan、incremental sync、health check、dry run。
- 管理 cursor，例如 commit SHA、lockfile hash、registry metadata etag。
- 将 adapter 输出转换成 `MemoHubEvent` 或 `CanonicalMemoryEvent`。
- 输出 scan report，记录成功、失败、跳过、脱敏字段和生成的 event 数量。

Adapter runtime 不负责具体 AST、npm registry、GitLab API 细节。这些由具体 adapter/analyzer 实现。

## Code Repository Adapter

第一阶段优先 GitLab，但抽象上应支持 repository source：

- 输入：repo URL/project ID、branch/ref、token ref、include/exclude、language hints、scan mode。
- 输出：文件职责、目录结构、代码入口、导出 API、组件关系、依赖引用、README/wiki 摘要、commit/ref provenance。
- 增量：基于 commit SHA 和文件 hash，只重扫变更文件和受影响依赖。
- 记忆：写入 `code-intelligence` 和 `project-knowledge`，带 `workspace`/`project`/`file`/`symbol` 等 scope 或 metadata。

GitLab adapter 应避免把仓库源码全文无差别打散为碎片。默认策略应保留组织性：repo -> package/module -> file -> symbol/API -> relation，必要时再写入细粒度 content blocks。

## Dependency Intelligence

依赖分析能力分为本地项目依赖和 registry 元数据：

- Manifest：`package.json`、workspace package manifests。
- Lockfile：`bun.lock`、`package-lock.json`、`pnpm-lock.yaml`、`yarn.lock`。
- Registry：公共 npm 和私有 registry metadata。
- API surface：`exports`、`types`、README、声明文件、入口文件、workspace 私有包源码。
- Risk/context：版本约束、重复依赖、peer 冲突、私有源归属、升级影响候选。

私有 registry token 只用于拉取元数据，不进入记忆；记忆中只保存 registry host 的脱敏标识、package identity、version、source kind 和 provenance。

## Hermes Experience

Hermes 视角应是自然查询和回溯：

```text
我接入了这个 GitLab 仓库，帮我记住它的代码结构和 API。
这个项目用了哪些私有 npm 包？
@company/ui 的 Button API 怎么用？
这个仓库的认证链路在哪些文件？
升级 zod 会影响哪些模块？
Hermes 上次分析这个仓库得出了什么结论？
```

Hermes 不需要理解底层 adapter 实现，只需要通过 MCP/CLI 启动扫描、读取工具目录、查询 `coding_context` 或 `project_context`，并在澄清后写回 curated memory。

## Security And Governance

- credential 通过 config secret reference 管理，不写入 memory content、metadata 或 logs。
- 输出事件必须经过 source normalization 和 memory object validation。
- 扫描报告要保留可审计 provenance，但默认脱敏 URL token、registry auth、header、cookie。
- 私有源码和私有包内容默认 `visibility = "shared"` 且限定 project/workspace scope；后续可扩展 private/team policy。

## Non-Goals

- 不在本阶段实现云端托管扫描服务。
- 不做旧接口兼容。
- 不把 GitLab、npm、AST 逻辑写进 MemoryKernel。
- 不要求第一阶段覆盖所有语言 AST；先完成 TypeScript/npm 生态闭环。

