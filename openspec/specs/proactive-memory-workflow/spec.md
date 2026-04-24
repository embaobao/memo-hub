# Hermes Agent 集成 - 主动记忆流 (Proactive Memory Workflow)

## Why
目前 Agent 对记忆系统的使用仅限于被动的检索（RETRIEVE）和显式的工具调用（ADD）。为了让 Hermes 真正具备“数字分身”的能力，记忆系统需要在后台主动运作：监听流式对话，提纯事实，并能在会话初始化时主动向 Agent 注入相关背景上下文，降低首轮交互延迟，提升“懂我”体验。

## What Changes
1. **流式记录 (Stream Track)**: 所有通过 MCP/CLI 与 Agent 的对话历史自动双写到 `track-stream`。
2. **后台蒸馏 (Librarian Daemon)**: `Librarian` 作为守护进程（`memohub daemon`），定期扫描未蒸馏的 `track-stream` 数据。
3. **逻辑沉淀 (Distill to Insight)**: 将长对话总结为事实（Facts）、偏好（Preferences），写入 `track-insight`。
4. **冲突检测**: 提纯的知识若与已有 `track-insight` 或 `track-wiki` 冲突，触发 `CLARIFY` 状态，待 Agent/User 确认。
5. **背景预热 (Context Injection)**: Agent 开启新 Session 时，通过统一接口拉取该用户的最新 Insight/Wiki 摘要作为 System Prompt 背景。

## Capabilities
### New Capabilities
- `memohub daemon`: 提供独立的守护进程命令，接管所有定时与异步记忆治理任务。
- `track-stream.distill`: 自动基于 LLM (`completer`) 将原始对话提炼为结构化记录。

## Impact
- **性能**: Daemon 与主查询进程分离，不影响实时对话延迟。
- **配置**: 需要在 `config.jsonc` 中配置 LLM 的 `summarizer` 角色，且需常驻运行。
- **架构**: 完善了 V1 “多轨道动态矩阵” 的流转闭环（Stream -> Insight -> Wiki）。
