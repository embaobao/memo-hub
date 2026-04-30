## 1. I18n Auto Resolution

- [x] 1.1 明确 `system.lang` 只支持 `zh`、`en`、`auto`，补齐配置文档和校验说明。
- [x] 1.2 修复 CLI `auto` 语言解析优先级，支持 macOS 系统语言探测并在无法判断时默认中文。
- [x] 1.3 增加 `lang auto` 的单元测试或集成测试覆盖，验证 `C.UTF-8` 环境下不会错误锁定英文。

## 2. Hermes Self-governance

- [x] 2.1 收口渠道治理选择器，支持按 `actor/source/project/purpose/status` 选择渠道集合，而不是只依赖 `channelId`。
- [x] 2.2 采用方案 B，一次性把 channel registry、CLI、MCP、session context 和治理选择器改成 `actor-first` 内外统一模型，不保留 `ownerAgentId`、`--agent` 等兼容层。
- [x] 2.3 明确 Hermes 的主渠道、测试渠道和近期渠道展示输出，支持快速查看“我有哪些渠道、哪个是主渠道、哪个最近活跃”。
- [x] 2.4 更新 CLI 帮助顺序和文档描述，明确 MemoHub 是 Hermes 可自治理的记忆中心，而不是纯存储工具。

## 3. Test-channel Convention

- [x] 3.1 固化测试写入使用 `purpose=test` 的标准约定。
- [x] 3.2 支持针对 `actor + purpose=test` 与 `project + purpose=test` 的 dry-run / clean 治理入口。
- [x] 3.3 明确写入必须显式挂载渠道或继承当前绑定渠道。
- [x] 3.4 保留 `rebuild-schema` 统一接口，但不引入旧向量库兼容逻辑。

## 4. Hermes Onboarding Closure

- [x] 4.1 更新 Hermes 接入文档、skill 和 `memohub://tools` 指引，固化首次接入标准链路。
- [ ] 4.2 验证 Hermes 的真实链路：查看渠道 -> 恢复主渠道 -> 写入 -> 查询 -> 日志 -> 测试渠道 dry-run。
- [ ] 4.3 梳理当前阻塞项与后续适配层边界，明确旧存量数据/外部接入留给 adapter 层处理。

## 5. Docs And Verification

- [x] 5.1 更新 `README`、`AGENTS.md`、Hermes 接入文档、配置文档中的语言与治理说明，并统一替换旧渠道治理术语。
- [x] 5.2 运行 `bun run docs:generate`、`bun run docs:check`、相关测试和 `bun run build:cli`。
