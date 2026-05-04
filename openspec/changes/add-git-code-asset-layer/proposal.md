## Why

MemoHub 当前已经能接收代码相关记忆，并通过 `file_path`、`code-intelligence` 和 `coding_context` 做基础查询，但这条链路仍然过于轻量：

- 只写入“代码记忆摘要”不足以支撑完整代码回溯。
- AST 只是结构视图的一种，不等于代码事实源。
- 缺少 Git 版本维度，无法稳定回答“谁在什么时候改了什么”。
- 缺少原始代码资产层，无法同时支持全文检索、结构检索、关系检索和记忆检索。

MemoHub 的代码场景不能只靠“打散后的 AST 片段”或“若干摘要记忆”支撑。需要正式引入 Git 与代码资产层，把原始代码、版本事实、多索引和治理记忆统一纳入同一套对象模型与链路。

## What Changes

- 新增 `git-code-asset-layer` 规划，定义 Git 驱动的代码资产模型、原始内容存储、多索引结构和查询协议。
- 明确 Git 是代码场景一级事实源，代码资产主键至少包含 `repo + branch + commit + path (+ symbol)`。
- 明确代码资产层维护四类数据：原始层、结构层、检索层、记忆层。
- 明确代码查询链路和记忆查询链路分离，避免用 AST 或向量检索替代全文和版本事实。
- 规定后续 GitLab、本地仓库、IDE、Hermes 等 adapter 进入 MemoHub 时，必须先落到代码资产层，再投影为代码记忆和项目知识。
- 不实现旧 track 兼容，不保留“仅 AST 入库”的历史思路。

## Capabilities

### New Capabilities

- `git-code-asset-layer`: 统一管理代码原始资产、Git 版本事实、结构索引、关系索引、全文索引和记忆投影。
- `code-query-protocol`: 区分全文/路径/symbol/dependency/read/explain 等代码查询接口与记忆查询接口。
- `repo-snapshot-governance`: 统一管理代码扫描的 repo / branch / commit / file / symbol 追溯边界。

### Modified Capabilities

- `code-repository-adapter`
  - 后续必须以代码资产层为写入中间层，而不是直接输出若干碎片化 memory。
- `coding_context`
  - 后续优先从代码资产层和治理记忆组合生成，不再等价于“若干 file_path 代码记忆”。

## Impact

- 后续代码位置预计涉及：
  - `packages/code-asset-layer`
  - `packages/git-adapter`
  - `packages/code-query`
  - 或等价 workspace 包
- CLI/MCP 后续可能新增：
  - `memohub code ...`
  - `memohub repo ...`
  - 对应 MCP tools/resources
- 配置系统后续需支持：
  - repo roots
  - git scan policies
  - snapshot retention
  - code index backends
  - parser/language capability flags
- 文档后续需要补充：
  - Git 驱动代码接入链路
  - 代码资产对象模型
  - 代码查询协议
  - Hermes/IDE/GitLab 的统一接入方式
