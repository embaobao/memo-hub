[**Documentation**](../../../README.md)

***

# Class: InMemoryStructuredIndex

Defined in: memory-projection.ts:33

## Constructors

### Constructor

> **new InMemoryStructuredIndex**(): `InMemoryStructuredIndex`

#### Returns

`InMemoryStructuredIndex`

## Methods

### add()

> **add**(`entry`): `void`

Defined in: memory-projection.ts:36

#### Parameters

##### entry

[`StructuredIndexEntry`](../interfaces/StructuredIndexEntry.md)

#### Returns

`void`

***

### addMemoryObject()

> **addMemoryObject**(`memory`): `void`

Defined in: memory-projection.ts:40

#### Parameters

##### memory

[`MemoryObject`](../../protocol/interfaces/MemoryObject.md)

#### Returns

`void`

***

### list()

> **list**(): [`StructuredIndexEntry`](../interfaces/StructuredIndexEntry.md)[]

Defined in: memory-projection.ts:68

#### Returns

[`StructuredIndexEntry`](../interfaces/StructuredIndexEntry.md)[]

***

### queryBySource()

> **queryBySource**(`sourceId`): [`StructuredIndexEntry`](../interfaces/StructuredIndexEntry.md)[]

Defined in: memory-projection.ts:60

#### Parameters

##### sourceId

`string`

#### Returns

[`StructuredIndexEntry`](../interfaces/StructuredIndexEntry.md)[]

***

### queryByTarget()

> **queryByTarget**(`targetId`): [`StructuredIndexEntry`](../interfaces/StructuredIndexEntry.md)[]

Defined in: memory-projection.ts:64

#### Parameters

##### targetId

`string`

#### Returns

[`StructuredIndexEntry`](../interfaces/StructuredIndexEntry.md)[]
