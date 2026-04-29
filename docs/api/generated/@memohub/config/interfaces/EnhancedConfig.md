[**Documentation**](../../../README.md)

***

# Interface: EnhancedConfig

Defined in: [index.ts:20](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/config/src/index.ts#L20)

## Properties

### \_sources?

> `optional` **\_sources?**: `string`[]

Defined in: [index.ts:21](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/config/src/index.ts#L21)

***

### $schema?

> `optional` **$schema?**: `string`

Defined in: [schema.ts:100](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/config/src/schema.ts#L100)

#### Inherited from

`MemoHubConfig.$schema`

***

### ai

> **ai**: `object`

Defined in: [schema.ts:111](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/config/src/schema.ts#L111)

#### agents

> **agents**: `Record`\<`string`, `objectOutputType`\<\{ `dimensions`: `ZodOptional`\<`ZodNumber`\>; `model`: `ZodString`; `provider`: `ZodString`; `system`: `ZodOptional`\<`ZodString`\>; `temperature`: `ZodOptional`\<`ZodNumber`\>; \}, `ZodTypeAny`, `"passthrough"`\>\>

#### providers

> **providers**: `objectOutputType`\<\{ `apiKey`: `ZodOptional`\<`ZodString`\>; `config`: `ZodOptional`\<`ZodRecord`\<`ZodString`, `ZodUnknown`\>\>; `id`: `ZodString`; `type`: `ZodString`; `url`: `ZodOptional`\<`ZodString`\>; \}, `ZodTypeAny`, `"passthrough"`\>[]

#### Inherited from

`MemoHubConfig.ai`

***

### configVersion

> **configVersion**: `string`

Defined in: [schema.ts:101](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/config/src/schema.ts#L101)

#### Inherited from

`MemoHubConfig.configVersion`

***

### dispatcher

> **dispatcher**: `object` & `object`

Defined in: [schema.ts:154](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/config/src/schema.ts#L154)

#### Type Declaration

##### fallback

> **fallback**: `string`

##### flow?

> `optional` **flow?**: `objectOutputType`\<\{ `agent`: `ZodOptional`\<`ZodString`\>; `input`: `ZodOptional`\<`ZodUnion`\<\[`ZodString`, `ZodRecord`\<`ZodString`, `ZodUnknown`\>\]\>\>; `on_fail`: `ZodOptional`\<`ZodUnion`\<\[`ZodLiteral`\<`"skip"`\>, `ZodObject`\<\{ `action`: ...; `fallback_tool`: ...; `limit`: ...; \}, `"strip"`, `ZodTypeAny`, \{ `action`: ...; `fallback_tool?`: ...; `limit?`: ...; \}, \{ `action`: ...; `fallback_tool?`: ...; `limit?`: ...; \}\>\]\>\>; `step`: `ZodString`; `timeout`: `ZodOptional`\<`ZodNumber`\>; `tool`: `ZodString`; \}, `ZodTypeAny`, `"passthrough"`\>[]

#### Inherited from

`MemoHubConfig.dispatcher`

***

### mcp

> **mcp**: `object`

Defined in: [schema.ts:136](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/config/src/schema.ts#L136)

#### enabled

> **enabled**: `boolean`

#### exposeStatus

> **exposeStatus**: `boolean`

#### exposeToolCatalog

> **exposeToolCatalog**: `boolean`

#### logPath

> **logPath**: `string`

#### statsResourceUri

> **statsResourceUri**: `string`

#### toolsResourceUri

> **toolsResourceUri**: `string`

#### transport

> **transport**: `"stdio"`

#### Inherited from

`MemoHubConfig.mcp`

***

### memory

> **memory**: `object`

Defined in: [schema.ts:147](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/config/src/schema.ts#L147)

#### operations

> **operations**: `string`[]

#### queryLayers

> **queryLayers**: `string`[]

#### views

> **views**: `string`[]

#### Inherited from

`MemoHubConfig.memory`

***

### routing

> **routing**: `object`

Defined in: [schema.ts:155](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/config/src/schema.ts#L155)

#### defaultTrack

> **defaultTrack**: `string`

#### enabled

> **enabled**: `boolean`

#### rules

> **rules**: `object`[]

#### Inherited from

`MemoHubConfig.routing`

***

### storage

> **storage**: `object`

Defined in: [schema.ts:127](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/config/src/schema.ts#L127)

#### blobPath

> **blobPath**: `string`

#### dimensions

> **dimensions**: `number`

#### root

> **root**: `string`

#### vectorDbPath

> **vectorDbPath**: `string`

#### vectorTable

> **vectorTable**: `string`

#### Inherited from

`MemoHubConfig.storage`

***

### system

> **system**: `object`

Defined in: [schema.ts:103](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/config/src/schema.ts#L103)

#### lang

> **lang**: `"zh"` \| `"en"` \| `"auto"`

#### log\_level

> **log\_level**: `"debug"` \| `"info"` \| `"warn"` \| `"error"`

#### root

> **root**: `string`

#### trace\_enabled

> **trace\_enabled**: `boolean`

#### Inherited from

`MemoHubConfig.system`

***

### tools

> **tools**: `objectOutputType`\<\{ `config`: `ZodOptional`\<`ZodRecord`\<`ZodString`, `ZodUnknown`\>\>; `exposed`: `ZodDefault`\<`ZodBoolean`\>; `id`: `ZodString`; `module`: `ZodOptional`\<`ZodString`\>; `optional`: `ZodDefault`\<`ZodBoolean`\>; `package`: `ZodOptional`\<`ZodString`\>; `type`: `ZodDefault`\<`ZodEnum`\<\[`"builtin"`, `"extension"`\]\>\>; \}, `ZodTypeAny`, `"passthrough"`\>[]

Defined in: [schema.ts:156](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/config/src/schema.ts#L156)

#### Inherited from

`MemoHubConfig.tools`

***

### tracks

> **tracks**: `objectOutputType`\<\{ `flow`: `ZodOptional`\<`ZodArray`\<`ZodObject`\<\{ `agent`: `ZodOptional`\<`ZodString`\>; `input`: `ZodOptional`\<`ZodUnion`\<\[`ZodString`, `ZodRecord`\<..., ...\>\]\>\>; `on_fail`: `ZodOptional`\<`ZodUnion`\<\[`ZodLiteral`\<...\>, `ZodObject`\<..., ..., ..., ..., ...\>\]\>\>; `step`: `ZodString`; `timeout`: `ZodOptional`\<`ZodNumber`\>; `tool`: `ZodString`; \}, `"passthrough"`, `ZodTypeAny`, `objectOutputType`\<\{ `agent`: `ZodOptional`\<`ZodString`\>; `input`: `ZodOptional`\<`ZodUnion`\<\[..., ...\]\>\>; `on_fail`: `ZodOptional`\<`ZodUnion`\<\[..., ...\]\>\>; `step`: `ZodString`; `timeout`: `ZodOptional`\<`ZodNumber`\>; `tool`: `ZodString`; \}, `ZodTypeAny`, `"passthrough"`\>, `objectInputType`\<\{ `agent`: `ZodOptional`\<`ZodString`\>; `input`: `ZodOptional`\<`ZodUnion`\<\[..., ...\]\>\>; `on_fail`: `ZodOptional`\<`ZodUnion`\<\[..., ...\]\>\>; `step`: `ZodString`; `timeout`: `ZodOptional`\<`ZodNumber`\>; `tool`: `ZodString`; \}, `ZodTypeAny`, `"passthrough"`\>\>, `"many"`\>\>; `flows`: `ZodOptional`\<`ZodRecord`\<`ZodString`, `ZodArray`\<`ZodObject`\<\{ `agent`: `ZodOptional`\<`ZodString`\>; `input`: `ZodOptional`\<`ZodUnion`\<\[..., ...\]\>\>; `on_fail`: `ZodOptional`\<`ZodUnion`\<\[..., ...\]\>\>; `step`: `ZodString`; `timeout`: `ZodOptional`\<`ZodNumber`\>; `tool`: `ZodString`; \}, `"passthrough"`, `ZodTypeAny`, `objectOutputType`\<\{ `agent`: `ZodOptional`\<`ZodString`\>; `input`: `ZodOptional`\<`ZodUnion`\<...\>\>; `on_fail`: `ZodOptional`\<`ZodUnion`\<...\>\>; `step`: `ZodString`; `timeout`: `ZodOptional`\<`ZodNumber`\>; `tool`: `ZodString`; \}, `ZodTypeAny`, `"passthrough"`\>, `objectInputType`\<\{ `agent`: `ZodOptional`\<`ZodString`\>; `input`: `ZodOptional`\<`ZodUnion`\<...\>\>; `on_fail`: `ZodOptional`\<`ZodUnion`\<...\>\>; `step`: `ZodString`; `timeout`: `ZodOptional`\<`ZodNumber`\>; `tool`: `ZodString`; \}, `ZodTypeAny`, `"passthrough"`\>\>, `"many"`\>\>\>; `id`: `ZodString`; \}, `ZodTypeAny`, `"passthrough"`\>[]

Defined in: [schema.ts:157](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/config/src/schema.ts#L157)

#### Inherited from

`MemoHubConfig.tracks`

***

### version?

> `optional` **version?**: `string`

Defined in: [schema.ts:102](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/config/src/schema.ts#L102)

#### Inherited from

`MemoHubConfig.version`
