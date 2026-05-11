<p align="center">
  <img src="assets/memohub-logo.svg" alt="MemoHub - Unified Memory for AI" width="360" />
</p>

# MemoHub 文档中心

最后更新：2026-05-06

MemoHub 是面向多 AI 场景的统一记忆中枢，用于整合 Agent 记忆、项目知识、代码上下文、任务脉络和外部工具写入数据。

它帮助你把 AI 使用过程中最有价值的东西沉淀为自己的资产：私有代码记忆、Hermes 长期习惯、多 Agent 协同上下文、项目决策和可回溯任务脉络。

## English Overview

MemoHub is a unified memory hub for AI workflows. It keeps Agent memories, private code context, project knowledge, task history, and external tool writes in one local, queryable center.

Use it when you want your AI memory to belong to you: Hermes can remember durable habits, Codex can inherit project and coding context, IDE tools can contribute private repository knowledge, and multiple Agents can share the same scoped memory layers.

## 真实场景

- 私有代码记忆资产：把私有仓库的文件、组件、API、依赖和项目习惯沉淀为 `coding_context`，形成你自己的代码 context layer。
- Hermes 永久记忆：查询 Hermes 的习惯、偏好、近期任务和历史操作，不再依赖单次对话上下文。
- 多 Agent 协同：Codex、Gemini、Hermes、IDE 插件共享同一项目记忆，切换工具时仍能继承上下文。
- Agent 记忆回溯：按 Agent、项目、会话或任务追问“最近做了什么”“为什么这么设计”“之前确认过什么”。
- 澄清闭环：用户在对话中修正记忆后，写回 curated memory，后续查询自动采用新的事实。

## 快速开始

- [GitHub README](https://github.com/embaobao/memo-hub/blob/main/README.md)
- [中文 README](https://github.com/embaobao/memo-hub/blob/main/README_CN.md)
- [快速开始](guides/quickstart.md)
- [配置指南](guides/configuration.md)
- [接入前检查清单](integration/preflight-checklist.md)
- [AI 协作入口](https://github.com/embaobao/memo-hub/blob/main/AGENTS.md)
- [Changelog](CHANGELOG.md)
- GitHub Pages 发布源：`docs/`，由 `.github/workflows/pages.yml` 自动生成并发布。

## 集成文档

- [集成指南首页](integration/index.md)
- [CLI 集成](integration/cli-integration.md)
- [MCP 集成](integration/mcp-integration.md)
- [Hermes Plugin 接入](integration/hermes-guide.md)
- [Hermes 验证报告](integration/hermes-validation-report.md)
- [接入场景验证](integration/access-scenarios.md)
- [Agent Skill](https://github.com/embaobao/memo-hub/blob/main/skills/memohub/SKILL.md)
- [API 参考](api/reference.md)

## 架构文档

- [架构概览](architecture/overview.md)
- [新架构业务链路](architecture/business-workflows.md)
- [检索流水线](architecture/retrieval-pipeline.md)
- [Text2Mem 协议](architecture/text2mem-protocol.md)

## 开发文档

- [项目结构](development/project-structure.md)
- [工程化底座](development/engineering-foundation.md)
- [CLI 构建发布](development/cli-publishing.md)
- [当前状态](development/current-status.md)
- [贡献指南](development/contributing.md)

## 授权协议

MemoHub 开放源码供学习、研究、个人使用和其他非商业用途使用。商业使用需提前获得版权持有人的书面授权。

完整条款见 [GitHub LICENSE](https://github.com/embaobao/memo-hub/blob/main/LICENSE)。

## 生成文档

- [生成文档首页](generated/README.md)
- [CLI Reference](generated/cli-reference.md)
- [MCP Reference](generated/mcp-reference.md)
- [Package Index](generated/package-index.md)
- [OpenSpec Index](generated/openspec-index.md)

## 文档维护规则

- 业务文档只放在 `docs/` 下，不再维护根目录 `guides/`。
- 变更日志只维护 `docs/CHANGELOG.md`，根目录不保留 `CHANGELOG.md` 副本。
- AI 工具协作文档只维护根目录 `AGENTS.md`，`AGENT.md`、`CLAUDE.md`、`GEMINI.md`、`CODEX.md`、`TRAE.md` 都必须是软链接。
- CLI/MCP 命令和工具变更必须先更新 `apps/cli/src/interface-metadata.ts`，再运行 `bun run docs:generate`。
- 接入前必须跑 `bun run docs:check` 验证生成文档和链接。
