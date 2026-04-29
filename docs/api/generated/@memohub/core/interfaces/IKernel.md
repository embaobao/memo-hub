[**Documentation**](../../../README.md)

***

# Interface: IKernel

Defined in: [packages/core/src/types.ts:6](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/core/src/types.ts#L6)

## Methods

### dispatch()

> **dispatch**(`instruction`): `Promise`\<`Text2MemResult`\>

Defined in: [packages/core/src/types.ts:12](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/core/src/types.ts#L12)

#### Parameters

##### instruction

`Text2MemInstruction`

#### Returns

`Promise`\<`Text2MemResult`\>

***

### getCAS()

> **getCAS**(): [`ContentAddressableStorage`](../../storage-flesh/classes/ContentAddressableStorage.md)

Defined in: [packages/core/src/types.ts:9](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/core/src/types.ts#L9)

#### Returns

[`ContentAddressableStorage`](../../storage-flesh/classes/ContentAddressableStorage.md)

***

### getCompleter()

> **getCompleter**(): [`ICompleter`](../../ai-provider/interfaces/ICompleter.md) \| `null`

Defined in: [packages/core/src/types.ts:8](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/core/src/types.ts#L8)

#### Returns

[`ICompleter`](../../ai-provider/interfaces/ICompleter.md) \| `null`

***

### getConfig()

> **getConfig**(): `Record`\<`string`, `any`\>

Defined in: [packages/core/src/types.ts:11](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/core/src/types.ts#L11)

#### Returns

`Record`\<`string`, `any`\>

***

### getEmbedder()

> **getEmbedder**(): [`IEmbedder`](../../ai-provider/interfaces/IEmbedder.md)

Defined in: [packages/core/src/types.ts:7](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/core/src/types.ts#L7)

#### Returns

[`IEmbedder`](../../ai-provider/interfaces/IEmbedder.md)

***

### getVectorStorage()

> **getVectorStorage**(): [`VectorStorage`](../../storage-soul/classes/VectorStorage.md)

Defined in: [packages/core/src/types.ts:10](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/core/src/types.ts#L10)

#### Returns

[`VectorStorage`](../../storage-soul/classes/VectorStorage.md)
