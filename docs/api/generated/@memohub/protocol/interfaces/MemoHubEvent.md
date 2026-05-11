[**Documentation**](../../../README.md)

***

# Interface: MemoHubEvent

Defined in: [packages/protocol/src/event.ts:98](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/protocol/src/event.ts#L98)

MemoHub 事件包

外部系统发送给 Integration Hub 的标准事件格式

## Properties

### channel

> **channel**: `string`

Defined in: [packages/protocol/src/event.ts:113](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/protocol/src/event.ts#L113)

频道标识（如 "hermes-memory-center"）

***

### confidence

> **confidence**: [`EventConfidence`](../enumerations/EventConfidence.md)

Defined in: [packages/protocol/src/event.ts:152](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/protocol/src/event.ts#L152)

置信度级别

***

### entityRefs?

> `optional` **entityRefs?**: `object`[]

Defined in: [packages/protocol/src/event.ts:143](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/protocol/src/event.ts#L143)

可选：实体引用

#### id

> **id**: `string`

#### name?

> `optional` **name?**: `string`

#### type

> **type**: `string`

***

### id?

> `optional` **id?**: `string`

Defined in: [packages/protocol/src/event.ts:103](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/protocol/src/event.ts#L103)

可选：客户端提供的事件 ID
如果未提供，Integration Hub 将自动生成

***

### kind

> **kind**: [`MEMORY`](../enumerations/EventKind.md#memory)

Defined in: [packages/protocol/src/event.ts:118](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/protocol/src/event.ts#L118)

事件类型

***

### occurredAt?

> `optional` **occurredAt?**: `string`

Defined in: [packages/protocol/src/event.ts:158](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/protocol/src/event.ts#L158)

可选：发生时间（ISO 8601）
如果未提供，Integration Hub 将使用当前时间

***

### payload

> **payload**: [`EventPayload`](../type-aliases/EventPayload.md)

Defined in: [packages/protocol/src/event.ts:163](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/protocol/src/event.ts#L163)

事件负载

***

### projectId

> **projectId**: `string`

Defined in: [packages/protocol/src/event.ts:123](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/protocol/src/event.ts#L123)

项目 ID

***

### repo?

> `optional` **repo?**: `string`

Defined in: [packages/protocol/src/event.ts:138](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/protocol/src/event.ts#L138)

可选：仓库信息

***

### sessionId?

> `optional` **sessionId?**: `string`

Defined in: [packages/protocol/src/event.ts:128](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/protocol/src/event.ts#L128)

可选：会话 ID

***

### source

> **source**: [`EventSource`](../enumerations/EventSource.md)

Defined in: [packages/protocol/src/event.ts:108](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/protocol/src/event.ts#L108)

事件源

***

### taskId?

> `optional` **taskId?**: `string`

Defined in: [packages/protocol/src/event.ts:133](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/protocol/src/event.ts#L133)

可选：任务 ID
