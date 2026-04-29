[**Documentation**](../../../README.md)

***

# Variable: ProvenanceSchema

> `const` **ProvenanceSchema**: `ZodObject`\<\{ `ingestedAt`: `ZodString`; `metadata`: `ZodOptional`\<`ZodRecord`\<`ZodString`, `ZodAny`\>\>; `observedAt`: `ZodOptional`\<`ZodString`\>; `operationId`: `ZodOptional`\<`ZodString`\>; `parentIds`: `ZodOptional`\<`ZodArray`\<`ZodString`, `"many"`\>\>; `sourceEventId`: `ZodOptional`\<`ZodString`\>; `traceId`: `ZodOptional`\<`ZodString`\>; \}, `"strip"`, `ZodTypeAny`, \{ `ingestedAt`: `string`; `metadata?`: `Record`\<`string`, `any`\>; `observedAt?`: `string`; `operationId?`: `string`; `parentIds?`: `string`[]; `sourceEventId?`: `string`; `traceId?`: `string`; \}, \{ `ingestedAt`: `string`; `metadata?`: `Record`\<`string`, `any`\>; `observedAt?`: `string`; `operationId?`: `string`; `parentIds?`: `string`[]; `sourceEventId?`: `string`; `traceId?`: `string`; \}\>

Defined in: packages/protocol/src/memory-object.ts:198
