[**Documentation**](../../../README.md)

***

# Function: extractEntitiesFromText()

> **extractEntitiesFromText**(`text`, `options?`): `string`[]

Defined in: [packages/protocol/src/text-entities.ts:154](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/protocol/src/text-entities.ts#L154)

从纯文本中抽取通用实体 token

覆盖的实体类型：
- 驼峰词：lowerCamelCase / PascalCase（工程标识符高频）
- 带点标识符：a.b / a.b.c（配置项/包名/模块路径常见）
- 版本号：v1.2.3 / 1.2.0-beta.1（依赖版本/协议版本常见）
- 缩写：API / MCP / HTTP2（工程术语常见）

返回：
- 去重后的 token 数组（按出现顺序）

## Parameters

### text

`string`

### options?

[`TextEntityExtractorOptions`](../interfaces/TextEntityExtractorOptions.md) = `{}`

## Returns

`string`[]
