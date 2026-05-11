[**Documentation**](../../../README.md)

***

# Class: AIHub

Defined in: [packages/core/src/ai-hub.ts:3](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/core/src/ai-hub.ts#L3)

## Constructors

### Constructor

> **new AIHub**(`providers`, `agents`): `AIHub`

Defined in: [packages/core/src/ai-hub.ts:7](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/core/src/ai-hub.ts#L7)

#### Parameters

##### providers

`any`[]

##### agents

`any`

#### Returns

`AIHub`

## Methods

### getCompleter()

> **getCompleter**(`id?`): [`ICompleter`](../../ai-provider/interfaces/ICompleter.md)

Defined in: [packages/core/src/ai-hub.ts:25](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/core/src/ai-hub.ts#L25)

#### Parameters

##### id?

`string` = `'summarizer'`

#### Returns

[`ICompleter`](../../ai-provider/interfaces/ICompleter.md)

***

### getEmbedder()

> **getEmbedder**(`id?`): [`IEmbedder`](../../ai-provider/interfaces/IEmbedder.md)

Defined in: [packages/core/src/ai-hub.ts:18](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/core/src/ai-hub.ts#L18)

#### Parameters

##### id?

`string` = `'embedder'`

#### Returns

[`IEmbedder`](../../ai-provider/interfaces/IEmbedder.md)
