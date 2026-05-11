[**Documentation**](../../../README.md)

***

# Class: CacheManager

Defined in: [packages/core/src/cache.ts:6](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/core/src/cache.ts#L6)

## Constructors

### Constructor

> **new CacheManager**(`root`): `CacheManager`

Defined in: [packages/core/src/cache.ts:9](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/core/src/cache.ts#L9)

#### Parameters

##### root

`string`

#### Returns

`CacheManager`

## Methods

### clear()

> **clear**(): `void`

Defined in: [packages/core/src/cache.ts:57](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/core/src/cache.ts#L57)

Clear all cache.

#### Returns

`void`

***

### generateKey()

> **generateKey**(`toolId`, `input`, `agentContext?`): `string`

Defined in: [packages/core/src/cache.ts:19](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/core/src/cache.ts#L19)

Generate a cache key based on tool id and inputs.

#### Parameters

##### toolId

`string`

##### input

`any`

##### agentContext?

`any` = `{}`

#### Returns

`string`

***

### get()

> **get**\<`T`\>(`key`): `T` \| `null`

Defined in: [packages/core/src/cache.ts:31](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/core/src/cache.ts#L31)

Get cached result.

#### Type Parameters

##### T

`T`

#### Parameters

##### key

`string`

#### Returns

`T` \| `null`

***

### set()

> **set**(`key`, `value`): `void`

Defined in: [packages/core/src/cache.ts:47](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/core/src/cache.ts#L47)

Set cached result.

#### Parameters

##### key

`string`

##### value

`any`

#### Returns

`void`
