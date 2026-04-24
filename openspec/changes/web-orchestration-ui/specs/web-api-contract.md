# Web API 契约规格 (API Contract Spec)

## 1. 影子配置同步 (Memory-First Shadow Sync)
为了消除 IO 延迟，Web 端对 Flow 的编排优先作用于内核内存实例。

### Endpoint: `PUT /api/config/shadow`
- **Description**: 将前端编排的 Flow 实时推送到内核内存，实现“热生效”。
- **Payload**:
  ```json
  {
    "workspaceId": "default",
    "tracks": [ { "id": "track-insight", "flows": { ... } } ]
  }
  ```
- **Behavior**: 内核立即更新对应的 `FlowRegistry`，不触发 `fs.writeFile`。
- **Response**: `{ "success": true, "activeTraceId": "..." }`

### Endpoint: `POST /api/config/commit`
- **Description**: 将当前内存中的影子配置持久化到磁盘。
- **Behavior**: 触发物理 IO 写入 `config.jsonc`。

---

## 2. 跨空间总线 (Cross-Workspace Bus)
支持在一次请求中聚合多个 Workspace 的记忆。

### Endpoint: `POST /api/dispatch`
- **Payload**:
  ```json
  {
    "targetWorkspaces": ["project-a", "project-b"],
    "instruction": {
      "op": "RETRIEVE",
      "trackId": "track-insight",
      "payload": { "query": "..." }
    }
  }
  ```
- **Behavior**: 后端并行分发至多个 Kernel 实例，返回由 `builtin:aggregator` 融合后的结果。

---

## 3. 实时 Trace 推送 (WebSocket)
通过 WS 驱动前端的“脉冲动画”。

### Channel: `ws://localhost:3000/trace`
- **Event: `step-start`**:
  ```json
  {
    "type": "STEP_START",
    "traceId": "uuid-v4",
    "workspaceId": "project-a",
    "trackId": "track-insight",
    "step": "embedding",
    "timestamp": 123456789
  }
  ```
- **Event: `step-end`**: 携带执行结果与耗时。
- **Event: `flow-complete`**: 携带最终输出。

---

## 4. 元数据反射 (Metadata Inspection)
用于自动生成 UI 表单。

### Endpoint: `GET /api/inspect`
- **Response**: 返回所有已注册 Tool 的 `manifest`（含 Zod Schema 的 JSON 表达）。
- **Purpose**: 前端解析此 JSON 并动态渲染 Property Panel。
