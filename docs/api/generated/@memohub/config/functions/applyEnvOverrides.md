[**Documentation**](../../../README.md)

***

# Function: applyEnvOverrides()

> **applyEnvOverrides**(`config`): `Record`\<`string`, `any`\>

Defined in: [utils.ts:10](https://github.com/embaobao/memo-hub/blob/ea96329ee7b59e412642bd4fa52bf38a845c560c/packages/config/src/utils.ts#L10)

Apply environment variable overrides using MEMOHUB_ prefix and __ separator.
Example: MEMOHUB_AI__AGENTS__EMBEDDER__MODEL=llama3 -> config.ai.agents.embedder.model = "llama3"

## Parameters

### config

`Record`\<`string`, `any`\>

## Returns

`Record`\<`string`, `any`\>
