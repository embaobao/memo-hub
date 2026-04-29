[**Documentation**](../../../README.md)

***

# Class: PreProcessor

Defined in: [retrieval-pipeline.ts:99](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/librarian/src/retrieval-pipeline.ts#L99)

## Constructors

### Constructor

> **new PreProcessor**(): `PreProcessor`

#### Returns

`PreProcessor`

## Methods

### detectIntent()

> `static` **detectIntent**(`query`): [`QueryIntent`](../interfaces/QueryIntent.md)

Defined in: [retrieval-pipeline.ts:103](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/librarian/src/retrieval-pipeline.ts#L103)

意图识别：判断查询是代码、知识还是混合型

#### Parameters

##### query

`string`

#### Returns

[`QueryIntent`](../interfaces/QueryIntent.md)

***

### extractEntities()

> `static` **extractEntities**(`query`): [`QueryEntities`](../interfaces/QueryEntities.md)

Defined in: [retrieval-pipeline.ts:173](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/librarian/src/retrieval-pipeline.ts#L173)

抽取查询实体

#### Parameters

##### query

`string`

#### Returns

[`QueryEntities`](../interfaces/QueryEntities.md)

***

### process()

> `static` **process**(`query`): `Promise`\<[`PreResult`](../interfaces/PreResult.md)\>

Defined in: [retrieval-pipeline.ts:210](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/librarian/src/retrieval-pipeline.ts#L210)

执行 Pre 阶段

#### Parameters

##### query

`string`

#### Returns

`Promise`\<[`PreResult`](../interfaces/PreResult.md)\>

***

### tokenize()

> `static` **tokenize**(`query`): [`TokenizedQuery`](../interfaces/TokenizedQuery.md)

Defined in: [retrieval-pipeline.ts:193](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/librarian/src/retrieval-pipeline.ts#L193)

Token化查询

#### Parameters

##### query

`string`

#### Returns

[`TokenizedQuery`](../interfaces/TokenizedQuery.md)
