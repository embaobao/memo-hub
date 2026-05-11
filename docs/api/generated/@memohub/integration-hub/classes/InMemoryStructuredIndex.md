[**Documentation**](../../../README.md)

***

# Class: InMemoryStructuredIndex

Defined in: [memory-projection.ts:34](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/integration-hub/src/memory-projection.ts#L34)

## Constructors

### Constructor

> **new InMemoryStructuredIndex**(): `InMemoryStructuredIndex`

#### Returns

`InMemoryStructuredIndex`

## Methods

### add()

> **add**(`entry`): `void`

Defined in: [memory-projection.ts:37](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/integration-hub/src/memory-projection.ts#L37)

#### Parameters

##### entry

[`StructuredIndexEntry`](../interfaces/StructuredIndexEntry.md)

#### Returns

`void`

***

### addMemoryObject()

> **addMemoryObject**(`memory`): `void`

Defined in: [memory-projection.ts:41](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/integration-hub/src/memory-projection.ts#L41)

#### Parameters

##### memory

[`MemoryObject`](../../protocol/interfaces/MemoryObject.md)

#### Returns

`void`

***

### list()

> **list**(): [`StructuredIndexEntry`](../interfaces/StructuredIndexEntry.md)[]

Defined in: [memory-projection.ts:69](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/integration-hub/src/memory-projection.ts#L69)

#### Returns

[`StructuredIndexEntry`](../interfaces/StructuredIndexEntry.md)[]

***

### queryBySource()

> **queryBySource**(`sourceId`): [`StructuredIndexEntry`](../interfaces/StructuredIndexEntry.md)[]

Defined in: [memory-projection.ts:61](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/integration-hub/src/memory-projection.ts#L61)

#### Parameters

##### sourceId

`string`

#### Returns

[`StructuredIndexEntry`](../interfaces/StructuredIndexEntry.md)[]

***

### queryByTarget()

> **queryByTarget**(`targetId`): [`StructuredIndexEntry`](../interfaces/StructuredIndexEntry.md)[]

Defined in: [memory-projection.ts:65](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/integration-hub/src/memory-projection.ts#L65)

#### Parameters

##### targetId

`string`

#### Returns

[`StructuredIndexEntry`](../interfaces/StructuredIndexEntry.md)[]
