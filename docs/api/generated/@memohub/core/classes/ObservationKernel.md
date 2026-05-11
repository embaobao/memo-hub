[**Documentation**](../../../README.md)

***

# Class: ObservationKernel

Defined in: [packages/core/src/observation.ts:18](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/core/src/observation.ts#L18)

## Constructors

### Constructor

> **new ObservationKernel**(`root`): `ObservationKernel`

Defined in: [packages/core/src/observation.ts:21](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/core/src/observation.ts#L21)

#### Parameters

##### root

`string`

#### Returns

`ObservationKernel`

## Methods

### createSpanId()

> **createSpanId**(): `string`

Defined in: [packages/core/src/observation.ts:33](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/core/src/observation.ts#L33)

#### Returns

`string`

***

### createTraceId()

> **createTraceId**(): `string`

Defined in: [packages/core/src/observation.ts:29](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/core/src/observation.ts#L29)

#### Returns

`string`

***

### log()

> **log**(`entry`): `void`

Defined in: [packages/core/src/observation.ts:37](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/core/src/observation.ts#L37)

#### Parameters

##### entry

[`TraceLog`](../interfaces/TraceLog.md)

#### Returns

`void`

***

### safeRun()

> **safeRun**\<`T`\>(`fn`, `context`): `Promise`\<`T`\>

Defined in: [packages/core/src/observation.ts:47](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/core/src/observation.ts#L47)

Wrap execution in a safe runner with tracking.

#### Type Parameters

##### T

`T`

#### Parameters

##### fn

() => `Promise`\<`T`\>

##### context

###### input

`any`

###### spanId

`string`

###### step

`string`

###### tool

`string`

###### traceId

`string`

#### Returns

`Promise`\<`T`\>
