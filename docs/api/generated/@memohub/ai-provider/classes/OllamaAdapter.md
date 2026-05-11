[**Documentation**](../../../README.md)

***

# Class: OllamaAdapter

Defined in: [packages/ai-provider/src/ollama-adapter.ts:12](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/ai-provider/src/ollama-adapter.ts#L12)

## Implements

- [`IEmbedder`](../interfaces/IEmbedder.md)
- [`ICompleter`](../interfaces/ICompleter.md)

## Constructors

### Constructor

> **new OllamaAdapter**(`config`): `OllamaAdapter`

Defined in: [packages/ai-provider/src/ollama-adapter.ts:15](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/ai-provider/src/ollama-adapter.ts#L15)

#### Parameters

##### config

[`OllamaConfig`](../interfaces/OllamaConfig.md)

#### Returns

`OllamaAdapter`

## Methods

### batchEmbed()

> **batchEmbed**(`texts`): `Promise`\<`number`[][]\>

Defined in: [packages/ai-provider/src/ollama-adapter.ts:59](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/ai-provider/src/ollama-adapter.ts#L59)

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

Defined in: [packages/ai-provider/src/ollama-adapter.ts:63](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/ai-provider/src/ollama-adapter.ts#L63)

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

Defined in: [packages/ai-provider/src/ollama-adapter.ts:19](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/ai-provider/src/ollama-adapter.ts#L19)

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

Defined in: [packages/ai-provider/src/ollama-adapter.ts:102](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/ai-provider/src/ollama-adapter.ts#L102)

#### Parameters

##### text

`string`

#### Returns

`Promise`\<`string`\>

#### Implementation of

[`ICompleter`](../interfaces/ICompleter.md).[`summarize`](../interfaces/ICompleter.md#summarize)
