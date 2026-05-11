[**Documentation**](../../../README.md)

***

# Interface: TextEntityExtractorOptions

Defined in: [packages/protocol/src/text-entities.ts:14](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/protocol/src/text-entities.ts#L14)

通用文本实体抽取器（用于 GBrain 写入时填充 entities）

设计目标：
1) 轻量：仅做"可解释的正则抽取"，不引入重依赖，不做 NLP 分词
2) 可控：支持按开关启用/关闭某类实体，并限制最大实体数量，避免噪声爆炸
3) 稳定：保持"按出现顺序输出 + 去重"，保证同一文本多次写入结果一致

注意：
- entities 的用途是"实体纽带"（跨轨检索加权/过滤），不是精准命名实体识别
- 因此这里更偏向抽取工程语料中的"标识符/版本号/缩写"等可复用 token

## Properties

### enabled?

> `optional` **enabled?**: `boolean`

Defined in: [packages/protocol/src/text-entities.ts:22](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/protocol/src/text-entities.ts#L22)

是否启用实体抽取

说明：
- false：直接返回空数组（用于在某些场景关闭增强能力）
- true / undefined：按其它选项抽取

***

### includeAcronym?

> `optional` **includeAcronym?**: `boolean`

Defined in: [packages/protocol/src/text-entities.ts:50](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/protocol/src/text-entities.ts#L50)

是否抽取缩写（API / MCP / HTTP2 等）

***

### includeCamelCase?

> `optional` **includeCamelCase?**: `boolean`

Defined in: [packages/protocol/src/text-entities.ts:35](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/protocol/src/text-entities.ts#L35)

是否抽取驼峰词（camelCase / PascalCase）

***

### includeDottedIdentifier?

> `optional` **includeDottedIdentifier?**: `boolean`

Defined in: [packages/protocol/src/text-entities.ts:40](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/protocol/src/text-entities.ts#L40)

是否抽取带点标识符（a.b / config.embedding.url）

***

### includeVersion?

> `optional` **includeVersion?**: `boolean`

Defined in: [packages/protocol/src/text-entities.ts:45](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/protocol/src/text-entities.ts#L45)

是否抽取版本号（v1.2.3 / 1.2.0-beta.1 等）

***

### maxEntities?

> `optional` **maxEntities?**: `number`

Defined in: [packages/protocol/src/text-entities.ts:30](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/protocol/src/text-entities.ts#L30)

最大实体数量（超过会截断）

说明：
- 该限制是"写入侧保护阀"，避免长文/日志把 entities 填满导致无意义的噪声与索引膨胀

***

### maxLength?

> `optional` **maxLength?**: `number`

Defined in: [packages/protocol/src/text-entities.ts:60](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/protocol/src/text-entities.ts#L60)

最长 token 长度（避免把超长 hash/url 误认为实体）

***

### minLength?

> `optional` **minLength?**: `number`

Defined in: [packages/protocol/src/text-entities.ts:55](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/protocol/src/text-entities.ts#L55)

最短 token 长度（过短的 token 往往噪声更大）
