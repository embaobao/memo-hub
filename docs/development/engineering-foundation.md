# Engineering Foundation

最后更新：2026-04-29

本文档记录 `engineering-foundation-governance` OpenSpec 变更的工程化落地状态。目标是让文档、测试、构建、依赖边界和性能验证由脚本维护，而不是每次依赖 Agent 手工同步。

## 标准命令

| 命令 | 用途 | 当前状态 |
| --- | --- | --- |
| `bun run check:test-layout` | 验证测试文件不在 `src/`，且位于标准 `test/` 结构 | 通过 |
| `bun run check:deps` | 验证 app/package/track 依赖边界 | 通过 |
| `bun run docs:generate` | 生成 CLI/MCP/Package/OpenSpec 索引 | 通过 |
| `bun run docs:check` | 校验生成文档存在且内部链接有效 | 通过 |
| `bun run test:unit` | 执行全仓单元测试 | 通过 |
| `bun run test:integration` | 执行集成和 e2e 测试 | 通过 |
| `bun run bench` | 执行性能基准 | 通过 |
| `bun run typecheck` | 执行工作区类型检查 | 通过 |
| `bun run check` | 本地完整门禁，失败不短路，输出汇总 | 可运行，当前失败项见下文 |
| `bun run check:release` | 发布前完整门禁 | 通过 |

## 目录规范

根目录只保留项目入口文件、工程配置、AI 入口软链接和 README。业务文档统一放在 `docs/`，变更日志统一放在 `docs/CHANGELOG.md`，工程化脚本统一放在 `scripts/engineering/`。不再维护 `rulers/`、根目录安装脚本、临时验证脚本或工具本地安装产物。

测试文件必须位于以下目录之一：

- `apps/<name>/test/unit`
- `apps/<name>/test/integration`
- `apps/<name>/test/e2e`
- `packages/<name>/test/unit`
- `packages/<name>/test/integration`
- `tracks/<name>/test/unit`
- `test/e2e`
- `test/fixtures`
- `test/benchmarks`
- `test/utils`

`src/**/*.test.ts` 和 `src/**/*.spec.ts` 会被 `check:test-layout` 拦截。`openspec/changes/archive` 中的历史归档代码不属于当前工程验证对象。

## 生成文档

生成文档统一输出到 `docs/generated/`：

- [CLI Reference](../generated/cli-reference.md)
- [MCP Reference](../generated/mcp-reference.md)
- [Package Index](../generated/package-index.md)
- [OpenSpec Change Index](../generated/openspec-index.md)

CLI/MCP 参考来自 `apps/cli/src/interface-metadata.ts`。后续新增 CLI 命令或 MCP 工具时，应先更新接口元数据，再运行 `bun run docs:generate`。

## 当前验证基线

已通过：

- `bun run check:test-layout`
- `bun run check:deps`
- `bun run docs:check`
- `bun run build`
- `bun run typecheck`
- `bun run test:unit`
- `bun run test:integration`
- `bun run docs:api`
- `bun run bench`
- `bun run check:release`

已解决的阻塞项：

- 工作区类型解析：移除了 base tsconfig 中会污染包级 `rootDir` 的源码 paths，改为 `node_modules/@memohub` 工作区链接和依赖顺序构建。
- dist 类型：`@memohub/protocol` 和 `@memohub/integration-hub` 的 `types` 指向已修正为 `dist/index.d.ts`。
- 内部切片单测：MockKernel 已补齐 `getResources()`，并修复 `track-wiki` 检索返回结构。
- Hermes e2e：删除了过时且重复的 `hermes-simulation.test.ts`，保留当前可维护的 `hermes-simulation-simple.test.ts`。

性能基线：

- `single_event_ingestion` P99 约 `13.11ms`，目标 `< 50ms`。
- `batch_processing_size_100` 约 `0.14ms/event`，目标 `< 100ms/event`。
- `cas_deduplication` P99 约 `10.58ms`，目标 `< 45ms`。
- `memory_usage_mb` 约 `1.88MB`，目标 `< 500MB`。

## 后续修复顺序

1. 后续统一记忆中枢实现必须保持 `bun run check:release` 通过。
2. 新增 CLI/MCP 接口时先更新 `apps/cli/src/interface-metadata.ts`，再运行 `bun run docs:generate`。
3. 新增性能敏感链路时补充 `test/benchmarks` 基准。
