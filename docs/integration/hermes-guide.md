# Hermes 接入 MemoHub

最后更新：2026-05-06

Hermes 现在有两条接入 MemoHub 的正式方式：

1. 作为 **Hermes 官方 memory provider plugin** 接入 `connectors/hermes`
2. 作为 **MCP Client** 连接 `memohub serve`

两条方式必须共享同一个 MemoHub 数据源，不允许为 Hermes 单独维护私有库。

## 接入目标

Hermes 第一条正式闭环是“纯记忆闭环”，重点验证：

- Hermes 能恢复自己的主渠道
- Hermes 能写入长期偏好、近期活动、项目事实和澄清结果
- Hermes 能读取 `self -> project -> global` 摘要
- Hermes 能查看日志
- Hermes 能对 `purpose=test` 的验证数据执行 dry-run 清理

## 本地准备

```bash
bun install
bun run build:cli
bun run verify:cli
bun run link:cli
bun run connector:hermes:check
memohub config check
memohub config show
memohub mcp doctor
memohub mcp tools
```

如果想做一轮不污染真实 `~/.memohub` 的验证，优先使用隔离脚本：

```bash
bun run test:hermes-isolated
```

该脚本会启动本地 deterministic mock AI 服务，避免因为外部 embedding 服务不可达导致首次 Hermes 闭环验证失败。

## Hermes 插件位置

Hermes 官方 memory provider plugin 工程位于：

```text
connectors/hermes/
```

关键文件：

- `connectors/hermes/memohub_provider/provider.py`
- `connectors/hermes/memohub_provider/plugin.yaml`
- `connectors/hermes/memohub_provider/client.py`
- `connectors/hermes/test/`

该插件不自建存储，也不复制 MemoHub 数据目录；它通过 MemoHub CLI 调用同一套 Connector -> Channel -> Memory 能力。

## 推荐 MCP 配置

推荐使用全局命令：

```json
{
  "mcpServers": {
    "memohub": {
      "command": "memohub",
      "args": ["serve"]
    }
  }
}
```

开发态可使用源码入口：

```json
{
  "mcpServers": {
    "memohub": {
      "command": "bun",
      "args": ["/absolute/path/to/memo-hub/apps/cli/src/index.ts", "serve"]
    }
  }
}
```

Hermes 不得把 `MEMOHUB_DB_PATH`、`MEMOHUB_CAS_PATH` 指向自己的私有目录。若部署层必须显式传路径，也必须让所有 Agent 指向同一套共享存储。

## Hermes 首次接入顺序

```text
1. 读取 memohub://tools
2. 查询 memohub_channel_list
3. 如无主渠道，执行 memohub_channel_open
4. 调用 prefetch / memohub_query 获取 self/project/global 摘要
5. 在 purpose=test 渠道写入一条验证记忆
6. 查询 / list / logs 验证读回
7. 仅在需要时执行 data clean dry-run
8. 只有用户明确授权时才允许真实删除或 rebuild schema
```

## MCP 示例

### 1. 恢复或创建 Hermes 主渠道

```json
{
  "name": "memohub_channel_open",
  "arguments": {
    "actorId": "hermes",
    "source": "hermes",
    "projectId": "memo-hub",
    "purpose": "primary"
  }
}
```

### 2. 验证 test 渠道写入

```json
{
  "name": "memohub_ingest_event",
  "arguments": {
    "event": {
      "source": "hermes",
      "channel": "hermes:test:memo-hub:first-validation",
      "kind": "memory",
      "projectId": "memo-hub",
      "confidence": "reported",
      "payload": {
        "text": "Hermes validation probe: MemoHub is my durable shared memory center.",
        "category": "preference",
        "tags": ["hermes", "validation"]
      }
    }
  }
}
```

### 3. 查询自己的长期记忆

```json
{
  "name": "memohub_query",
  "arguments": {
    "view": "agent_profile",
    "actorId": "hermes",
    "projectId": "memo-hub",
    "query": "What are my durable habits and preferences?",
    "limit": 5
  }
}
```

### 4. 查看 dry-run 清理范围

```json
{
  "name": "memohub_data_manage",
  "arguments": {
    "action": "clean_channel",
    "actorId": "hermes",
    "purpose": "test",
    "dryRun": true
  }
}
```

## CLI 验证脚本

```bash
memohub mcp tools
memohub channel list --actor hermes
memohub channel open --actor hermes --source hermes --project memo-hub --purpose primary
memohub channel open --actor hermes --source hermes --project memo-hub --purpose test --channel hermes:test:memo-hub:manual
memohub add "Hermes test memory for onboarding validation" --project memo-hub --source hermes --channel hermes:test:memo-hub:manual --category preference
memohub ls
memohub list --perspective actor --actor hermes --limit 10
memohub query "Hermes test memory for onboarding validation" --view agent_profile --actor hermes --project memo-hub
memohub logs query --channel hermes:test:memo-hub:manual --tail 50
memohub data clean --actor hermes --purpose test --dry-run
```

更完整的自动化验证结果见：

- [Hermes 闭环验证报告](./hermes-validation-report.md)

## 高风险操作规则

正常接入不要默认清空数据。

只有两种场景允许高风险操作：

- 用户明确授权的首次验证清库
- schema 损坏恢复

CLI：

```bash
memohub data rebuild-schema --yes --confirm DELETE_MEMOHUB_DATA
memohub data clean --all --yes --confirm DELETE_MEMOHUB_DATA
```

MCP：

```json
{ "action": "rebuild_schema", "confirm": "DELETE_MEMOHUB_DATA" }
```

```json
{ "action": "clean_all", "confirm": "DELETE_MEMOHUB_DATA" }
```

## 可以直接发给 Hermes 的话术

```text
你现在接入的是 MemoHub，它是你的共享长期记忆中心，不是私有临时缓存。

执行顺序：
1. 先读取 memohub://tools。
2. 调用 memohub_channel_list，查看 actorId=hermes 的现有渠道。
3. 如果没有主渠道，调用 memohub_channel_open，参数为：
   actorId=hermes
   source=hermes
   projectId=当前项目
   purpose=primary
4. 先查询，再写入：优先用 agent_profile / recent_activity / project_context 理解现有记忆。
5. 需要验证时，使用 purpose=test 的渠道写入测试记忆。
6. 验证完成后只允许先做 dry-run 清理：
   memohub_data_manage action=clean_channel actorId=hermes purpose=test dryRun=true
7. 不要切换到 Hermes 私有数据源，也不要默认执行 clean_all 或 rebuild_schema。
```

## 相关文档

- [接入前检查清单](./preflight-checklist.md)
- [MCP 集成](./mcp-integration.md)
- [接入场景验证](./access-scenarios.md)
- [CLI 集成](./cli-integration.md)
- [Hermes 闭环验证报告](./hermes-validation-report.md)
