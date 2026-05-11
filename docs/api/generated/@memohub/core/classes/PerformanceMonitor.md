[**Documentation**](../../../README.md)

***

# Class: PerformanceMonitor

Defined in: [packages/core/src/performance.ts:28](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/core/src/performance.ts#L28)

## Constructors

### Constructor

> **new PerformanceMonitor**(): `PerformanceMonitor`

#### Returns

`PerformanceMonitor`

## Methods

### getAllMetrics()

> **getAllMetrics**(): `Map`\<`string`, [`PerformanceMetrics`](../interfaces/PerformanceMetrics.md)\>

Defined in: [packages/core/src/performance.ts:108](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/core/src/performance.ts#L108)

获取所有操作的指标

#### Returns

`Map`\<`string`, [`PerformanceMetrics`](../interfaces/PerformanceMetrics.md)\>

***

### getEvents()

> **getEvents**(): [`PerformanceEvent`](../interfaces/PerformanceEvent.md)[]

Defined in: [packages/core/src/performance.ts:132](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/core/src/performance.ts#L132)

获取所有事件

#### Returns

[`PerformanceEvent`](../interfaces/PerformanceEvent.md)[]

***

### getMetrics()

> **getMetrics**(`operation`): [`PerformanceMetrics`](../interfaces/PerformanceMetrics.md) \| `null`

Defined in: [packages/core/src/performance.ts:80](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/core/src/performance.ts#L80)

获取操作的性能指标

#### Parameters

##### operation

`string`

#### Returns

[`PerformanceMetrics`](../interfaces/PerformanceMetrics.md) \| `null`

***

### recordEvent()

> **recordEvent**(`event`): `void`

Defined in: [packages/core/src/performance.ts:35](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/core/src/performance.ts#L35)

记录性能事件

#### Parameters

##### event

[`PerformanceEvent`](../interfaces/PerformanceEvent.md)

#### Returns

`void`

***

### reset()

> **reset**(): `void`

Defined in: [packages/core/src/performance.ts:124](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/core/src/performance.ts#L124)

重置监控数据

#### Returns

`void`

***

### startOperation()

> **startOperation**(`operation`, `traceId`, `metadata?`): () => `void`

Defined in: [packages/core/src/performance.ts:48](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/core/src/performance.ts#L48)

开始测量

#### Parameters

##### operation

`string`

##### traceId

`string`

##### metadata?

`Record`\<`string`, `unknown`\>

#### Returns

() => `void`
