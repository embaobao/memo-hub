[**Documentation**](../../../README.md)

***

# Class: AIHub

Defined in: [packages/core/src/ai-hub.ts:3](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/core/src/ai-hub.ts#L3)

## Constructors

### Constructor

> **new AIHub**(`providers`, `agents`): `AIHub`

Defined in: [packages/core/src/ai-hub.ts:7](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/core/src/ai-hub.ts#L7)

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

Defined in: [packages/core/src/ai-hub.ts:25](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/core/src/ai-hub.ts#L25)

#### Parameters

##### id?

`string` = `'summarizer'`

#### Returns

[`ICompleter`](../../ai-provider/interfaces/ICompleter.md)

***

### getEmbedder()

> **getEmbedder**(`id?`): [`IEmbedder`](../../ai-provider/interfaces/IEmbedder.md)

Defined in: [packages/core/src/ai-hub.ts:18](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/core/src/ai-hub.ts#L18)

#### Parameters

##### id?

`string` = `'embedder'`

#### Returns

[`IEmbedder`](../../ai-provider/interfaces/IEmbedder.md)
