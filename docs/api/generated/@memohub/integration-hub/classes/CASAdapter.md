[**Documentation**](../../../README.md)

***

# Class: CASAdapter

Defined in: [cas-adapter.ts:21](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/integration-hub/src/cas-adapter.ts#L21)

CAS 适配器

提供内容哈希计算、去重检查和写入功能

## Constructors

### Constructor

> **new CASAdapter**(`cas`, `performance`): `CASAdapter`

Defined in: [cas-adapter.ts:25](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/integration-hub/src/cas-adapter.ts#L25)

#### Parameters

##### cas

[`ContentAddressableStorage`](../../storage-flesh/classes/ContentAddressableStorage.md)

##### performance

[`PerformanceMonitor`](../../core/classes/PerformanceMonitor.md)

#### Returns

`CASAdapter`

## Methods

### checkExists()

> **checkExists**(`hash`): `Promise`\<`boolean`\>

Defined in: [cas-adapter.ts:54](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/integration-hub/src/cas-adapter.ts#L54)

检查哈希是否已存在

#### Parameters

##### hash

`string`

#### Returns

`Promise`\<`boolean`\>

***

### computeHash()

> **computeHash**(`content`): `Promise`\<`string`\>

Defined in: [cas-adapter.ts:33](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/integration-hub/src/cas-adapter.ts#L33)

计算内容的哈希值

#### Parameters

##### content

`string`

#### Returns

`Promise`\<`string`\>

***

### readContent()

> **readContent**(`hash`): `Promise`\<`string` \| `null`\>

Defined in: [cas-adapter.ts:132](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/integration-hub/src/cas-adapter.ts#L132)

从 CAS 读取内容

#### Parameters

##### hash

`string`

#### Returns

`Promise`\<`string` \| `null`\>

***

### writeBatch()

> **writeBatch**(`contents`): `Promise`\<`Map`\<`string`, [`CASWriteResult`](../interfaces/CASWriteResult.md)\>\>

Defined in: [cas-adapter.ts:111](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/integration-hub/src/cas-adapter.ts#L111)

批量写入内容到 CAS
适用于包含多个大负载的事件

#### Parameters

##### contents

`string`[]

#### Returns

`Promise`\<`Map`\<`string`, [`CASWriteResult`](../interfaces/CASWriteResult.md)\>\>

***

### writeContent()

> **writeContent**(`content`): `Promise`\<[`CASWriteResult`](../interfaces/CASWriteResult.md)\>

Defined in: [cas-adapter.ts:77](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/integration-hub/src/cas-adapter.ts#L77)

写入内容到 CAS
如果内容已存在，返回现有哈希

#### Parameters

##### content

`string`

#### Returns

`Promise`\<[`CASWriteResult`](../interfaces/CASWriteResult.md)\>
