## ADDED Requirements

### Requirement: Connector Channel Memory Architecture
The system SHALL expose Hermes, CLI, and MCP through a Connector -> Channel -> Memory architecture.

#### Scenario: Connector writes through channel
- **WHEN** Hermes, CLI, or MCP writes memory
- **THEN** the request is first bound to a Channel and then passed to the Memory service
- **AND** the Connector does not bypass Channel governance or write directly to storage

#### Scenario: Internal normalization remains hidden
- **WHEN** Connector-facing documentation or tool descriptions explain the architecture
- **THEN** they describe Connector, Channel, and Memory as the top-level concepts
- **AND** they do not present implementation internals as product-level architecture concepts

### Requirement: Hermes Official Memory Provider Connector
The system SHALL provide a Hermes Connector implemented as an official Hermes memory provider plugin.

#### Scenario: Hermes discovers MemoHub provider
- **WHEN** Hermes loads the MemoHub memory provider plugin
- **THEN** the provider exposes the official contract methods required by Hermes
- **AND** the provider reports availability based on MemoHub CLI/runtime configuration

#### Scenario: Hermes saves provider config
- **WHEN** Hermes calls `save_config(values, hermes_home)`
- **THEN** the provider stores only plugin-local configuration under Hermes home
- **AND** it reuses the shared MemoHub data source instead of creating a separate Hermes-only data store

#### Scenario: Hermes initializes a session
- **WHEN** Hermes calls `initialize(session_id, **kwargs)`
- **THEN** MemoHub restores or creates a Channel with actor, source, project, session, and purpose metadata
- **AND** the provider returns readable channel status for diagnostics

### Requirement: Hermes Pure Memory Loop
The system SHALL support a complete Hermes pure long-term memory loop for preferences, habits, activities, project facts, and clarifications.

#### Scenario: Bootstrap Hermes memory
- **WHEN** Hermes calls `prefetch(query)` after initialization
- **THEN** MemoHub reads actor, project, and global memory in order
- **AND** returns a readable bootstrap summary with provenance and conflicts or gaps

#### Scenario: Sync conversation turn
- **WHEN** Hermes calls `sync_turn(user_message, assistant_message, metadata)`
- **THEN** MemoHub extracts candidate memories for preference, habit, activity, project fact, or clarification
- **AND** writes accepted candidates through the shared Memory service
- **AND** reports written, skipped, and conflicted items

#### Scenario: Preserve memory before compression
- **WHEN** Hermes calls `on_pre_compress(messages)`
- **THEN** MemoHub extracts high-value facts before context compression
- **AND** stores them as governed Memory records with channel and session provenance

#### Scenario: Summarize session end
- **WHEN** Hermes calls `on_session_end(messages)`
- **THEN** MemoHub writes a recent activity summary for the current actor/project/session

### Requirement: Channel Registry Package
The system SHALL provide Channel registry as a shared package rather than an app-local CLI implementation.

#### Scenario: Shared channel operations
- **WHEN** CLI, MCP, or Hermes Connector opens, lists, uses, checks, or closes a channel
- **THEN** each entry calls the shared Channel package
- **AND** the resulting channel state is consistent across all Connectors

#### Scenario: Channel-scoped cleanup
- **WHEN** a caller requests cleanup by actor, source, project, session, purpose, or channel
- **THEN** MemoHub uses registered Channel metadata to identify matching memory records
- **AND** dry-run is the default behavior
- **AND** destructive cleanup requires explicit confirmation

### Requirement: Memory Service Package
The system SHALL provide Memory service as the public business entry for memory operations.

#### Scenario: Shared read and write API
- **WHEN** CLI, MCP, or Hermes Connector needs to write, query, list, clarify, inspect logs, or clean memory
- **THEN** it calls the shared Memory service
- **AND** it does not duplicate normalization, projection, storage, or formatting logic in each Connector

#### Scenario: Readable memory listing
- **WHEN** a user or Agent lists memory without a specific project
- **THEN** MemoHub returns an actor-oriented overview with counts, recent items, and filter suggestions
- **AND** it does not imply a hidden default project

### Requirement: Connector Engineering Boundaries
The system SHALL keep Connector-specific runtimes isolated from core TypeScript packages.

#### Scenario: Hermes uses Python under connector directory
- **WHEN** the Hermes Connector requires Python and uv for official plugin compatibility
- **THEN** Python files, uv configuration, and plugin tests live under `connectors/hermes`
- **AND** TypeScript core packages do not depend on Python runtime packages

#### Scenario: CLI and MCP remain aligned
- **WHEN** a new memory, channel, log, config, or cleanup capability is exposed through CLI or MCP
- **THEN** both surfaces are updated through shared interface metadata and documentation
- **AND** MCP stdio responses remain valid JSON-RPC without non-protocol stdout output
