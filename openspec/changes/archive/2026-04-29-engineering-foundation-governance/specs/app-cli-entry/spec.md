## ADDED Requirements

### Requirement: Shared CLI And MCP Interface Metadata
CLI commands and MCP tools SHALL be described by shared metadata sufficient for registration, validation, and documentation generation.

#### Scenario: Generate CLI docs
- **WHEN** CLI reference docs are generated
- **THEN** command names, options, descriptions, and examples come from the CLI command metadata

#### Scenario: Generate MCP docs
- **WHEN** MCP reference docs are generated
- **THEN** tool names, schemas, descriptions, and examples come from the MCP tool metadata

### Requirement: Interface Drift Detection
The project SHALL detect drift between implemented CLI/MCP interfaces and documented interfaces.

#### Scenario: Undocumented MCP tool
- **WHEN** a MCP tool is registered but missing from generated or checked docs
- **THEN** the docs check reports the mismatch

#### Scenario: Removed CLI command remains documented
- **WHEN** a CLI command is removed from implementation but still appears in checked docs
- **THEN** the docs check reports the stale command
