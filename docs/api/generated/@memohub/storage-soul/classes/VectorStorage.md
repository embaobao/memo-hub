[**Documentation**](../../../README.md)

***

# Class: VectorStorage

Defined in: [index.ts:75](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/storage-soul/src/index.ts#L75)

## Constructors

### Constructor

> **new VectorStorage**(`config`): `VectorStorage`

Defined in: [index.ts:80](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/storage-soul/src/index.ts#L80)

#### Parameters

##### config

[`VectorStorageConfig`](../interfaces/VectorStorageConfig.md)

#### Returns

`VectorStorage`

## Methods

### add()

> **add**(`records`): `Promise`\<`void`\>

Defined in: [index.ts:171](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/storage-soul/src/index.ts#L171)

#### Parameters

##### records

[`VectorRecord`](../interfaces/VectorRecord.md) \| [`VectorRecord`](../interfaces/VectorRecord.md)[]

#### Returns

`Promise`\<`void`\>

***

### delete()

> **delete**(`filter`): `Promise`\<`void`\>

Defined in: [index.ts:196](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/storage-soul/src/index.ts#L196)

#### Parameters

##### filter

`string`

#### Returns

`Promise`\<`void`\>

***

### initialize()

> **initialize**(): `Promise`\<`void`\>

Defined in: [index.ts:84](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/storage-soul/src/index.ts#L84)

#### Returns

`Promise`\<`void`\>

***

### list()

> **list**(`filter?`, `limit?`): `Promise`\<[`VectorRecord`](../interfaces/VectorRecord.md)[]\>

Defined in: [index.ts:201](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/storage-soul/src/index.ts#L201)

#### Parameters

##### filter?

`string`

##### limit?

`number` = `10000`

#### Returns

`Promise`\<[`VectorRecord`](../interfaces/VectorRecord.md)[]\>

***

### search()

> **search**(`queryVector`, `options?`): `Promise`\<[`VectorRecord`](../interfaces/VectorRecord.md) & `object`[]\>

Defined in: [index.ts:178](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/storage-soul/src/index.ts#L178)

#### Parameters

##### queryVector

`number`[]

##### options?

[`SearchOptions`](../interfaces/SearchOptions.md)

#### Returns

`Promise`\<[`VectorRecord`](../interfaces/VectorRecord.md) & `object`[]\>

***

### update()

> **update**(`id`, `changes`): `Promise`\<`void`\>

Defined in: [index.ts:211](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/storage-soul/src/index.ts#L211)

#### Parameters

##### id

`string`

##### changes

`Partial`\<`Omit`\<[`VectorRecord`](../interfaces/VectorRecord.md), `"id"` \| `"vector"`\>\>

#### Returns

`Promise`\<`void`\>
