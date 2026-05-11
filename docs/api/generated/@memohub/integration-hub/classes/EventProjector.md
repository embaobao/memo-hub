[**Documentation**](../../../README.md)

***

# Class: EventProjector

Defined in: [projector.ts:25](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/integration-hub/src/projector.ts#L25)

事件投影器

负责将 MemoHubEvent 转换为 Text2Mem 指令

## Constructors

### Constructor

> **new EventProjector**(): `EventProjector`

#### Returns

`EventProjector`

## Methods

### projectEvent()

> **projectEvent**(`event`, `contentHash?`): `Promise`\<`any`\>

Defined in: [projector.ts:80](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/integration-hub/src/projector.ts#L80)

投影事件（未来扩展）

#### Parameters

##### event

[`MemoHubEvent`](../../protocol/interfaces/MemoHubEvent.md)

##### contentHash?

`string`

#### Returns

`Promise`\<`any`\>

***

### projectMemoryEvent()

> **projectMemoryEvent**(`event`, `contentHash?`): `Promise`\<`any`\>

Defined in: [projector.ts:29](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/integration-hub/src/projector.ts#L29)

投影 memory 事件到 Text2Mem 指令

#### Parameters

##### event

[`MemoHubEvent`](../../protocol/interfaces/MemoHubEvent.md)

##### contentHash?

`string`

#### Returns

`Promise`\<`any`\>
