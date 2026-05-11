[**Documentation**](../../../README.md)

***

# Class: RerankerTool

Defined in: [reranker.ts:9](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/builtin-tools/src/reranker.ts#L9)

原子化工具接口 (Dify/Node-RED Style Node)

## Implements

- [`ITool`](../../core/interfaces/ITool.md)

## Constructors

### Constructor

> **new RerankerTool**(): `RerankerTool`

#### Returns

`RerankerTool`

## Properties

### manifest

> **manifest**: [`IToolManifest`](../../core/interfaces/IToolManifest.md)

Defined in: [reranker.ts:11](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/builtin-tools/src/reranker.ts#L11)

#### Implementation of

[`ITool`](../../core/interfaces/ITool.md).[`manifest`](../../core/interfaces/ITool.md#manifest)

## Methods

### execute()

> **execute**(`input`, `resources`, `context`): `Promise`\<\{ `results`: `any`[]; \}\>

Defined in: [reranker.ts:27](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/builtin-tools/src/reranker.ts#L27)

#### Parameters

##### input

###### agent

`string`

###### query

`string`

###### results

`any`[]

###### top_n

`number`

##### resources

[`IHostResources`](../../core/interfaces/IHostResources.md)

##### context

[`ExecutionContext`](../../core/interfaces/ExecutionContext.md)

#### Returns

`Promise`\<\{ `results`: `any`[]; \}\>

#### Implementation of

[`ITool`](../../core/interfaces/ITool.md).[`execute`](../../core/interfaces/ITool.md#execute)
