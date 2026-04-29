## ADDED Requirements

### Requirement: Documentation Source Classes
The project SHALL classify documentation as authored, generated, or checked.

#### Scenario: Generated API docs
- **WHEN** API reference documentation is needed
- **THEN** it is generated from TypeDoc or equivalent source metadata rather than manually rewritten by an Agent

#### Scenario: Authored architecture docs
- **WHEN** architecture decisions are documented
- **THEN** they remain authored docs and link to the relevant OpenSpec change

### Requirement: Documentation Generation Commands
The project SHALL provide repeatable commands for generating API, CLI, MCP, package, and OpenSpec indexes.

#### Scenario: Generate API reference
- **WHEN** `docs:api` is run
- **THEN** public package API documentation is generated into a stable docs location

#### Scenario: Generate command references
- **WHEN** CLI or MCP command reference generation is run
- **THEN** documented commands and tools come from shared command/tool metadata

### Requirement: Documentation Drift Check
The project SHALL provide a documentation check that detects stale generated docs and invalid internal references.

#### Scenario: Stale command documentation
- **WHEN** a CLI command is renamed without updating generated docs
- **THEN** `docs:check` fails or reports the stale reference

#### Scenario: Broken internal link
- **WHEN** a docs page links to a missing local file
- **THEN** `docs:check` reports the broken link

### Requirement: OpenSpec Traceability
Architecture and implementation docs SHALL reference the OpenSpec change that introduced or changed the behavior.

#### Scenario: Unified memory architecture docs
- **WHEN** a doc describes the unified memory model
- **THEN** it links to the corresponding OpenSpec change or final spec
