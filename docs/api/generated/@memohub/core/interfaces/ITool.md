[**Documentation**](../../../README.md)

***

# Interface: ITool\<TInput, TOutput\>

Defined in: [packages/core/src/tool-registry.ts:26](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/core/src/tool-registry.ts#L26)

原子化工具接口 (Dify/Node-RED Style Node)

## Type Parameters

### TInput

`TInput` = `any`

### TOutput

`TOutput` = `any`

## Properties

### manifest

> **manifest**: [`IToolManifest`](IToolManifest.md)

Defined in: [packages/core/src/tool-registry.ts:27](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/core/src/tool-registry.ts#L27)

## Methods

### execute()

> **execute**(`input`, `resources`, `context`): `Promise`\<`TOutput`\>

Defined in: [packages/core/src/tool-registry.ts:28](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/core/src/tool-registry.ts#L28)

#### Parameters

##### input

`TInput`

##### resources

[`IHostResources`](IHostResources.md)

##### context

[`ExecutionContext`](ExecutionContext.md)

#### Returns

`Promise`\<`TOutput`\>
