[**Documentation**](../../../README.md)

***

# Interface: ITrackProvider

Defined in: [packages/core/src/types.ts:15](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/core/src/types.ts#L15)

## Properties

### id

> **id**: `string`

Defined in: [packages/core/src/types.ts:16](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/core/src/types.ts#L16)

***

### name

> **name**: `string`

Defined in: [packages/core/src/types.ts:17](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/core/src/types.ts#L17)

## Methods

### execute()

> **execute**(`instruction`): `Promise`\<`Text2MemResult`\>

Defined in: [packages/core/src/types.ts:19](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/core/src/types.ts#L19)

#### Parameters

##### instruction

`Text2MemInstruction`

#### Returns

`Promise`\<`Text2MemResult`\>

***

### initialize()

> **initialize**(`kernel`): `Promise`\<`void`\>

Defined in: [packages/core/src/types.ts:18](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/core/src/types.ts#L18)

#### Parameters

##### kernel

[`IKernel`](IKernel.md)

#### Returns

`Promise`\<`void`\>
