[**Documentation**](../../../README.md)

***

# Class: EmbedderTool

Defined in: [embedder.ts:9](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/builtin-tools/src/embedder.ts#L9)

原子化工具接口 (Dify/Node-RED Style Node)

## Implements

- [`ITool`](../../core/interfaces/ITool.md)

## Constructors

### Constructor

> **new EmbedderTool**(): `EmbedderTool`

#### Returns

`EmbedderTool`

## Properties

### manifest

> **manifest**: [`IToolManifest`](../../core/interfaces/IToolManifest.md)

Defined in: [embedder.ts:11](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/builtin-tools/src/embedder.ts#L11)

#### Implementation of

[`ITool`](../../core/interfaces/ITool.md).[`manifest`](../../core/interfaces/ITool.md#manifest)

## Methods

### execute()

> **execute**(`input`, `resources`, `context`): `Promise`\<\{ `vector`: `number`[]; \}\>

Defined in: [embedder.ts:25](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/builtin-tools/src/embedder.ts#L25)

#### Parameters

##### input

###### agent?

`string`

###### text

`string`

##### resources

[`IHostResources`](../../core/interfaces/IHostResources.md)

##### context

[`ExecutionContext`](../../core/interfaces/ExecutionContext.md)

#### Returns

`Promise`\<\{ `vector`: `number`[]; \}\>

#### Implementation of

[`ITool`](../../core/interfaces/ITool.md).[`execute`](../../core/interfaces/ITool.md#execute)
