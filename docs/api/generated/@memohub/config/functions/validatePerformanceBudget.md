[**Documentation**](../../../README.md)

***

# Function: validatePerformanceBudget()

> **validatePerformanceBudget**(`operation`, `actualP99`, `config`): `object`

Defined in: [performance.ts:59](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/config/src/performance.ts#L59)

验证性能指标是否在预算范围内

## Parameters

### operation

`string`

### actualP99

`number`

### config

[`PerformanceConfig`](../interfaces/PerformanceConfig.md)

## Returns

`object`

### exceededBy?

> `optional` **exceededBy?**: `number`

### withinBudget

> **withinBudget**: `boolean`
