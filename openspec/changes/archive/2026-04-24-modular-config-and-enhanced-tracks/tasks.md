## 1. 配置模块化实现 (Modular Config)

- [x] 1.1 修改 `@memohub/config` 中的 `ConfigLoader`，增加对 `conf.d/` 目录的扫描逻辑
- [x] 1.2 实现 `id` 敏感的列表合并算法，确保 `tracks` 和 `tools` 合并时无冲突
- [x] 1.3 增加 `ConfigLoader.watch()` (可选/占位)，为未来配置热更新打底
- [x] 1.4 更新 `memohub config --show` 以清晰标注配置来源文件

## 2. 检索流工具增强 (Retrieval Tools)

- [x] 2.1 实现 `builtin:retriever` 工具，封装向量检索逻辑
- [x] 2.2 实现 `builtin:reranker` 工具，对接 `AIHub` 的 `ranker` 接口
- [x] 2.3 实现 `builtin:aggregator` 工具，支持多轨道结果融合
- [x] 2.4 定义通用的 `search` Flow 模板，供全系统调用

## 3. 业务轨道深度补全 (Business Tracks)

- [x] 3.1 完成 `track-stream` 对话流流程定义：支持 `last_n` 检索和时序存储
- [x] 3.2 完成 `track-wiki` 百科流程定义：集成实体链接 (Entity Linking) 占位工具
- [x] 3.3 完善 `track-source` 流程：集成元数据提取，支持按语言过滤

## 4. 全链路场景验证 (Validation & Tests)

- [x] 4.1 建立 `tests/integration/flow-scenarios.test.ts`
- [x] 4.2 编写“对话上下文检索”场景测试用例
- [x] 4.3 编写“跨轨道统一检索”场景测试用例
- [x] 4.4 验证配置文件夹拆分后的加载正确性
- [x] 4.5 运行性能压力测试，验证 LanceDB 在 1k+ 记录下的检索耗时
