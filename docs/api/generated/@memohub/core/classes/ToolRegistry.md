[**Documentation**](../../../README.md)

***

# Class: ToolRegistry

Defined in: [packages/core/src/tool-registry.ts:38](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/core/src/tool-registry.ts#L38)

原子工具注册中心

## Constructors

### Constructor

> **new ToolRegistry**(): `ToolRegistry`

#### Returns

`ToolRegistry`

## Methods

### get()

> **get**(`id`): [`ITool`](../interfaces/ITool.md)

Defined in: [packages/core/src/tool-registry.ts:51](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/core/src/tool-registry.ts#L51)

获取工具 (支持简写，如 "cas" 匹配 "builtin:cas")

#### Parameters

##### id

`string`

#### Returns

[`ITool`](../interfaces/ITool.md)

***

### list()

> **list**(): [`ITool`](../interfaces/ITool.md)\<`any`, `any`\>[]

Defined in: [packages/core/src/tool-registry.ts:63](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/core/src/tool-registry.ts#L63)

列出所有已加载节点

#### Returns

[`ITool`](../interfaces/ITool.md)\<`any`, `any`\>[]

***

### loadExtensions()

> **loadExtensions**(`configs`): `Promise`\<`void`\>

Defined in: [packages/core/src/tool-registry.ts:70](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/core/src/tool-registry.ts#L70)

动态加载配置中定义的扩展工具 (TBD)

#### Parameters

##### configs

`objectOutputType`\<\{ `config`: `ZodOptional`\<`ZodRecord`\<`ZodString`, `ZodUnknown`\>\>; `exposed`: `ZodDefault`\<`ZodBoolean`\>; `id`: `ZodString`; `module`: `ZodOptional`\<`ZodString`\>; `optional`: `ZodDefault`\<`ZodBoolean`\>; `package`: `ZodOptional`\<`ZodString`\>; `type`: `ZodDefault`\<`ZodEnum`\<\[`"builtin"`, `"extension"`\]\>\>; \}, `ZodTypeAny`, `"passthrough"`\>[]

#### Returns

`Promise`\<`void`\>

***

### register()

> **register**(`tool`): `void`

Defined in: [packages/core/src/tool-registry.ts:44](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/core/src/tool-registry.ts#L44)

注册工具节点

#### Parameters

##### tool

[`ITool`](../interfaces/ITool.md)

#### Returns

`void`
