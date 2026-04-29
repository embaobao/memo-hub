[**Documentation**](../../../README.md)

***

# Interface: ContextView

Defined in: packages/core/src/query-planner.ts:45

## Properties

### conflictsOrGaps

> **conflictsOrGaps**: [`WeightedMemoryResult`](WeightedMemoryResult.md)[]

Defined in: packages/core/src/query-planner.ts:50

***

### globalContext

> **globalContext**: [`WeightedMemoryResult`](WeightedMemoryResult.md)[]

Defined in: packages/core/src/query-planner.ts:49

***

### metadata

> **metadata**: `object`

Defined in: packages/core/src/query-planner.ts:52

#### Index Signature

\[`key`: `string`\]: `unknown`

#### appliedFactors

> **appliedFactors**: `string`[]

#### layers

> **layers**: `Record`\<[`RecallLayer`](../type-aliases/RecallLayer.md), `number`\>

#### policyId

> **policyId**: `string`

#### query?

> `optional` **query?**: `string`

***

### projectContext

> **projectContext**: [`WeightedMemoryResult`](WeightedMemoryResult.md)[]

Defined in: packages/core/src/query-planner.ts:48

***

### selfContext

> **selfContext**: [`WeightedMemoryResult`](WeightedMemoryResult.md)[]

Defined in: packages/core/src/query-planner.ts:47

***

### sources

> **sources**: [`SourceDescriptor`](../../protocol/interfaces/SourceDescriptor.md)[]

Defined in: packages/core/src/query-planner.ts:51

***

### view

> **view**: `string`

Defined in: packages/core/src/query-planner.ts:46
