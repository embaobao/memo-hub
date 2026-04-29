[**Documentation**](../../../README.md)

***

# Class: CasTool

Defined in: [cas.ts:9](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/builtin-tools/src/cas.ts#L9)

原子化工具接口 (Dify/Node-RED Style Node)

## Implements

- [`ITool`](../../core/interfaces/ITool.md)

## Constructors

### Constructor

> **new CasTool**(): `CasTool`

#### Returns

`CasTool`

## Properties

### manifest

> **manifest**: [`IToolManifest`](../../core/interfaces/IToolManifest.md)

Defined in: [cas.ts:11](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/builtin-tools/src/cas.ts#L11)

#### Implementation of

[`ITool`](../../core/interfaces/ITool.md).[`manifest`](../../core/interfaces/ITool.md#manifest)

## Methods

### execute()

> **execute**(`input`, `resources`, `context`): `Promise`\<\{ `content?`: `string`; `hash?`: `string`; `path?`: `string`; \}\>

Defined in: [cas.ts:28](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/builtin-tools/src/cas.ts#L28)

#### Parameters

##### input

###### content?

`string`

###### hash?

`string`

###### op?

`string`

##### resources

[`IHostResources`](../../core/interfaces/IHostResources.md)

##### context

[`ExecutionContext`](../../core/interfaces/ExecutionContext.md)

#### Returns

`Promise`\<\{ `content?`: `string`; `hash?`: `string`; `path?`: `string`; \}\>

#### Implementation of

[`ITool`](../../core/interfaces/ITool.md).[`execute`](../../core/interfaces/ITool.md#execute)
