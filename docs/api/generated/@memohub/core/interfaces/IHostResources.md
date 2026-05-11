[**Documentation**](../../../README.md)

***

# Interface: IHostResources

Defined in: [packages/core/src/types-host.ts:12](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/core/src/types-host.ts#L12)

宿主资源接口 (DI Container)

## Properties

### ai

> **ai**: `object`

Defined in: [packages/core/src/types-host.ts:16](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/core/src/types-host.ts#L16)

#### getCompleter

> **getCompleter**: (`id?`) => [`ICompleter`](../../protocol/interfaces/ICompleter.md) \| `null`

##### Parameters

###### id?

`string`

##### Returns

[`ICompleter`](../../protocol/interfaces/ICompleter.md) \| `null`

#### getEmbedder

> **getEmbedder**: (`id?`) => [`IEmbedder`](../../protocol/interfaces/IEmbedder.md)

##### Parameters

###### id?

`string`

##### Returns

[`IEmbedder`](../../protocol/interfaces/IEmbedder.md)

***

### flesh

> **flesh**: [`ICAS`](../../protocol/interfaces/ICAS.md)

Defined in: [packages/core/src/types-host.ts:14](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/core/src/types-host.ts#L14)

***

### kernel

> **kernel**: `IKernel`

Defined in: [packages/core/src/types-host.ts:13](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/core/src/types-host.ts#L13)

***

### logger

> **logger**: `object`

Defined in: [packages/core/src/types-host.ts:20](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/core/src/types-host.ts#L20)

#### log

> **log**: (`msg`, `level?`) => `void`

##### Parameters

###### msg

`string`

###### level?

`string`

##### Returns

`void`

***

### soul

> **soul**: [`IVectorStorage`](../../protocol/interfaces/IVectorStorage.md)

Defined in: [packages/core/src/types-host.ts:15](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/core/src/types-host.ts#L15)
