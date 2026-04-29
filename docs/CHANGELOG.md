# Changelog

本文件记录对试用和接入有影响的变更。详细开发过程以 OpenSpec 提案和 Git 历史为准，避免在变更日志中重复维护长篇实现细节。

## 2026-04-29

### Added

- 建立统一记忆中枢对外口径：CLI 和 MCP 作为唯一正式接入入口。
- 新增统一记忆运行时链路：`CanonicalMemoryEvent -> MemoryObject -> ContextView`。
- 新增 MCP 配置工具：`memohub_config_get`、`memohub_config_set`、`memohub_config_manage`。
- 新增根目录 Agent Skill 安装源：`skills/memohub/SKILL.md`。
- 新增 `configVersion: "unified-memory-1"`，用于后续配置迁移和诊断。
- 新增工程化脚本：文档生成、文档检查、测试目录检查、依赖边界检查、release check。

### Changed

- AI 协作入口收敛为单一 `AGENTS.md`，`AGENT.md`、`CLAUDE.md`、`GEMINI.md`、`CODEX.md`、`TRAE.md` 均为软链接。
- 业务文档收敛到 `docs/`，根目录不再维护独立 `guides/`。
- `skill:memohub` 改为根目录工程化命令，不再集成到 CLI 包命令中。
- CLI 默认输出改为人类可读摘要，保留 `--json` 作为机器输出。
- 配置系统接入新架构运行时，CLI/MCP 共享同一份解析配置。

### Removed

- 移除未实现的 MCP 工具口径和重复接口说明。
- 移除未实现的 CLI 文档入口，例如 `add-code`、`search-code`、`search-all`。
- 移除根目录安装脚本、迁移脚本、备份/cron 脚本和 Web 验证材料。
- 移除 Web 方向归档代码，避免作为当前业务链路干扰接入判断。

### Verification

- `bun run build:cli`
- `bun run docs:generate`
- `bun run docs:check`
- `bun run check:test-layout`
- `memohub config`
- `memohub mcp-tools`
- `memohub mcp-status`
