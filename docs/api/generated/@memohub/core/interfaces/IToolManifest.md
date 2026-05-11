[**Documentation**](../../../README.md)

***

# Interface: IToolManifest

Defined in: [packages/core/src/tool-registry.ts:16](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/core/src/tool-registry.ts#L16)

工具元数据

## Extends

- [`ToolManifestConfig`](../../config/type-aliases/ToolManifestConfig.md)

## Indexable

> \[`k`: `string`\]: `unknown`

## Properties

### config?

> `optional` **config?**: `Record`\<`string`, `unknown`\>

Defined in: packages/config/dist/schema.d.ts:54

#### Inherited from

`ToolManifestConfig.config`

***

### exposed

> **exposed**: `boolean`

Defined in: packages/config/dist/schema.d.ts:55

#### Inherited from

`ToolManifestConfig.exposed`

***

### id

> **id**: `string`

Defined in: [packages/core/src/tool-registry.ts:17](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/core/src/tool-registry.ts#L17)

#### Overrides

`ToolManifestConfig.id`

***

### inputSchema

> **inputSchema**: `unknown`

Defined in: [packages/core/src/tool-registry.ts:19](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/core/src/tool-registry.ts#L19)

***

### module?

> `optional` **module?**: `string`

Defined in: packages/config/dist/schema.d.ts:53

#### Inherited from

`ToolManifestConfig.module`

***

### optional

> **optional**: `boolean`

Defined in: packages/config/dist/schema.d.ts:56

#### Inherited from

`ToolManifestConfig.optional`

***

### outputSchema

> **outputSchema**: `unknown`

Defined in: [packages/core/src/tool-registry.ts:20](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/core/src/tool-registry.ts#L20)

***

### package?

> `optional` **package?**: `string`

Defined in: packages/config/dist/schema.d.ts:52

#### Inherited from

`ToolManifestConfig.package`

***

### type

> **type**: `"builtin"` \| `"extension"`

Defined in: [packages/core/src/tool-registry.ts:18](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/core/src/tool-registry.ts#L18)

#### Overrides

`ToolManifestConfig.type`
