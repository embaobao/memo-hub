# Tasks

- [x] 1. 基线确权：梳理现有双轨写入/检索与对外契约
  - [x] 1.1 定位 GBrain/ClawMem 写入与检索的调用链、schema 初始化方式与去重策略
  - [x] 1.2 定位 MCP Server 与 CLI 的入参/出参契约（现有命令与工具列表）
  - [x] 1.3 定位现有 AST/代码元数据能力与依赖（是否已引入 Tree-sitter、现有 ast_type/symbol 字段）

- [x] 2. 落地核心契约与引擎骨架（Engine as a Pipe）
  - [x] 2.1 定义 `MemoContext` / `MemoRecord` / `TrackProvider` / `PipelineStage` 的 TypeScript 类型与最小接口
  - [x] 2.2 建立三条管道骨架：IngestionPipe / RetrievalPipe / GovernancePipe（先做可插拔阶段与事件流，不改业务逻辑）
  - [x] 2.3 将现有 GBrain/ClawMem 以 Provider 适配器方式接入管道（保证功能不退化）

- [x] 3. 落地“灵肉分离”CAS（Flesh）与索引引用（Spirit）
  - [x] 3.1 增加 CAS 存储模块：写入 text → sha256 → 以 hash 命名落盘（根目录可配置）
  - [x] 3.2 增加 Hydration 模块：根据 contentRef 回填原文（缺失/损坏兜底策略明确）
  - [x] 3.3 写入管接入 CAS：索引记录保存 contentHash/contentRef，原文不再强依赖存于索引
  - [x] 3.4 增加索引重建入口（骨架）：从“已知内容清单/遍历 CAS”重建索引的最小流程

- [x] 4. 写入增强：轻量实体抽取（entities）
  - [x] 4.1 实现实体抽取器：驼峰词、带点标识符、版本号、缩写（可配置开关与最大数量）
  - [x] 4.2 写入阶段将 entities 落到索引记录（兼容旧记录 entities 为空）
  - [x] 4.3 为抽取器补充单测：覆盖典型工程语料与边界输入

- [x] 5. 写入增强：AST 解析（Tree-sitter，重点能力）
  - [x] 5.1 确认项目依赖与接入方式：Tree-sitter 是否已存在；若不存在，按项目约束引入并封装最小解析能力
  - [x] 5.2 针对代码轨写入：提取函数/类/接口/导出符号等 AST 语义实体，落库到索引元数据（含符号名、类型、语言、filePath、片段范围）
  - [x] 5.3 为 AST 提取补充单测：至少覆盖 TypeScript/JavaScript 的符号提取与边界输入

- [x] 6. 智能路由：基于 MemoContext 的规则引擎（责任链）
  - [x] 6.1 定义规则结构与默认规则：按 filePath 后缀路由到 ClawMem；其余默认 GBrain（可覆盖）
  - [x] 6.2 支持用户配置路由规则（配置读取与校验：环境变量 > YAML > 默认值）
  - [x] 6.3 在写入管中接入路由阶段，并记录阶段级可观测信息（用于调试/回放）

- [x] 7. 检索管：混合召回（Vector + FTS）+ Hydration + 装配
  - [x] 7.1 统一检索入参：query + filters（track/category/language/tags/scope 等）+ hydration 开关
  - [x] 7.2 保持 Vector 召回为必选；实现 FTS 召回（依赖可用则开启，否则保留插槽并默认关闭）
  - [x] 7.3 实现结果装配：多路合并、去重、排序、可选回填原文

- [x] 8. 治理管：冲突检测 + 澄清闸门（最小闭环）
  - [x] 8.1 定义冲突模型与事件：`CONFLICT_PENDING`（包含候选冲突、锚点、需要人类裁决的信息）
  - [x] 8.2 实现最小冲突检测规则（可配置阈值/策略），并将事件写入可持久化队列或存储（便于后续 Agent 订阅）
  - [x] 8.3 提供裁决回流入口：裁决结果重新进入写入管，形成闭环修正

- [x] 9. 自动化采集：Git Hooks + 会话蒸馏（骨架）
  - [x] 9.1 Git post-commit Hook：捕捉增量变更并触发写入管（内容哈希幂等）
  - [x] 9.2 Librarian 后台任务骨架：扫描对话/日志并蒸馏为原子事实写入 GBrain（先提供可运行入口与最小占位实现）

- [x] 10. 对外接口对齐：MCP Server 与 CLI 兼容升级
  - [x] 10.1 MCP：写入/检索支持 MemoContext 透传与 hydration 返回（默认行为与旧版一致）
  - [x] 10.2 CLI：在不破坏原命令的前提下，新增可选参数（如 --filePath/--project/--sessionId/--no-hydrate）
  - [x] 10.3 增加关键路径集成测试/端到端脚本（基于 Bun 测试框架）

- [x] 11. 验证与回归
  - [x] 11.1 `bun test` 全量通过，新增测试覆盖：CAS/实体抽取/AST 解析/检索 hydration
  - [x] 11.2 `bun run build` 通过
  - [x] 11.3 对比验证：旧数据可读、旧命令可用、无破坏性行为变更

# Task Dependencies

- Task 3-6 依赖 Task 2
- Task 7 依赖 Task 3 与 Task 2
- Task 8 依赖 Task 2（事件模型）并可与 Task 7 并行
- Task 9 依赖 Task 2 与 Task 6
- Task 10 依赖 Task 7（检索/写入对齐）
- Task 11 依赖 Task 3-10
