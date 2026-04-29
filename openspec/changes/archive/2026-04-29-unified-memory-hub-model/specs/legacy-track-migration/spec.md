## ADDED Requirements

### Requirement: Track as Internal Transition Detail
The system SHALL stop treating `track-*` as the primary user-facing architecture concept for new APIs and documents.

#### Scenario: New API documentation
- **WHEN** new API or integration docs describe memory operations
- **THEN** they describe memory objects, domains, scopes, visibility, and query views rather than asking users to choose tracks

### Requirement: No Track-Facing Runtime Surface
The system SHALL remove track-facing controls from the new CLI/MCP runtime surface.

#### Scenario: CLI write path
- **WHEN** a user writes memory through CLI
- **THEN** the command accepts source/project/category/file inputs and does not accept `--track`

#### Scenario: MCP tools
- **WHEN** the MCP server registers tools
- **THEN** it registers unified ingest/query/agent-operation tools and does not register `memohub_add`, `memohub_search`, or `memohub_delete`

### Requirement: Domain Handler Migration Path
The system SHALL define a migration path from legacy tracks to domain handlers.

#### Scenario: Source track migration
- **WHEN** `track-source` behavior is migrated
- **THEN** equivalent behavior is represented under the `code-intelligence` domain handler or projection executor

#### Scenario: Insight track migration
- **WHEN** `track-insight` behavior is migrated
- **THEN** equivalent behavior is represented under the `project-knowledge` and `habit-convention` domains as appropriate

### Requirement: Reject Legacy Query Shape
The system SHALL reject old query shapes on new MCP query tools.

#### Scenario: MCP client sends old type-based query
- **WHEN** a client sends `type=memory` or `type=coding_context`
- **THEN** input validation fails because the new query contract requires a named `view`

### Requirement: No New Runtime Dependency on Tracks
The system SHALL not depend on existing `track-*` packages from new CLI/MCP runtime code.

#### Scenario: Phase one implementation
- **WHEN** phase one ships
- **THEN** old packages may still exist in the repository, but `apps/cli` does not import or register them
