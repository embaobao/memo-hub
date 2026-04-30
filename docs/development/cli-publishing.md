# CLI 构建、链接和发布

最后更新：2026-04-29

## 职责边界

CLI 包维护自己的构建和 bin 准备逻辑：

```bash
cd apps/cli
bun run build
bun run verify:bin
bun run link:global
```

根目录只提供聚合命令：

```bash
bun run build:cli
bun run verify:cli
bun run link:cli
bun run skill:memohub
```

## 正式产物

- CLI 入口：`apps/cli/dist/index.js`
- package bin：`bin.memohub = dist/index.js`
- bin 准备脚本：`apps/cli/scripts/prepare-bin.ts`
- Agent Skill 安装源：`skills/memohub/SKILL.md`

`prepare-bin.ts` 会检查：

- `dist/index.js` 存在。
- 文件包含 `#!/usr/bin/env node` shebang。
- 编译产物没有运行时 `.ts` import。
- `dist/index.js` 具有可执行权限。

## 本地全局链接

```bash
bun run link:cli
memohub --version
memohub --help
```

如果全局链接指向其他路径，重新执行 `bun run link:cli` 即可刷新到当前 `dist/index.js`。

## 发布前检查

```bash
bun run check:release
```

发布前至少应确认：

- `bun run build:cli` 通过。
- `bun run verify:cli` 通过。
- `memohub --help` 显示当前命令集。
- `memohub mcp doctor` 通过，或使用 `MEMOHUB_MCP__LOG_PATH=/tmp/memohub-mcp.ndjson` 验证日志可写。
- `bun run skill:memohub` 已生成 `skills/memohub/SKILL.md`，且没有生成到本机 Agent 私有目录。

## 打包

```bash
cd apps/cli
npm pack
```

## 发布

```bash
cd apps/cli
npm publish --access public
```

发布前不要手工改 `dist` 路径或临时 symlink，必须走 `bun run build` 生成正式产物。

## Agent Skill

Skill 由根目录工程化脚本生成，不属于 CLI 包能力；产物只落在仓库根目录：

```bash
bun run skill:memohub
```

后续安装交给 `npx skills add <repo> --skill memohub`。Agent 读取该 skill 后会完成本地 CLI 构建/链接、配置检查、MCP 启动和工具发现。不要在构建脚本里直接写入 `.codex`、`.claude`、`.gemini` 等本机 Agent 私有目录。
