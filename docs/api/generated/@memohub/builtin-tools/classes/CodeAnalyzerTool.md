[**Documentation**](../../../README.md)

***

# Class: CodeAnalyzerTool

Defined in: [code-analyzer.ts:10](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/builtin-tools/src/code-analyzer.ts#L10)

代码解析原子工具 (AST Code Analyzer)
职责: 基于 Tree-sitter 提取代码符号、结构和实体。

## Implements

- [`ITool`](../../core/interfaces/ITool.md)

## Constructors

### Constructor

> **new CodeAnalyzerTool**(): `CodeAnalyzerTool`

#### Returns

`CodeAnalyzerTool`

## Properties

### manifest

> **manifest**: `object`

Defined in: [code-analyzer.ts:11](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/builtin-tools/src/code-analyzer.ts#L11)

#### description

> **description**: `string` = `"深度解析代码 AST 并提取符号实体"`

#### exposed

> **exposed**: `boolean` = `true`

#### id

> **id**: `string` = `"builtin:code-analyzer"`

#### inputSchema

> **inputSchema**: `ZodObject`\<\{ `code`: `ZodString`; `language`: `ZodDefault`\<`ZodString`\>; \}, `"strip"`, `ZodTypeAny`, \{ `code`: `string`; `language`: `string`; \}, \{ `code`: `string`; `language?`: `string`; \}\>

#### optional

> **optional**: `boolean` = `false`

#### outputSchema

> **outputSchema**: `ZodObject`\<\{ `entities`: `ZodArray`\<`ZodString`, `"many"`\>; `symbols`: `ZodArray`\<`ZodAny`, `"many"`\>; \}, `"strip"`, `ZodTypeAny`, \{ `entities`: `string`[]; `symbols`: `any`[]; \}, \{ `entities`: `string`[]; `symbols`: `any`[]; \}\>

#### type

> **type**: `"builtin"`

#### Implementation of

[`ITool`](../../core/interfaces/ITool.md).[`manifest`](../../core/interfaces/ITool.md#manifest)

## Methods

### execute()

> **execute**(`input`, `resources`, `context`): `Promise`\<`any`\>

Defined in: [code-analyzer.ts:30](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/builtin-tools/src/code-analyzer.ts#L30)

#### Parameters

##### input

`any`

##### resources

[`IHostResources`](../../core/interfaces/IHostResources.md)

##### context

[`ExecutionContext`](../../core/interfaces/ExecutionContext.md)

#### Returns

`Promise`\<`any`\>

#### Implementation of

[`ITool`](../../core/interfaces/ITool.md).[`execute`](../../core/interfaces/ITool.md#execute)
