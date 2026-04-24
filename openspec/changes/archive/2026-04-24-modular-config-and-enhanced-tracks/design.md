## Context

目前 MemoHub 已具备 Flow 引擎，但配置是单体的。随着 Tool 和 Track 的增加，单个 JSON 文件将达到数千行，极其不利于手动编辑。同时，检索目前仅依赖简单的向量搜索，缺乏业务层的精细化处理。

## Goals / Non-Goals

**Goals:**
- **配置解耦**: 实现类似 Nginx `include conf.d/*.conf` 的机制。
- **检索增强**: 在流程中支持“检索 -> 过滤 -> 重排 -> 聚合”的复杂链路。
- **业务闭环**: `track-stream` 和 `track-wiki` 达到生产可用。
- **质量保障**: 引入自动化 E2E 测试。

**Non-Goals:**
- 不涉及数据库的水平扩展。
- 暂不实现基于权限的配置过滤。

## Decisions

### D1: 模块化加载目录结构
- `~/.memohub/memohub.json`: 主配置（包含 system, ai 等全局项）。
- `~/.memohub/conf.d/tracks/`: 存放每个轨道的独立 JSONC 文件。
- `~/.memohub/conf.d/tools/`: 存放第三方工具的 Manifest 引用。
- `~/.memohub/conf.d/agents/`: 存放特定 Agent 的详细配置。

**加载算法**:
1. 加载 `memohub.json`。
2. 扫描 `conf.d/` 下的子目录。
3. 递归合并数组和对象（数组按 ID 去重合并，对象深度合并）。

### D2: 检索流工具化
新增以下内置原子工具：
- `builtin:retriever`: 基础向量检索，支持 `filter` 参数。
- `builtin:reranker`: 调用 AIHub 提供的 `ranker` 角色进行二次打分。
- `builtin:aggregator`: 将多轨检索结果按时间或相关性合并。

### D3: E2E 测试框架
使用 `bun test` 配合临时目录环境。测试流程：
1. `ConfigLoader.initDefault(tmp_dir)`
2. 执行 `kernel.dispatch({op: ADD, ...})`
3. 验证 Trace 日志。
4. 执行 `kernel.dispatch({op: RETRIEVE, ...})`
5. 验证返回结果。

## Risks / Trade-offs

- **[风险] 配置合并冲突** → 缓解：规定以 ID 为唯一标识，主配置文件优先级最高，冲突时抛出警告。
- **[性能] 多文件读取** → 缓解：由于配置仅在启动或 `inspect` 时读取，几十个文件的 IO 开销微秒级。
