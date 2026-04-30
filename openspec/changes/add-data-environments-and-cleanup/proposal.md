## Why

MemoHub 即将接入第一个真实场景，当前默认数据目录已经包含开发和测试期间产生的记忆、向量、blob 和日志。如果没有明确的数据环境和清洗能力，真实接入会被历史测试数据污染，后续也难以区分生产、测试、临时验证和回放数据。

## What Changes

- 让配置 reset 流程清理 MemoHub 管理的数据目录，首个真实接入前能一键清场。
- 新增数据环境规划，区分 `default`、`test`、`sandbox` 等 profile/env。
- 新增数据清洗规划，支持 dry-run、按 project/source/channel/session/task 清理。
- 新增数据状态规划，展示当前 root、向量库、blob、日志、表名和数据量。
- 新增安全约束，避免误删非 MemoHub 管理路径，并保留后续 export/import 扩展位。

## Capabilities

### New Capabilities
- `data-environment-governance`: 管理 MemoHub 数据环境、测试隔离、清洗、状态和安全边界。

### Modified Capabilities
- `app-cli-entry`: 配置初始化和后续数据命令需要暴露清场与数据状态入口。
- `documentation-governance`: 文档需要说明真实接入前清场、测试环境隔离和数据清洗流程。

## Impact

- CLI：当前以 `data rebuild-schema` 作为首个真实接入的高风险清场入口，并继续演进 `data status`、`data clean`、`env` 等命令。
- MCP：后续可通过配置/数据管理工具暴露安全的数据状态与清洗能力。
- 配置：后续增加 data profile/env、active profile、managed root guard 和 retention policy。
- 测试：所有集成/E2E 默认使用临时 root，避免污染 `~/.memohub`。
