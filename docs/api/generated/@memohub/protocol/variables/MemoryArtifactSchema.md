[**Documentation**](../../../README.md)

***

# Variable: MemoryArtifactSchema

> `const` **MemoryArtifactSchema**: `ZodObject`\<\{ `checksum`: `ZodOptional`\<`ZodString`\>; `createdAt`: `ZodString`; `id`: `ZodString`; `kind`: `ZodString`; `memoryIds`: `ZodArray`\<`ZodString`, `"many"`\>; `metadata`: `ZodOptional`\<`ZodRecord`\<`ZodString`, `ZodAny`\>\>; `source`: `ZodObject`\<\{ `id`: `ZodString`; `metadata`: `ZodOptional`\<`ZodRecord`\<`ZodString`, `ZodAny`\>\>; `name`: `ZodOptional`\<`ZodString`\>; `type`: `ZodString`; `vendor`: `ZodOptional`\<`ZodString`\>; \}, `"strip"`, `ZodTypeAny`, \{ `id`: `string`; `metadata?`: `Record`\<`string`, `any`\>; `name?`: `string`; `type`: `string`; `vendor?`: `string`; \}, \{ `id`: `string`; `metadata?`: `Record`\<`string`, `any`\>; `name?`: `string`; `type`: `string`; `vendor?`: `string`; \}\>; `uri`: `ZodOptional`\<`ZodString`\>; \}, `"strip"`, `ZodTypeAny`, \{ `checksum?`: `string`; `createdAt`: `string`; `id`: `string`; `kind`: `string`; `memoryIds`: `string`[]; `metadata?`: `Record`\<`string`, `any`\>; `source`: \{ `id`: `string`; `metadata?`: `Record`\<`string`, `any`\>; `name?`: `string`; `type`: `string`; `vendor?`: `string`; \}; `uri?`: `string`; \}, \{ `checksum?`: `string`; `createdAt`: `string`; `id`: `string`; `kind`: `string`; `memoryIds`: `string`[]; `metadata?`: `Record`\<`string`, `any`\>; `source`: \{ `id`: `string`; `metadata?`: `Record`\<`string`, `any`\>; `name?`: `string`; `type`: `string`; `vendor?`: `string`; \}; `uri?`: `string`; \}\>

Defined in: [packages/protocol/src/governance.ts:105](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/protocol/src/governance.ts#L105)
