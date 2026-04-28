## ADDED Requirements

### Requirement: External Event Envelope Ingestion
The system SHALL provide an Integration Hub that accepts external events from Hermes, IDEs, MCP clients, and other trusted sources using a stable event envelope.

#### Scenario: Ingest Hermes memory event
- **WHEN** Hermes sends a `memory` event with `source`, `channel`, `projectId`, `confidence`, and `payload`
- **THEN** the Integration Hub validates the envelope, writes substantial content through CAS, and projects the event into a `Text2MemInstruction` for `track-insight`

#### Scenario: Reject invalid external event
- **WHEN** an external event omits required fields such as `source`, `kind`, `projectId`, or `payload`
- **THEN** the Integration Hub rejects the event before dispatching any Text2Mem instruction

### Requirement: Text2Mem Projection Boundary
The system SHALL convert accepted external events into one or more `Text2MemInstruction` objects and write them only through `MemoryKernel.dispatch()`.

#### Scenario: Project repository analysis
- **WHEN** Hermes sends a `repo_analysis` event
- **THEN** the system produces a Text2Mem `ADD` instruction for `track-source` with source metadata and CAS references

#### Scenario: Prevent direct track writes
- **WHEN** an integration projector needs to persist a projection
- **THEN** it uses `MemoryKernel.dispatch()` rather than directly invoking a track provider or storage backend

### Requirement: CAS-backed Deduplication
The system SHALL use `storage-flesh` CAS hashes as the body identity for substantial event content.

#### Scenario: Same content projected into multiple tracks
- **WHEN** the same code or analysis body is referenced by source and wiki projections
- **THEN** both projections reference the same `contentHash` and the body is stored once in CAS
