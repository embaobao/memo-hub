# 代码规则沉淀（累计）

## 反应式管道（Reactive Pipeline）落地约定

- 管道执行统一使用 `BasePipe` 串联 `PipelineStage`，并通过 `PipelineEventBus` 输出阶段级事件流，保证可观测、可回放。
- 轨道接入必须以 `TrackProvider` 适配器方式完成：核心引擎只依赖统一契约（MemoRecord/请求类型），不直接依赖 GBrain/ClawMem 的内部实现细节。
- 兼容性优先：新引擎与新类型默认不改变现有 CLI/MCP 对外行为，先作为内部基础设施逐步接入。

## Lint 配置约定（ESLint v9 + TypeScript）

- ESLint v9 默认使用 `eslint.config.js`（Flat Config），项目需要显式提供该文件，否则 `bun run lint` 会失败。
- 由于历史代码大量使用 `any`/未使用变量等模式，若当前阶段以“CI 通过”为优先，应在 `eslint.config.js` 中对这些规则做降级（例如关闭 `@typescript-eslint/no-explicit-any`、`@typescript-eslint/no-unused-vars`），待后续专项重构再逐步收紧。

## Bun 环境下的 Tree-sitter（AST 解析）约定

- Bun 下不建议直接依赖 native `tree-sitter`（NAPI）：在部分平台/版本组合中会触发 “缺少 prebuilds/*.node” 导致运行或测试失败。
- 优先使用 `web-tree-sitter`（WASM）做 AST 解析：跨 Bun/Node 更稳定，避免 native addon 的安装与运行差异。
- 语言语法建议复用 `tree-sitter-javascript` / `tree-sitter-typescript` 包内自带的 `.wasm` 文件，通过 `createRequire(import.meta.url).resolve(...)` 定位绝对路径，再用 `Language.load(Uint8Array)` 加载。
- 性能与稳定性：`Parser.init()` 与 `Language.load(...)` 必须做进程内缓存（Promise 缓存），避免每次写入都重复初始化 WASM。
- 可靠性兜底：AST 抽取失败（依赖缺失/解析异常）必须回退到正则抽取，保证写入链路不被阻断。

## CAS（灵肉分离）与 Hydration（回填）约定

- contentRef 统一使用逻辑引用 `sha256:<hash>`：不要把物理路径写入索引字段，便于迁移 CAS 根目录而不破坏引用稳定性。
- 落盘采用分片目录（如 `<root>/<hash前2位>/<hash>`）：避免单目录文件过多导致的性能与文件系统限制问题。
- 写入链路容错：CAS 属于增强能力，落盘失败不应阻塞写库（保持 CLI/MCP 对外行为兼容），但仍应返回可用的 hash/ref 供索引侧尽量补齐。
- LanceDB schema 兼容：新增字段（如 `content_ref`）写入时必须做“写入失败回退”策略（先尝试写新字段，失败则去掉新字段再写），避免老表未升级导致写入链路中断。
- LanceDB schema 兼容（通用化）：写入时优先按表 schema 白名单过滤字段；若运行期拿不到 schema，则根据错误信息提取未知字段并逐个剔除重试，保证 librarian ingest-git 等批量写入不被旧表 schema 阻断。
- Hydration 默认只在 `record.text` 为空时触发 CAS 读取：保证当前阶段不引入额外 I/O；当未来写入侧不再存 text 时，再通过开关控制是否回填原文。
- 索引重建入口默认 dry-run：重建可能涉及大量写入，命令行入口应默认只输出计划，显式开启 `--apply` 才执行写回。
- 配置兼容性：配置文件解析后必须做默认值归一化（深合并默认配置），避免用户仅写部分字段导致运行期缺字段；`cas` 允许缺省或显式写 `null` 表示关闭，避免“缺省即启用”带来不可控 I/O。

## GBrain 写入增强：轻量文本实体抽取（entities）

- 通用实体抽取以“工程语料 token”为主：驼峰词、带点标识符、版本号、缩写等，用于作为 entities（实体纽带）提升跨轨检索可联动性。
- 抽取器必须“可控”：支持开关与最大数量上限（写入侧保护阀），避免长文本/日志导致 entities 噪声爆炸与索引膨胀。
- 抽取结果必须“稳定”：按文本出现顺序输出并去重，保证同一输入多次写入的 entities 结果一致，便于去重/回放/测试。
- URL/哈希等高噪声 token 应做过滤或长度限制，防止把无意义的 host/hash 当实体纽带。

## 写入智能路由：责任链规则引擎（MemoContext Routing）

- 路由阶段应以“责任链”实现：规则按顺序执行，第一条命中即返回，避免复杂 if/else 扩散到业务层。
- 兼容性优先：当写入请求显式指定 `track` 时，路由阶段必须跳过推断（不改变既有调用方行为），但仍需产出可观测信息解释原因。
- 可观测信息约定：`route_track` 阶段把决策写入 `metadata.__pipeline.routing`（包含 track/rule/reason），并可通过 `PipelineEventBus` 的 `stage_success` 事件回放与调试。
- 配置覆盖策略：`routing.rules` 存在时视为“全量覆盖”；否则使用默认规则（file_suffix → clawmem；default → gbrain），并支持用 `routing.code_suffixes` 快速调整后缀集合。
- 环境变量覆盖（优先级最高）：`MEMOHUB_ROUTING_ENABLED`、`MEMOHUB_ROUTING_DEFAULT_TRACK`、`MEMOHUB_ROUTING_CODE_SUFFIXES`、`MEMOHUB_ROUTING_RULES(JSON)`。

## 检索管：混合召回（Vector + FTS）+ 装配 + Hydration

- 统一检索入参建议收敛为 `query + filters + hydrate`：旧的 `tracks` 可保留作兼容字段，但优先用 `filters.track/filters.tracks` 表达轨道过滤。
- Vector 召回必须是必选路径：每个 Provider 至少实现 `retrieve`，即使 FTS/其它召回策略不可用也不影响主流程。
- FTS 召回用“可选插槽”表达：Provider 通过可选的 `retrieveFTS` 暴露能力；底层依赖/索引不可用时必须吞掉异常并返回空数组。
- 多路结果装配要做“合并 + 去重 + 排序”：遇到重复（同 id 或 contentHash）时取更高 score，同时用另一侧补齐缺失字段（例如 vector 结果 text 为空可用 FTS 补齐）。
- Hydration 回填只在需要时触发：默认仅当 `record.text` 为空且携带 `contentRef` 才读取 CAS；当调用方显式 `hydrate=false` 时必须完全跳过回填。

## 治理管：冲突检测（Task8 最小闭环）

- 冲突事件统一用 `CONFLICT_PENDING`：事件体包含 `anchor`（锚点记录）与 `candidates`（候选冲突）以及阈值/策略信息，便于人类裁决。
- 队列持久化优先采用本地 NDJSON（追加写）：一行一个 JSON 对象，便于 `tail -f`/grep/流式消费，后续可平滑升级为真正队列。
- 兼容性优先：冲突检测与队列写入属于“增强能力”，任何落盘失败都不应中断管道主流程（吞错返回，保证 CLI/MCP 行为不被破坏）。
- 最小冲突检测先用可解释规则（例如 jaccard/contains）：阈值与策略必须可配置，避免不同语料场景下误报过多。
- 推荐环境变量配置入口：`MEMOHUB_CONFLICT_ENABLED`、`MEMOHUB_CONFLICT_THRESHOLD`、`MEMOHUB_CONFLICT_STRATEGY`、`MEMOHUB_CONFLICT_QUEUE_PATH`、`MEMOHUB_CONFLICT_MIN_TEXT_LENGTH`、`MEMOHUB_CONFLICT_MAX_CANDIDATES`。
- 裁决回流必须走写入管（闭环修正）：把 `conflict_id/action` 等追溯信息写入 `metadata.__governance`，便于后续审计/去重/重放。

## 自动化采集：Git Hooks + Librarian（Task9 骨架）

- Git Hook 必须“永不阻塞开发流程”：post-commit 中任何异常都要吞掉并返回 0，避免影响正常 commit。
- Hook 本身只负责触发，不直接承载复杂逻辑：把重逻辑放到 `mh librarian ingest-git`，便于测试、迭代与手动回放。
- 幂等应以“内容哈希”为粒度，而不是以“运行次数”为粒度：推荐对“单文件 diff 文本”计算 sha256，并以 `git:diff:<filePath>:sha256:<hash>` 作为幂等键。
- 幂等键存储推荐放在 `.git/memohub/` 下：天然按仓库隔离且不会被误提交；同时对 worktree 场景也兼容（gitDir 可能位于 `.git/worktrees/...`）。
- 大 diff 要有保护阀：提供 `maxFiles/maxDiffBytes` 限制，避免一次提交过大导致 Hook 阻塞；后续可演进为“摘要化/符号抽取/分片写入”策略。

## 对外接口对齐：MCP/CLI 的 MemoContext + Hydration（Task10）

- CLI 参数兼容建议做“argv 归一化”而非重复定义 option：把 `--filePath/--sessionId/--noHydrate` 等 camelCase 写法映射为 kebab-case，再交给 Commander 解析，避免 help 展示重复项且不破坏旧命令。
- Hydration 只在 `text` 为空时触发：对外默认开启但不额外引入 I/O（旧数据仍存 text），并提供 `--no-hydrate` 作为显式关闭开关，确保兼容性可控。
- LanceDB schema 增量字段必须“写入回退”：MCP 写入侧新增字段（如 `context_json`）时，先尝试全量写入，失败则逐步剔除新增字段（`content_ref/context_json`）再写，保证旧表不被破坏。
- e2e/集成测试避免 cosine(零向量) 边界：若 Embedder 在测试环境回退零向量，`vectorSearch(distanceType("cosine"))` 可能召回为空；建议在 Bun 测试内启动一个“假嵌入服务”返回固定非零向量，确保检索链路稳定可测。

## 回归执行与命令兼容性检查（Task11）

- 回归顺序建议固定为：`bun test` → `bun run build` → `bun run lint` → `cd mcp-server && bun run build`，优先用测试暴露行为回归，再做编译与静态检查。
- 做 CLI 回归时若本机未启动 Ollama/Embedding 服务，可把 `EMBEDDING_URL` 临时指向 `http://127.0.0.1:1/v1`：会快速 ConnectionRefused，避免默认 30s 超时拖慢回归节奏（仍能验证命令链路不崩溃）。
- CLI 命令参数要注意短旗标冲突：例如 `list-code` 的 `-l` 是 language 而不是 limit；限制条数应使用 `--limit <n>`，避免误判为“数据丢失”。
