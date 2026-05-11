[**Documentation**](../../../README.md)

***

# Class: ErrorFormatter

Defined in: [packages/protocol/src/errors.ts:185](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/protocol/src/errors.ts#L185)

错误格式化工具

## Constructors

### Constructor

> **new ErrorFormatter**(): `ErrorFormatter`

#### Returns

`ErrorFormatter`

## Methods

### format()

> `static` **format**(`error`): `string`

Defined in: [packages/protocol/src/errors.ts:189](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/protocol/src/errors.ts#L189)

格式化错误为用户友好的消息

#### Parameters

##### error

[`IntegrationHubError`](IntegrationHubError.md)

#### Returns

`string`

***

### formatJSON()

> `static` **formatJSON**(`error`): `string`

Defined in: [packages/protocol/src/errors.ts:206](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/protocol/src/errors.ts#L206)

格式化错误为 JSON（用于日志）

#### Parameters

##### error

[`IntegrationHubError`](IntegrationHubError.md)

#### Returns

`string`
