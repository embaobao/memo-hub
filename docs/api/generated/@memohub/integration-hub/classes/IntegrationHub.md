[**Documentation**](../../../README.md)

***

# Class: IntegrationHub

Defined in: [integration-hub.ts:38](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/integration-hub/src/integration-hub.ts#L38)

Integration Hub

外部系统与 MemoHub 之间的桥梁

## Constructors

### Constructor

> **new IntegrationHub**(`config`): `IntegrationHub`

Defined in: [integration-hub.ts:44](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/integration-hub/src/integration-hub.ts#L44)

#### Parameters

##### config

[`IntegrationHubConfig`](../interfaces/IntegrationHubConfig.md)

#### Returns

`IntegrationHub`

## Methods

### getPerformance()

> **getPerformance**(): [`PerformanceMonitor`](../../core/classes/PerformanceMonitor.md)

Defined in: [integration-hub.ts:188](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/integration-hub/src/integration-hub.ts#L188)

获取性能监控实例

#### Returns

[`PerformanceMonitor`](../../core/classes/PerformanceMonitor.md)

***

### ingest()

> **ingest**(`event`): `Promise`\<[`IngestResult`](../interfaces/IngestResult.md)\>

Defined in: [integration-hub.ts:60](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/integration-hub/src/integration-hub.ts#L60)

摄取外部事件

主要入口点，接受外部事件并处理

#### Parameters

##### event

[`MemoHubEvent`](../../protocol/interfaces/MemoHubEvent.md)

#### Returns

`Promise`\<[`IngestResult`](../interfaces/IngestResult.md)\>

***

### ingestBatch()

> **ingestBatch**(`events`): `Promise`\<[`IngestResult`](../interfaces/IngestResult.md)[]\>

Defined in: [integration-hub.ts:148](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/integration-hub/src/integration-hub.ts#L148)

批量摄取事件

#### Parameters

##### events

[`MemoHubEvent`](../../protocol/interfaces/MemoHubEvent.md)[]

#### Returns

`Promise`\<[`IngestResult`](../interfaces/IngestResult.md)[]\>
