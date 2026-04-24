## Context

目前的 MemoHub 在处理高频并发请求或多客户端接入时，容易出现数据库竞争或配置不同步的情况。同时，简单的向量匹配无法应对“找回特定关系”的复杂查询。

## Goals / Non-Goals

**Goals:**
- **常驻服务化**: 提供一个稳定的单一事实来源（SSOT）服务进程。
- **关联记忆**: 从点状存储进化到网状存储。
- **自动化治理**: 变被动存储为主动整理。

**Non-Goals:**
- 不支持分布式的多节点集群同步（仍以单机个人中心为主）。
- 暂时不引入外部重型图数据库（如 Neo4j），使用嵌入式或内存图实现。

## Decisions

### D1: 基于 HTTP/SSE/WebSocket 的 Daemon 模式
`memohub serve` 将升级为真正的 Daemon：
- **单例锁**: 使用物理文件锁防止多个 Daemon 启动。
- **协议路由**: 
    - `/mcp`: 传统的 MCP JSON-RPC 接口。
    - `/inspect`: 供 Web 端使用的实时状态流。
    - `/client`: 供 CLI 使用的内部 RPC。

### D2: 实体关系模型 (ER Model)
内置的 `builtin:graph-store` 采用三元组结构：`(subject, predicate, object)`。
- 存储在 `~/.memohub/data/relations.db`。
- 每一个三元组关联到原始记忆的 `hash`。

### D3: 异步 Librarian 调度器
实现一个低优先级的后台循环：
1. 每隔 N 小时扫描一次 `track-insight`。
2. 对最近 100 条记录执行 `dedup` 和 `distill` Flow。
3. 如果发现两条记录语义冲突，生成一个 `CLARIFY` 指令存入 `track-stream`。

## Risks / Trade-offs

- **[风险] 内存占用**: 常驻进程和内存缓存会增加 100MB+ 的基础负载。
- **[复杂性] 实体冲突**: AI 提取的实体可能存在同名异义。缓解方案：在图存储中增加 `score` 权重。
