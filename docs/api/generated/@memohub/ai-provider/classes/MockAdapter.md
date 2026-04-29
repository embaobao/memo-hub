[**Documentation**](../../../README.md)

***

# Class: MockAdapter

Defined in: [packages/ai-provider/src/mock-adapter.ts:3](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/ai-provider/src/mock-adapter.ts#L3)

## Implements

- [`IEmbedder`](../interfaces/IEmbedder.md)
- [`ICompleter`](../interfaces/ICompleter.md)

## Constructors

### Constructor

> **new MockAdapter**(): `MockAdapter`

#### Returns

`MockAdapter`

## Methods

### batchEmbed()

> **batchEmbed**(`texts`): `Promise`\<`number`[][]\>

Defined in: [packages/ai-provider/src/mock-adapter.ts:10](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/ai-provider/src/mock-adapter.ts#L10)

#### Parameters

##### texts

`string`[]

#### Returns

`Promise`\<`number`[][]\>

#### Implementation of

[`IEmbedder`](../interfaces/IEmbedder.md).[`batchEmbed`](../interfaces/IEmbedder.md#batchembed)

***

### chat()

> **chat**(`messages`): `Promise`\<`string`\>

Defined in: [packages/ai-provider/src/mock-adapter.ts:18](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/ai-provider/src/mock-adapter.ts#L18)

#### Parameters

##### messages

[`ChatMessage`](../interfaces/ChatMessage.md)[]

#### Returns

`Promise`\<`string`\>

#### Implementation of

[`ICompleter`](../interfaces/ICompleter.md).[`chat`](../interfaces/ICompleter.md#chat)

***

### embed()

> **embed**(`text`): `Promise`\<`number`[]\>

Defined in: [packages/ai-provider/src/mock-adapter.ts:4](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/ai-provider/src/mock-adapter.ts#L4)

#### Parameters

##### text

`string`

#### Returns

`Promise`\<`number`[]\>

#### Implementation of

[`IEmbedder`](../interfaces/IEmbedder.md).[`embed`](../interfaces/IEmbedder.md#embed)

***

### summarize()

> **summarize**(`text`): `Promise`\<`string`\>

Defined in: [packages/ai-provider/src/mock-adapter.ts:22](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/ai-provider/src/mock-adapter.ts#L22)

#### Parameters

##### text

`string`

#### Returns

`Promise`\<`string`\>

#### Implementation of

[`ICompleter`](../interfaces/ICompleter.md).[`summarize`](../interfaces/ICompleter.md#summarize)
