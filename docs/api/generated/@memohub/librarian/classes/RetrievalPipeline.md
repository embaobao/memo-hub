[**Documentation**](../../../README.md)

***

# Class: RetrievalPipeline

Defined in: [retrieval-pipeline.ts:534](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/librarian/src/retrieval-pipeline.ts#L534)

## Constructors

### Constructor

> **new RetrievalPipeline**(`kernel`, `embedder`, `options?`): `RetrievalPipeline`

Defined in: [retrieval-pipeline.ts:535](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/librarian/src/retrieval-pipeline.ts#L535)

#### Parameters

##### kernel

`IKernel`

##### embedder

[`IEmbedder`](../../protocol/interfaces/IEmbedder.md)

##### options?

[`RetrievalPipelineOptions`](../interfaces/RetrievalPipelineOptions.md) = `{}`

#### Returns

`RetrievalPipeline`

## Methods

### execute()

> **execute**(`query`): `Promise`\<[`PipelineResult`](../interfaces/PipelineResult.md)\>

Defined in: [retrieval-pipeline.ts:544](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/librarian/src/retrieval-pipeline.ts#L544)

执行完整的检索流水线

#### Parameters

##### query

`string`

#### Returns

`Promise`\<[`PipelineResult`](../interfaces/PipelineResult.md)\>
