## ADDED Requirements

### Requirement: Adapter Manifest
The system SHALL define a manifest contract for source adapters.

#### Scenario: Register adapter
- **WHEN** an adapter is registered
- **THEN** it declares id, source type, supported operations, required config keys, optional credential refs, output event kinds, and health check capability

#### Scenario: Discover adapters
- **WHEN** CLI or MCP lists adapter capabilities
- **THEN** the response includes registered adapter manifests without exposing credential values

### Requirement: Adapter Execution
The system SHALL execute adapters through a common runtime boundary.

#### Scenario: Run scan
- **WHEN** a user or Agent runs an adapter scan
- **THEN** the runtime invokes the adapter with resolved config, redacted credentials, scan policy, and previous cursor when available

#### Scenario: Dry run
- **WHEN** dry run mode is requested
- **THEN** the adapter reports planned reads and event counts without persisting memory objects

### Requirement: Incremental Cursor
The system SHALL preserve adapter cursors for incremental synchronization.

#### Scenario: Store cursor
- **WHEN** an adapter completes a scan
- **THEN** the runtime stores cursor metadata such as commit SHA, manifest hash, lockfile hash, or registry etag

#### Scenario: Resume scan
- **WHEN** the adapter runs again for the same source and scope
- **THEN** it receives the prior cursor and can skip unchanged inputs

### Requirement: Normalized Event Output
The system SHALL require adapters to output normalized memory events or canonical memory events.

#### Scenario: Emit memory event
- **WHEN** an adapter emits repository, dependency, API, or package facts
- **THEN** each event includes source descriptor, channel, project/workspace scope, confidence, payload text, and provenance metadata

#### Scenario: Reject invalid output
- **WHEN** adapter output is missing query-critical fields
- **THEN** the runtime rejects it before persistence and records the failure in the scan report

### Requirement: Credential Redaction
The system SHALL prevent adapter credentials from entering memory content, metadata, generated docs, or logs.

#### Scenario: Use private token
- **WHEN** an adapter uses a GitLab or registry token
- **THEN** the token is available only to the adapter execution context and is redacted from all events and reports

