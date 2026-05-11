[**Documentation**](../../../README.md)

***

# Class: AIProviderRegistry

Defined in: [packages/ai-provider/src/registry.ts:5](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/ai-provider/src/registry.ts#L5)

## Constructors

### Constructor

> **new AIProviderRegistry**(): `AIProviderRegistry`

#### Returns

`AIProviderRegistry`

## Methods

### getCompleter()

> **getCompleter**(`name`, `config?`): [`ICompleter`](../interfaces/ICompleter.md)

Defined in: [packages/ai-provider/src/registry.ts:35](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/ai-provider/src/registry.ts#L35)

#### Parameters

##### name

`string`

##### config?

`any`

#### Returns

[`ICompleter`](../interfaces/ICompleter.md)

***

### getEmbedder()

> **getEmbedder**(`name`, `config?`): [`IEmbedder`](../interfaces/IEmbedder.md)

Defined in: [packages/ai-provider/src/registry.ts:19](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/ai-provider/src/registry.ts#L19)

#### Parameters

##### name

`string`

##### config?

`any`

#### Returns

[`IEmbedder`](../interfaces/IEmbedder.md)

***

### registerCompleter()

> **registerCompleter**(`name`, `factory`): `void`

Defined in: [packages/ai-provider/src/registry.ts:15](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/ai-provider/src/registry.ts#L15)

#### Parameters

##### name

`string`

##### factory

[`AdapterFactory`](../type-aliases/AdapterFactory.md)\<[`ICompleter`](../interfaces/ICompleter.md)\>

#### Returns

`void`

***

### registerEmbedder()

> **registerEmbedder**(`name`, `factory`): `void`

Defined in: [packages/ai-provider/src/registry.ts:11](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/ai-provider/src/registry.ts#L11)

#### Parameters

##### name

`string`

##### factory

[`AdapterFactory`](../type-aliases/AdapterFactory.md)\<[`IEmbedder`](../interfaces/IEmbedder.md)\>

#### Returns

`void`
