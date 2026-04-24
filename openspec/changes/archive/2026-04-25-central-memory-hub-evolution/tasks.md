## 1. 常驻服务与单例管理 (Daemonization)

- [x] 1.1 实现 `DaemonManager`，处理进程锁定与 PID 文件
- [x] 1.2 增强 `memohub serve`：支持通过环境变量或配置切换 SSE/WebSocket Transport
- [x] 1.3 修改 CLI 入口：启动时探测 Daemon，若存在则自动切换为 RPC 转发模式
- [x] 1.4 实现基础的 `health-check` 和 `shutdown` 信号处理

## 2. 知识图谱与关联存储 (Graph-RAG)

- [x] 2.1 引入轻量级 `builtin:graph-store` 工具，支持三元组存取
- [x] 2.2 完善 `builtin:entity-linker` 工具，支持按规则提取关系
- [x] 2.3 修改 `track-wiki` 和 `track-insight` 默认流：增加实体图谱同步步骤
- [x] 2.4 实现 `builtin:graph-retriever`：支持从实体出发联想检索相关记忆

## 3. 主动治理与后台调度 (Self-Governance)

- [x] 3.1 实现 `GovernanceScheduler`：基于时间间隔触发的后台 Flow 调度器
- [x] 3.2 编写 `governance-rules.json`：定义什么时候触发去重、什么时候触发摘要
- [x] 3.3 实现“记忆衰减 (Decay)”逻辑：根据 `access_count` 自动降低陈旧记忆的检索权重
- [x] 3.4 集成 `trace` 系统：在 Daemon 日志中清晰展示后台治理任务的执行情况

## 4. 存储层分层与性能优化 (Performance)

- [x] 4.1 在 `IHostResources` 中注入 `MemoryCache`：缓存最近访问的 50 条向量记录
- [x] 4.2 优化 LanceDB 的批量索引更新策略，减少写入时的锁竞争
- [x] 4.3 完善 `memohub config --check`：增加对 Daemon 连接状态的检测
- [x] 4.4 最终发布前的压力测试：模拟 IDE + Hermes 同时高频写入 10 分钟无挂死
