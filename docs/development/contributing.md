# Contributing

最后更新：2026-04-29

本文档只记录当前工程化贡献流程。详细 AI 协作约束见 [AGENTS.md](https://github.com/embaobao/memo-hub/blob/main/AGENTS.md)。

## 基础环境

- Node.js >= 22
- Bun >= 1.3
- 可选：Ollama，用于真实嵌入链路验证

## 标准流程

```bash
bun install
bun run build
bun run test
bun run docs:generate
bun run docs:check
```

发布试用前执行：

```bash
bun run check:release
```

## 目录约束

- 业务文档放在 `docs/`。
- 变更日志放在 `docs/CHANGELOG.md`。
- AI 协作入口只维护 `AGENTS.md`，其他工具入口使用软链接。
- 工程脚本放在 `scripts/engineering/`。
- 测试放在 `test/` 或各包自己的 `test/` 目录。
- 不新增根目录安装脚本、临时验证脚本或本地工具安装目录。

## 接口变更流程

CLI/MCP 变更必须按顺序处理：

1. 更新 `apps/cli/src/interface-metadata.ts`。
2. 更新 CLI 或 MCP 实现。
3. 更新 `docs/integration/` 和 `docs/api/reference.md`。
4. 运行 `bun run docs:generate`。
5. 运行 `bun run docs:check` 和相关测试。

## 配置变更流程

配置结构变更必须：

- 保留或升级 `configVersion`。
- 更新 `packages/config/src/schema.ts`。
- 更新 `config/config.example.jsonc`。
- 更新 [配置指南](../guides/configuration.md)。
- 验证 `memohub config`、`memohub config-check` 和 MCP 配置工具。

## Agent Skill 变更流程

Skill 由根目录工程脚本生成：

```bash
bun run skill:memohub
```

约束：

- 产物只写入 `skills/memohub/SKILL.md`。
- 不写入 `.codex`、`.claude`、`.gemini`、`.trae` 或其他本机 Agent 私有目录。
- 安装交给 `npx skills add <repo> --skill memohub`。

## 提交前检查

```bash
bun run check:test-layout
bun run check:deps
bun run build:cli
bun run docs:check
memohub mcp-doctor
```

如果改动影响完整链路，再运行：

```bash
bun run check:release
```
