[**Documentation**](../../../README.md)

***

# Class: RetrieverTool

Defined in: [retriever.ts:9](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/builtin-tools/src/retriever.ts#L9)

原子化工具接口 (Dify/Node-RED Style Node)

## Implements

- [`ITool`](../../core/interfaces/ITool.md)

## Constructors

### Constructor

> **new RetrieverTool**(): `RetrieverTool`

#### Returns

`RetrieverTool`

## Properties

### manifest

> **manifest**: [`IToolManifest`](../../core/interfaces/IToolManifest.md)

Defined in: [retriever.ts:11](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/builtin-tools/src/retriever.ts#L11)

#### Implementation of

[`ITool`](../../core/interfaces/ITool.md).[`manifest`](../../core/interfaces/ITool.md#manifest)

## Methods

### execute()

> **execute**(`input`, `resources`, `context`): `Promise`\<\{ `results`: `any`[]; \}\>

Defined in: [retriever.ts:28](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/builtin-tools/src/retriever.ts#L28)

#### Parameters

##### input

###### filter?

`string`

###### hydrate?

`boolean`

###### limit

`number`

###### track_id?

`string`

###### vector

`number`[]

##### resources

[`IHostResources`](../../core/interfaces/IHostResources.md)

##### context

[`ExecutionContext`](../../core/interfaces/ExecutionContext.md)

#### Returns

`Promise`\<\{ `results`: `any`[]; \}\>

#### Implementation of

[`ITool`](../../core/interfaces/ITool.md).[`execute`](../../core/interfaces/ITool.md#execute)
