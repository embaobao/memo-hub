[**Documentation**](../../../README.md)

***

# Function: applyEnvOverrides()

> **applyEnvOverrides**(`config`): `Record`\<`string`, `any`\>

Defined in: [utils.ts:10](https://github.com/embaobao/memo-hub/blob/4f7429d0489d39abf3013db09992428b2e6ea781/packages/config/src/utils.ts#L10)

Apply environment variable overrides using MEMOHUB_ prefix and __ separator.
Example: MEMOHUB_AI__AGENTS__EMBEDDER__MODEL=llama3 -> config.ai.agents.embedder.model = "llama3"

## Parameters

### config

`Record`\<`string`, `any`\>

## Returns

`Record`\<`string`, `any`\>
