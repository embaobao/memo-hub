[**Documentation**](../../../README.md)

***

# Function: validatePerformanceBudget()

> **validatePerformanceBudget**(`operation`, `actualP99`, `config`): `object`

Defined in: [performance.ts:59](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/config/src/performance.ts#L59)

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
