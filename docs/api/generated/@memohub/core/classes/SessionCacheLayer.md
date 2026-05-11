[**Documentation**](../../../README.md)

***

# Class: SessionCacheLayer

Defined in: [packages/core/src/session-cache.ts:5](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/core/src/session-cache.ts#L5)

## Constructors

### Constructor

> **new SessionCacheLayer**(`maxSize?`): `SessionCacheLayer`

Defined in: [packages/core/src/session-cache.ts:8](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/core/src/session-cache.ts#L8)

#### Parameters

##### maxSize?

`number` = `100`

#### Returns

`SessionCacheLayer`

## Methods

### clear()

> **clear**(): `void`

Defined in: [packages/core/src/session-cache.ts:28](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/core/src/session-cache.ts#L28)

#### Returns

`void`

***

### delete()

> **delete**(`id`): `void`

Defined in: [packages/core/src/session-cache.ts:24](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/core/src/session-cache.ts#L24)

#### Parameters

##### id

`string`

#### Returns

`void`

***

### get()

> **get**(`id`): [`VectorRecord`](../../storage-soul/interfaces/VectorRecord.md) \| `undefined`

Defined in: [packages/core/src/session-cache.ts:16](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/core/src/session-cache.ts#L16)

#### Parameters

##### id

`string`

#### Returns

[`VectorRecord`](../../storage-soul/interfaces/VectorRecord.md) \| `undefined`

***

### set()

> **set**(`id`, `record`): `void`

Defined in: [packages/core/src/session-cache.ts:20](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/core/src/session-cache.ts#L20)

#### Parameters

##### id

`string`

##### record

[`VectorRecord`](../../storage-soul/interfaces/VectorRecord.md)

#### Returns

`void`
