[**Documentation**](../../../README.md)

***

# Class: ContentAddressableStorage

Defined in: [index.ts:6](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/storage-flesh/src/index.ts#L6)

## Constructors

### Constructor

> **new ContentAddressableStorage**(`rootPath`): `ContentAddressableStorage`

Defined in: [index.ts:10](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/storage-flesh/src/index.ts#L10)

#### Parameters

##### rootPath

`string`

#### Returns

`ContentAddressableStorage`

## Methods

### blobPath()

> **blobPath**(`hash`): `string`

Defined in: [index.ts:21](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/storage-flesh/src/index.ts#L21)

#### Parameters

##### hash

`string`

#### Returns

`string`

***

### buildContentRef()

> **buildContentRef**(`hash`): `string`

Defined in: [index.ts:138](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/storage-flesh/src/index.ts#L138)

#### Parameters

##### hash

`string`

#### Returns

`string`

***

### computeHash()

> **computeHash**(`content`): `string`

Defined in: [index.ts:15](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/storage-flesh/src/index.ts#L15)

#### Parameters

##### content

`string`

#### Returns

`string`

***

### delete()

> **delete**(`hash`): `Promise`\<`void`\>

Defined in: [index.ts:95](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/storage-flesh/src/index.ts#L95)

#### Parameters

##### hash

`string`

#### Returns

`Promise`\<`void`\>

***

### has()

> **has**(`hash`): `Promise`\<`boolean`\>

Defined in: [index.ts:86](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/storage-flesh/src/index.ts#L86)

#### Parameters

##### hash

`string`

#### Returns

`Promise`\<`boolean`\>

***

### listAllHashes()

> **listAllHashes**(): `Promise`\<`string`[]\>

Defined in: [index.ts:103](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/storage-flesh/src/index.ts#L103)

#### Returns

`Promise`\<`string`[]\>

***

### parseHashFromRef()

> **parseHashFromRef**(`ref`): `string` \| `null`

Defined in: [index.ts:142](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/storage-flesh/src/index.ts#L142)

#### Parameters

##### ref

`string`

#### Returns

`string` \| `null`

***

### read()

> **read**(`hash`): `Promise`\<`string`\>

Defined in: [index.ts:77](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/storage-flesh/src/index.ts#L77)

#### Parameters

##### hash

`string`

#### Returns

`Promise`\<`string`\>

***

### readVerified()

> **readVerified**(`hash`): `Promise`\<`string` \| `null`\>

Defined in: [index.ts:125](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/storage-flesh/src/index.ts#L125)

#### Parameters

##### hash

`string`

#### Returns

`Promise`\<`string` \| `null`\>

***

### write()

> **write**(`content`): `Promise`\<`string`\>

Defined in: [index.ts:49](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/storage-flesh/src/index.ts#L49)

#### Parameters

##### content

`string`

#### Returns

`Promise`\<`string`\>
