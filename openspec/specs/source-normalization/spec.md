# source-normalization Specification

## Purpose
TBD - created by archiving change unified-memory-hub-model. Update Purpose after archive.
## Requirements
### Requirement: Source Adapter Normalization
The system SHALL normalize every external source into canonical memory events or memory objects before persistence or dispatch.

#### Scenario: Normalize Hermes memory
- **WHEN** Hermes sends a memory event
- **THEN** the adapter records `source.id = "hermes"`, an actor descriptor when available, relevant scopes, visibility, domains, content blocks, and provenance

#### Scenario: Normalize IDE session data
- **WHEN** an IDE agent sends project or session activity
- **THEN** the adapter records source, project scope, session/task scope when present, and domain values suitable for activity or code context queries

#### Scenario: Normalize scanner output
- **WHEN** a code scanner sends repository analysis
- **THEN** the adapter preserves repository, commit, file, symbol, dependency, and language metadata in scopes, links, content blocks, or provenance

### Requirement: Required Query-Critical Fields
The system SHALL reject normalized objects that are missing required query-critical fields.

#### Scenario: Missing source
- **WHEN** a normalized memory object has no source descriptor
- **THEN** validation fails before persistence

#### Scenario: Missing scope or content
- **WHEN** a normalized memory object has no scopes or no content blocks
- **THEN** validation fails before persistence

### Requirement: Stable Provenance
The system SHALL attach provenance to every normalized object.

#### Scenario: Preserve event identity
- **WHEN** the source provides an event ID or URI
- **THEN** the object provenance records it for audit and later export

#### Scenario: Add ingest timestamp
- **WHEN** the source does not provide an ingestion timestamp
- **THEN** the system assigns `provenance.ingestedAt`

### Requirement: Adapter Isolation
The system SHALL keep source-specific parsing inside adapters.

#### Scenario: Add a new source
- **WHEN** Gemini, another IDE, or a document system is added
- **THEN** the change adds an adapter or adapter mapping without modifying unrelated query or storage logic

