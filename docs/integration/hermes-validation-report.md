# Hermes 闭环验证报告

最后更新：2026-05-07

本报告记录 `close-hermes-memory-loop` 首次闭环验证的实际结果。验证目标是确保 Hermes 通过共享 MemoHub 数据源完成“纯记忆闭环”，并且测试数据只落在隔离沙箱和 `purpose=test` 渠道。

2026-05-07 补充：Hermes connector 已进一步收敛到官方 memory provider plugin 目录范式 `plugins/memory/memohub/`，并补齐 `register(ctx)`、`register_cli(subparsers)`、`sync_turn` 非阻塞后台写入。

2026-05-07 再补充：

- Hermes plugin 资产现在会随 CLI 发布包一起发布到 `apps/cli/assets/hermes/`
- `memohub hermes install` 会把插件资产复制到 `~/.memohub/integrations/hermes/`，再为 Hermes 建立固定目录软链接
- Hermes connector 最低兼容版本已降到 `Python >=3.9`

## 验证命令

```bash
bun run build
bun run build:cli
bun run verify:cli
bun run check:test-layout
bun run docs:generate
bun run docs:check
bun run connector:hermes:sync
bun run connector:hermes:check
bun run test:unit
bun run test:hermes-isolated
node apps/cli/dist/index.js hermes install --hermes-home /tmp/memohub-hermes-smoke --project memo-hub-hermes-smoke --json
node apps/cli/dist/index.js hermes doctor --hermes-home /tmp/memohub-hermes-smoke --json
```

## 隔离闭环脚本

```bash
bun run test:hermes-isolated
```

脚本特点：

- 使用临时沙箱目录，不污染 `~/.memohub`
- 启动本地 deterministic mock AI 服务，不依赖外部 Ollama 可用性
- 通过 `apps/cli/dist/index.js` 真实验证 CLI 入口
- 使用 `purpose=test` 渠道写入和删除验证数据

## 已验证链路

1. `config show` 与 `mcp tools` 可读
2. `channel open` 可创建 `primary` 与 `test` 渠道
3. `add --json` 可成功写入主记忆与测试记忆
4. `list --perspective actor` 能读回 Hermes 两条记忆
5. `list --perspective project` 能读回项目范围内测试记忆
6. `query --view project_context` 能召回测试记忆
7. `logs query` 能看到 `cli.add.result`、`cli.query.result`、`cli.list.result`
8. `data clean --actor hermes --purpose test --dry-run` 能定位测试渠道和记录
9. `data clean --actor hermes --purpose test --yes --confirm DELETE_MEMOHUB_DATA` 仅删除测试记忆，保留主记忆

## 实际结果

隔离脚本输出：

```json
{
  "success": true,
  "primaryChannel": "hermes:primary:memo-hub",
  "testChannel": "hermes:test:memo-hub:isolated-validation",
  "actorMemories": 2,
  "actorMemoriesAfterClean": 1,
  "projectMemories": 2,
  "logEntries": 9,
  "dryRunMatchedChannels": 1,
  "dryRunMatchedRecords": 1,
  "cleanMatchedChannels": 1,
  "cleanMatchedRecords": 1
}
```

## 结论

- Hermes Connector、CLI Connector、MCP Connector 已共享同一套 `Connector -> Channel -> Memory` 主链路
- Hermes 的纯记忆闭环已具备最小发布前验证能力
- `purpose=test` 的治理链路已闭环到真实删除验证
- CLI 的 `--json` 输出已去除 spinner 污染，适合 Hermes 或其他 Agent 直接消费
- CLI 核心写入、查询、列表与渠道治理现在会写入统一日志，便于后续排障和审计
- Hermes 官方固定目录安装链路已经具备最小闭环：`memohub hermes install -> hermes memory setup -> hermes plugins reload -> memohub hermes doctor`
- Hermes 用户态 memory provider 发现目录已校正为 `~/.hermes/plugins/memohub`，与 Hermes 实际扫描实现一致
