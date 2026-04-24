## ADDED Requirements

### Requirement: JSONC parsing and Zod validation
The configuration system SHALL parse `~/.memohub/memohub.json` as JSONC (supporting comments) and validate the resulting object against a strict Zod schema.

#### Scenario: Valid JSONC with comments
- **WHEN** the config file contains `//` or `/* */` comments
- **THEN** it SHALL be parsed successfully without syntax errors

### Requirement: Environment variable deep-merging
The configuration system SHALL overlay environment variables starting with `MEMOHUB_` onto the file-based config. Double underscores (`__`) SHALL be used to denote nested properties.

#### Scenario: Deep overlay
- **WHEN** `MEMOHUB_AI__AGENTS__DEFAULT__MODEL=qwen` is set
- **THEN** the config property `ai.agents.default.model` SHALL be updated to `qwen`

### Requirement: Secret masking in reflection API
The system SHALL provide an API to reflect the current configuration, but it MUST mask sensitive fields (e.g., fields containing `apiKey`, `secret`, `token`).

#### Scenario: Masking API key
- **WHEN** the config contains `ai.providers[0].apiKey = "sk-12345"`
- **THEN** the reflection API SHALL return `ai.providers[0].apiKey = "***"`
