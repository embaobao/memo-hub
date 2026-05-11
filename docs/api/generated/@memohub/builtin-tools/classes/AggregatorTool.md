[**Documentation**](../../../README.md)

***

# Class: AggregatorTool

Defined in: [aggregator.ts:7](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/builtin-tools/src/aggregator.ts#L7)

原子化工具接口 (Dify/Node-RED Style Node)

## Implements

- [`ITool`](../../core/interfaces/ITool.md)

## Constructors

### Constructor

> **new AggregatorTool**(): `AggregatorTool`

#### Returns

`AggregatorTool`

## Properties

### manifest

> **manifest**: [`IToolManifest`](../../core/interfaces/IToolManifest.md)

Defined in: [aggregator.ts:9](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/builtin-tools/src/aggregator.ts#L9)

#### Implementation of

[`ITool`](../../core/interfaces/ITool.md).[`manifest`](../../core/interfaces/ITool.md#manifest)

## Methods

### execute()

> **execute**(`input`, `resources`, `context`): `Promise`\<\{ `results`: `any`[]; \}\>

Defined in: [aggregator.ts:23](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/builtin-tools/src/aggregator.ts#L23)

#### Parameters

##### input

###### lists

`any`[][]

###### sort_by

`string`

##### resources

[`IHostResources`](../../core/interfaces/IHostResources.md)

##### context

[`ExecutionContext`](../../core/interfaces/ExecutionContext.md)

#### Returns

`Promise`\<\{ `results`: `any`[]; \}\>

#### Implementation of

[`ITool`](../../core/interfaces/ITool.md).[`execute`](../../core/interfaces/ITool.md#execute)
