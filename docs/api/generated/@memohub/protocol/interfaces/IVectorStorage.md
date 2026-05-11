[**Documentation**](../../../README.md)

***

# Interface: IVectorStorage

Defined in: [packages/protocol/src/types.ts:117](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/protocol/src/types.ts#L117)

## Methods

### add()

> **add**(`record`): `Promise`\<`void`\>

Defined in: [packages/protocol/src/types.ts:119](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/protocol/src/types.ts#L119)

#### Parameters

##### record

`any`

#### Returns

`Promise`\<`void`\>

***

### delete()

> **delete**(`filter`): `Promise`\<`void`\>

Defined in: [packages/protocol/src/types.ts:121](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/protocol/src/types.ts#L121)

#### Parameters

##### filter

`string`

#### Returns

`Promise`\<`void`\>

***

### initialize()

> **initialize**(): `Promise`\<`void`\>

Defined in: [packages/protocol/src/types.ts:118](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/protocol/src/types.ts#L118)

#### Returns

`Promise`\<`void`\>

***

### list()

> **list**(`filter?`, `limit?`): `Promise`\<`any`[]\>

Defined in: [packages/protocol/src/types.ts:122](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/protocol/src/types.ts#L122)

#### Parameters

##### filter?

`string`

##### limit?

`number`

#### Returns

`Promise`\<`any`[]\>

***

### search()

> **search**(`vector`, `options?`): `Promise`\<`any`[]\>

Defined in: [packages/protocol/src/types.ts:120](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/protocol/src/types.ts#L120)

#### Parameters

##### vector

`number`[]

##### options?

###### filter?

`string`

###### limit?

`number`

#### Returns

`Promise`\<`any`[]\>

***

### update()

> **update**(`id`, `changes`): `Promise`\<`void`\>

Defined in: [packages/protocol/src/types.ts:123](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/protocol/src/types.ts#L123)

#### Parameters

##### id

`string`

##### changes

`any`

#### Returns

`Promise`\<`void`\>
