[**Documentation**](../../../README.md)

***

# Class: ExecProcessor

Defined in: [retrieval-pipeline.ts:225](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/librarian/src/retrieval-pipeline.ts#L225)

## Constructors

### Constructor

> **new ExecProcessor**(`kernel`, `embedder`, `options?`): `ExecProcessor`

Defined in: [retrieval-pipeline.ts:226](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/librarian/src/retrieval-pipeline.ts#L226)

#### Parameters

##### kernel

`IKernel`

##### embedder

[`IEmbedder`](../../protocol/interfaces/IEmbedder.md)

##### options?

[`RetrievalPipelineOptions`](../interfaces/RetrievalPipelineOptions.md) = `{}`

#### Returns

`ExecProcessor`

## Methods

### execute()

> **execute**(`query`, `pre`): `Promise`\<[`ExecResult`](../interfaces/ExecResult.md)\>

Defined in: [retrieval-pipeline.ts:385](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/librarian/src/retrieval-pipeline.ts#L385)

执行 Exec 阶段

#### Parameters

##### query

`string`

##### pre

[`PreResult`](../interfaces/PreResult.md)

#### Returns

`Promise`\<[`ExecResult`](../interfaces/ExecResult.md)\>
