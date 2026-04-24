## 1. 数据模型与 Schema 对齐

- [x] 1.1 对齐 MCP Server 首次建表 seed：补齐 entities/hash/access_count/last_accessed 等字段，并确保数组字段使用非空示例以稳定类型推断
- [x] 1.2 补齐 MCP 写入入口：确保 memo_add（以及必要的 add_knowledge/add_code）写入 entities/hash 字段且不因抽取失败中断
- [x] 1.3 增加最小 schema 校验：在启动/打开表时检测关键列缺失并给出明确错误或迁移指引（避免 silent failure）

## 2. 实体抽取能力

- [x] 2.1 为 GBrain 写入新增轻量实体抽取：从文本中抽取驼峰词、带点标识符、版本号、缩写等作为 entities
- [x] 2.2 统一 ClawMem 实体抽取在 CLI/MCP 的行为：保证写入代码时 entities 至少包含顶层符号（可复用现有抽取逻辑）

## 3. 检索流水线（Pre / Exec / Post）

- [x] 3.1 定义检索流水线的 TypeScript 契约：PreResult / ExecResult / PostResult 与统一的返回引用字段结构
- [x] 3.2 实现 Pre 阶段：意图识别（code/knowledge/mixed）+ queryEntities 抽取 + token 化
- [x] 3.3 实现 Exec 阶段向量召回：按轨道并行 TopK（默认 5），输出候选池与用于统计的 TopK 子集
- [x] 3.4 实现 Exec 阶段词法通道（轻量）：基于 token overlap/关键字命中进行加权召回或重排（可配置开关）
- [x] 3.5 实现 High-level 实体扩展召回：TopK 高频 entities → 跨轨扩展候选（含硬上限与截断策略）
- [x] 3.6 为实体扩展加入兜底：实现 entity_index（派生索引）并在 DB 侧数组过滤不可用时自动切换
- [x] 3.7 实现 Post 阶段融合去重与排序：按 hash/id 去重，综合分（向量分 + 实体覆盖分 + 轨道权重 + 新鲜度可选）输出 TopN

## 4. MCP 工具统一与引用输出

- [x] 4.1 统一 MCP 检索入口：让 search_all/query_knowledge/search_code 复用同一条 memo_search 流水线（或改为调用统一内部函数）
- [x] 4.2 强制 citation-ready 输出：确保结果包含 trackId、id、text、timestamp，代码侧包含 file_path 且尽量包含 symbol_name，并在可用时包含 hash/entities

## 5. 测试与验证

- [x] 5.1 为实体抽取新增单测：覆盖 GBrain 文本抽取与 ClawMem 代码抽取的去重/上限/退化行为
- [x] 5.2 为双层跨轨检索新增测试：给定命中实体时可跨轨扩展召回，并验证硬上限与去重策略生效
- [x] 5.3 增加检索流水线排序测试：验证轨道权重与实体覆盖分对排序的影响符合预期

## 6. 文档与使用说明

- [ ] 6.1 更新项目文档：补充 entities/双层检索/引用字段约束与配置项说明（含默认值与降级策略）
