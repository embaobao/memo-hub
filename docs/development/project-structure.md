# MemoHub 项目结构

最后更新：2026-04-29

MemoHub 使用 Bun Workspace Monorepo。当前对外架构以统一记忆运行时为中心，CLI 和 MCP 是统一入口。

## 目录

```text
memohub/
├── apps/
│   └── cli/                         # CLI + MCP Server
├── packages/
│   ├── protocol/                    # CanonicalMemoryEvent、MemoryObject、治理类型
│   ├── core/                        # Kernel、工具注册、查询规划
│   ├── integration-hub/             # 外部事件归一和投影
│   ├── ai-provider/                 # AI Provider 适配
│   ├── storage-flesh/               # CAS 内容存储
│   ├── storage-soul/                # 向量索引
│   └── librarian/                   # 检索与治理流水线
├── tracks/                          # 过渡期内部处理切片，不是对外产品概念
├── scripts/engineering/             # 根目录工程化脚本
├── skills/memohub/                  # npx skills 安装源
├── test/                            # 跨包测试、E2E、基准测试
├── docs/                            # 业务、架构、接入、开发文档唯一入口
├── AGENTS.md                        # AI 协作唯一内容源
├── AGENT.md / CLAUDE.md / GEMINI.md # 指向 AGENTS.md 的入口软链接
├── CODEX.md / TRAE.md               # 指向 AGENTS.md 的入口软链接
└── openspec/                        # 提案和规格维护
```

根目录不再维护独立 `guides/`。所有业务文档必须放在 `docs/` 下。
AI 协作文档只维护 `AGENTS.md`，其他工具入口必须用软链接指向它。

## 依赖方向

```text
apps/cli
  -> packages/integration-hub
  -> packages/core
  -> packages/protocol
```

规则：

- `apps/cli` 暴露 CLI/MCP，并通过统一运行时进入业务链路。
- `packages/protocol` 只放协议和类型，不依赖具体运行时。
- `packages/core` 不依赖具体内置工具实现。
- `scripts/engineering` 负责仓库级工程能力，例如生成文档和根目录 skill。
- `tracks/*` 仅作为过渡期内部切片存在，不作为新功能入口。

## 构建命令

根目录聚合命令：

```bash
bun run build
bun run build:cli
bun run verify:cli
bun run skill:memohub
bun run docs:generate
bun run docs:check
```

CLI 包内命令：

```bash
cd apps/cli
bun run build
bun run verify:bin
bun run link:global
```

## 测试目录

测试必须放在 `test/` 或各包的 `test/` 目录下，不允许散落在 `src/`：

```text
apps/cli/test/
packages/*/test/
tracks/*/test/
test/
```

验证：

```bash
bun run check:test-layout
bun run test
```
