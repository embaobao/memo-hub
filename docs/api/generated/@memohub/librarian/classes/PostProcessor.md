[**Documentation**](../../../README.md)

***

# Class: PostProcessor

Defined in: [retrieval-pipeline.ts:416](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/librarian/src/retrieval-pipeline.ts#L416)

## Constructors

### Constructor

> **new PostProcessor**(`options?`): `PostProcessor`

Defined in: [retrieval-pipeline.ts:417](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/librarian/src/retrieval-pipeline.ts#L417)

#### Parameters

##### options?

[`RetrievalPipelineOptions`](../interfaces/RetrievalPipelineOptions.md) = `{}`

#### Returns

`PostProcessor`

## Methods

### process()

> **process**(`exec`): `Promise`\<[`PostResult`](../interfaces/PostResult.md)\>

Defined in: [retrieval-pipeline.ts:498](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/librarian/src/retrieval-pipeline.ts#L498)

执行 Post 阶段

#### Parameters

##### exec

[`ExecResult`](../interfaces/ExecResult.md)

#### Returns

`Promise`\<[`PostResult`](../interfaces/PostResult.md)\>
