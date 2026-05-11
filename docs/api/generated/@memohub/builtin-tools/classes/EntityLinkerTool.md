[**Documentation**](../../../README.md)

***

# Class: EntityLinkerTool

Defined in: [entity-linker.ts:9](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/builtin-tools/src/entity-linker.ts#L9)

原子化工具接口 (Dify/Node-RED Style Node)

## Implements

- [`ITool`](../../core/interfaces/ITool.md)

## Constructors

### Constructor

> **new EntityLinkerTool**(): `EntityLinkerTool`

#### Returns

`EntityLinkerTool`

## Properties

### manifest

> **manifest**: [`IToolManifest`](../../core/interfaces/IToolManifest.md)

Defined in: [entity-linker.ts:11](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/builtin-tools/src/entity-linker.ts#L11)

#### Implementation of

[`ITool`](../../core/interfaces/ITool.md).[`manifest`](../../core/interfaces/ITool.md#manifest)

## Methods

### execute()

> **execute**(`input`, `resources`, `context`): `Promise`\<\{ `entities`: `any`[]; \}\>

Defined in: [entity-linker.ts:30](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/builtin-tools/src/entity-linker.ts#L30)

#### Parameters

##### input

###### text

`string`

##### resources

[`IHostResources`](../../core/interfaces/IHostResources.md)

##### context

[`ExecutionContext`](../../core/interfaces/ExecutionContext.md)

#### Returns

`Promise`\<\{ `entities`: `any`[]; \}\>

#### Implementation of

[`ITool`](../../core/interfaces/ITool.md).[`execute`](../../core/interfaces/ITool.md#execute)
