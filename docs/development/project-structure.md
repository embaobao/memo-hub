# MemoHub 项目结构

最后更新：2026-05-11

MemoHub 当前的工程组织围绕新主链路展开：

```text
Connector -> Channel -> Memory
```

## 目录

```text
memohub/
├── apps/
│   └── cli/                         # CLI Connector + MCP Connector 当前工程位置，包含 Hermes 安装入口与打包资产
├── connectors/
│   └── hermes/                      # Hermes 官方 memory provider plugin（Python + uv）
├── packages/
│   ├── channel/                     # Channel registry、默认字段、治理类型
│   ├── memory/                      # Memory service、Hermes 读写闭环、统一运行时导出
│   ├── protocol/                    # CanonicalMemoryEvent、MemoryObject、ClarificationItem
│   ├── integration-hub/             # Memory 内部事件归一/投影实现细节
│   ├── core/                        # Query planner、agent operations 等内部能力
│   ├── ai-provider/                 # Embedding / chat provider 适配
│   ├── storage-flesh/               # CAS 内容存储
│   ├── storage-soul/                # 向量索引
│   └── librarian/                   # 检索与治理流水线
├── scripts/
│   ├── engineering/                 # 根目录工程脚本
│   └── git-hooks/                   # Git hook 脚本
├── skills/memohub/                  # 根目录 skill 安装源
├── test/                            # 跨包场景测试与验证脚本
├── docs/                            # 唯一业务文档入口
├── AGENTS.md                        # 唯一 AI 协作入口
└── openspec/                        # 提案、设计、任务、规格
```

## 职责边界

### `apps/cli`

- 当前保留 CLI 与 MCP 的构建、发布和全局链接位置。
- 负责 `memohub hermes install|doctor|uninstall`、`data status/clean/rebuild-schema` 等正式接入入口。
- `assets/hermes/` 打包 Hermes 官方 plugin 发布资产。
- 不再维护 Channel/Memory 的业务实现，只消费 `@memohub/channel` 和 `@memohub/memory`。
- 对外定位是 Connector，不是业务核心层。

### `connectors/hermes`

- 使用 Python + uv 管理 Hermes 官方 memory provider plugin。
- 源码目录对齐官方插件结构：`plugins/memory/memohub/`。
- 不维护独立数据源。
- 通过 MemoHub CLI 访问同一套 Channel/Memory 能力。

### `packages/channel`

- 只负责 channel registry、默认生成规则和治理过滤。
- 不保存记忆正文。

### `packages/memory`

- 统一暴露 Memory service、Hermes 预取/提取、列表概览和共享运行时。
- 是 CLI、MCP、Hermes Connector 的共同业务入口。

### `packages/integration-hub`

- 仅作为 Memory 内部的事件归一和投影实现细节存在。
- 不再作为对外架构层或接入层概念出现在产品文档、命令或工具描述中。

## 构建与验证命令

根目录聚合命令：

```bash
bun run build
bun run build:cli
bun run verify:cli
bun run connector:hermes:check
bun run skill:memohub
bun run docs:generate
bun run docs:check
bun run docs:site
bun run check:release
```

Hermes Connector 工程命令：

```bash
bun run connector:hermes:sync
bun run connector:hermes:lint
bun run connector:hermes:test
bun run connector:hermes:check
```

## 测试目录规则

测试代码必须收敛到这些目录：

```text
apps/cli/test/
packages/*/test/
connectors/hermes/test/
test/
```

禁止把测试散落回 `src/`。统一使用：

```bash
bun run check:test-layout
```
