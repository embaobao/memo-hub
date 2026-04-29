[**Documentation**](../../../README.md)

***

# Interface: ITool\<TInput, TOutput\>

Defined in: [packages/core/src/tool-registry.ts:26](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/core/src/tool-registry.ts#L26)

原子化工具接口 (Dify/Node-RED Style Node)

## Type Parameters

### TInput

`TInput` = `any`

### TOutput

`TOutput` = `any`

## Properties

### manifest

> **manifest**: [`IToolManifest`](IToolManifest.md)

Defined in: [packages/core/src/tool-registry.ts:27](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/core/src/tool-registry.ts#L27)

## Methods

### execute()

> **execute**(`input`, `resources`, `context`): `Promise`\<`TOutput`\>

Defined in: [packages/core/src/tool-registry.ts:28](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/core/src/tool-registry.ts#L28)

#### Parameters

##### input

`TInput`

##### resources

[`IHostResources`](IHostResources.md)

##### context

[`ExecutionContext`](ExecutionContext.md)

#### Returns

`Promise`\<`TOutput`\>
