## Overview

本变更把 MemoHub 的代码场景从“若干代码记忆写入”升级为“代码资产层 + 多索引层 + 记忆治理层”。

核心原则：

- 原文是根，AST 是派生视图，记忆是治理结果。
- Git 是代码版本事实源，不是附属元数据。
- 代码查询和记忆查询是两条不同链路。
- 所有 adapter 先进入代码资产层，再投影为统一记忆对象。

## Target Chain

```text
Git / local repo / IDE / GitLab adapter
  -> repo discovery
  -> repo snapshot (repo, branch, commit, files)
  -> raw corpus storage
  -> text/path/symbol/dependency indexes
  -> code asset graph
  -> memory projection (code-intelligence / project-knowledge)
  -> code query protocol + memory query protocol
  -> Hermes / CLI / MCP / IDE recall
```

## Layer Model

### 1. Raw Corpus Layer

负责保留原始事实：

- repository snapshot
- file content
- blob hash / content hash
- commit / branch / remote / repo root
- README / config / script / SQL / YAML / JSON / source code

要求：

- 原文必须可回溯。
- 不允许只保留抽取结果而丢失原文。
- 原始层与 MemoryObject 分离。

### 2. Structural Layer

负责结构化理解：

- AST
- symbol
- import/export
- class/function/method
- dependency edges
- call edges
- API surface

要求：

- AST 只是结构化来源之一，不是最终产品对象。
- 结构层允许不同语言不同 extractor，但输出要落到统一代码资产模型。

### 3. Retrieval Layer

负责查询执行：

- path index
- full-text index
- symbol index
- relation index
- vector index

要求：

- `rg` 或等价全文引擎应作为第一类检索手段，而不是临时工具。
- 向量检索只用于补充语义召回，不替代原文、symbol、path 和 relation 检索。

### 4. Memory Layer

负责治理后的解释性资产：

- component summary
- API explanation
- dependency impact notes
- clarification result
- agent-generated code conclusions

要求：

- 记忆层依赖代码资产层，不直接承担代码原始事实存储职责。

## Core Objects

### RepoSnapshot

- `repoId`
- `remoteUrl`
- `workspaceId`
- `branch`
- `commitSha`
- `scanMode`
- `scannedAt`
- `fileCount`
- `languageStats`

### FileAsset

- `repoId`
- `branch`
- `commitSha`
- `path`
- `contentHash`
- `blobRef`
- `language`
- `size`
- `moduleId`
- `exports`
- `imports`
- `symbolIds`

### SymbolAsset

- `repoId`
- `commitSha`
- `filePath`
- `symbolId`
- `name`
- `kind`
- `signature`
- `range`
- `parentSymbolId`

### RelationEdge

- `repoId`
- `commitSha`
- `fromId`
- `toId`
- `relationType`
- `evidence`
- `confidence`

### CodeMemoryProjection

- `memoryId`
- `repoId`
- `commitSha`
- `scope`
- `domain`
- `summaryType`
- `sourceAssetIds`

## Query Split

代码查询不应继续完全复用当前的自然语言 `query view` 入口。

后续需要至少拆成：

- `code.search_text`
- `code.search_path`
- `code.search_symbol`
- `code.search_dependency`
- `code.read_file`
- `code.read_symbol`
- `code.explain_component`

而记忆查询继续保留：

- `memory.query`
- `memory.list`
- `memory.clarify`

这样：

- 代码问题优先命中代码资产层
- 历史解释、项目约定、结论性沉淀再从记忆层补充

## Git Role

Git 是一级事实源，至少提供：

- repo identity
- branch
- commit
- change set
- file version
- blame / author / message provenance

规则：

- 代码资产主键应至少绑定 `repo + branch + commit + path`。
- 符号和关系对象也必须带 commit 维度。
- 没有 Git 上下文的代码写入，应被视为降级模式，而不是标准模式。

## Relationship With Existing Adapter Proposal

`add-source-adapters-dependency-intelligence` 关注“外部来源如何接入 MemoHub”。

本提案关注“代码进入 MemoHub 后，底层资产模型和查询模型应该是什么”。

边界如下：

- adapter proposal 负责接入入口
- git code asset layer proposal 负责代码资产底座

后续 GitLab/local repo/IDE adapter 都必须依赖本提案定义的资产层契约。

## Non-Goals

- 不在本提案阶段实现所有语言的 AST。
- 不把完整 AST JSON 直接作为最终检索对象暴露给用户。
- 不把 Git 逻辑直接揉进当前 `MemoryObject` 基础协议。
- 不保留“默认只写 file_path 代码记忆就够用”的旧思路。
