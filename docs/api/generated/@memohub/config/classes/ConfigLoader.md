[**Documentation**](../../../README.md)

***

# Class: ConfigLoader

Defined in: [index.ts:24](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/config/src/index.ts#L24)

## Constructors

### Constructor

> **new ConfigLoader**(`customPath?`): `ConfigLoader`

Defined in: [index.ts:28](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/config/src/index.ts#L28)

#### Parameters

##### customPath?

`string`

#### Returns

`ConfigLoader`

## Methods

### getConfig()

> **getConfig**(): [`EnhancedConfig`](../interfaces/EnhancedConfig.md)

Defined in: [index.ts:134](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/config/src/index.ts#L134)

#### Returns

[`EnhancedConfig`](../interfaces/EnhancedConfig.md)

***

### getMaskedConfig()

> **getMaskedConfig**(): `Record`\<`string`, `any`\>

Defined in: [index.ts:138](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/config/src/index.ts#L138)

#### Returns

`Record`\<`string`, `any`\>

***

### load()

> **load**(): [`EnhancedConfig`](../interfaces/EnhancedConfig.md)

Defined in: [index.ts:48](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/config/src/index.ts#L48)

#### Returns

[`EnhancedConfig`](../interfaces/EnhancedConfig.md)

***

### save()

> **save**(): `void`

Defined in: [index.ts:142](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/config/src/index.ts#L142)

#### Returns

`void`

***

### initDefault()

> `static` **initDefault**(`targetPath?`): `void`

Defined in: [index.ts:152](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/config/src/index.ts#L152)

#### Parameters

##### targetPath?

`string` = `"~/.memohub/memohub.json"`

#### Returns

`void`
