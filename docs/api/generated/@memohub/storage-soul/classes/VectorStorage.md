[**Documentation**](../../../README.md)

***

# Class: VectorStorage

Defined in: [index.ts:11](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/storage-soul/src/index.ts#L11)

## Constructors

### Constructor

> **new VectorStorage**(`config`): `VectorStorage`

Defined in: [index.ts:16](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/storage-soul/src/index.ts#L16)

#### Parameters

##### config

[`VectorStorageConfig`](../interfaces/VectorStorageConfig.md)

#### Returns

`VectorStorage`

## Methods

### add()

> **add**(`records`): `Promise`\<`void`\>

Defined in: [index.ts:96](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/storage-soul/src/index.ts#L96)

#### Parameters

##### records

[`VectorRecord`](../interfaces/VectorRecord.md) \| [`VectorRecord`](../interfaces/VectorRecord.md)[]

#### Returns

`Promise`\<`void`\>

***

### delete()

> **delete**(`filter`): `Promise`\<`void`\>

Defined in: [index.ts:120](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/storage-soul/src/index.ts#L120)

#### Parameters

##### filter

`string`

#### Returns

`Promise`\<`void`\>

***

### initialize()

> **initialize**(): `Promise`\<`void`\>

Defined in: [index.ts:20](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/storage-soul/src/index.ts#L20)

#### Returns

`Promise`\<`void`\>

***

### list()

> **list**(`filter?`, `limit?`): `Promise`\<[`VectorRecord`](../interfaces/VectorRecord.md)[]\>

Defined in: [index.ts:125](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/storage-soul/src/index.ts#L125)

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

Defined in: [index.ts:102](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/storage-soul/src/index.ts#L102)

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

Defined in: [index.ts:135](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/storage-soul/src/index.ts#L135)

#### Parameters

##### id

`string`

##### changes

`Partial`\<`Omit`\<[`VectorRecord`](../interfaces/VectorRecord.md), `"id"` \| `"vector"`\>\>

#### Returns

`Promise`\<`void`\>
