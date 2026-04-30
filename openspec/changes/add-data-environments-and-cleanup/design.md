## Overview

本变更分两步推进。第一步先解决真实接入阻塞：通过 `data rebuild-schema` 删除 MemoHub 管理的数据目录，保证首个场景前可以清空历史测试数据。第二步建立完整的数据环境和清洗体系，避免后续每次验证都污染默认环境。

## Immediate Behavior

配置 reset 只删除当前配置根目录下 MemoHub 管理的目录：

- `tracks`
- `data`
- `blobs`
- `logs`
- `cache`

它会重新写入默认配置，不删除仓库源码、不删除任意用户路径、不做备份。这个行为符合当前“无需兼容、直接清理冗余数据”的阶段目标。

## Future Data Environment Model

后续引入 profile/env：

```text
default -> ~/.memohub
test    -> ~/.memohub/envs/test
sandbox -> ~/.memohub/envs/sandbox
project -> ~/.memohub/projects/<projectId>
```

CLI 和 MCP 都应能读取当前 active env，并把 storage/log/config 解析到对应 root。

## Cleanup Model

清洗能力需要支持两层：

- 物理清洗：删除整个 env 的 data/blob/log/cache。
- 逻辑清洗：按 project/source/channel/session/task 删除向量记录和相关 blob 引用。

第一阶段可先实现物理清洗，逻辑清洗需要配合向量存储、CAS 引用计数或可达性扫描。

## Safety

- 默认执行 dry-run，明确展示将删除哪些路径或过滤条件。
- 只允许删除 MemoHub 管理 root 下的路径。
- 禁止对 `/`、`~`、仓库根目录、系统目录执行清理。
- 清洗输出必须可读，不只输出 JSON。

## Verification

- 单元测试覆盖 reset 删除管理目录。
- 集成/E2E 测试默认设置临时 `MEMOHUB_STORAGE__ROOT`、`MEMOHUB_STORAGE__VECTOR_DB_PATH`、`MEMOHUB_STORAGE__BLOB_PATH`、`MEMOHUB_MCP__LOG_PATH`。
- 文档提供真实接入前清场命令和测试隔离命令。
