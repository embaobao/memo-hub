[**Documentation**](../../../README.md)

***

# Class: GraphStoreTool

Defined in: [graph-store.ts:12](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/builtin-tools/src/graph-store.ts#L12)

原子化工具接口 (Dify/Node-RED Style Node)

## Implements

- [`ITool`](../../core/interfaces/ITool.md)

## Constructors

### Constructor

> **new GraphStoreTool**(`root`): `GraphStoreTool`

Defined in: [graph-store.ts:32](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/builtin-tools/src/graph-store.ts#L32)

#### Parameters

##### root

`string`

#### Returns

`GraphStoreTool`

## Properties

### manifest

> **manifest**: [`IToolManifest`](../../core/interfaces/IToolManifest.md)

Defined in: [graph-store.ts:14](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/builtin-tools/src/graph-store.ts#L14)

#### Implementation of

[`ITool`](../../core/interfaces/ITool.md).[`manifest`](../../core/interfaces/ITool.md#manifest)

## Methods

### execute()

> **execute**(`input`, `resources`, `context`): `Promise`\<\{ `triples`: `any`[]; \}\>

Defined in: [graph-store.ts:38](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/builtin-tools/src/graph-store.ts#L38)

#### Parameters

##### input

`any`

##### resources

[`IHostResources`](../../core/interfaces/IHostResources.md)

##### context

[`ExecutionContext`](../../core/interfaces/ExecutionContext.md)

#### Returns

`Promise`\<\{ `triples`: `any`[]; \}\>

#### Implementation of

[`ITool`](../../core/interfaces/ITool.md).[`execute`](../../core/interfaces/ITool.md#execute)
