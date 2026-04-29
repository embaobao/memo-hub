# unified-memory-object Specification

## Purpose
TBD - created by archiving change unified-memory-hub-model. Update Purpose after archive.
## Requirements
### Requirement: Canonical Memory Object
The system SHALL define a canonical `MemoryObject` contract for all persisted memory records.

#### Scenario: Create a valid memory object
- **WHEN** a source adapter normalizes an incoming event
- **THEN** it produces a `MemoryObject` containing `id`, `kind`, `source`, `scopes`, `visibility`, `domains`, `state`, `content`, `provenance`, `createdAt`, and `updatedAt`

#### Scenario: Preserve source-specific metadata
- **WHEN** a source provides fields that are not part of the stable core model
- **THEN** the system preserves them under `source.metadata`, `provenance.metadata`, content block metadata, or object metadata

### Requirement: Open Source Descriptor
The system SHALL model sources with a descriptor instead of a closed enum.

#### Scenario: Ingest Gemini memory
- **WHEN** an event arrives from Gemini
- **THEN** the memory object can represent it as `source.type = "agent"`, `source.id = "gemini"`, and `source.vendor = "google"` without changing protocol enums

#### Scenario: Ingest future source type
- **WHEN** a future source type such as browser extension, CI scanner, meeting system, or document system is introduced
- **THEN** it can be represented through descriptor fields and metadata without changing required top-level fields

### Requirement: Multi-Scope Attachment
The system SHALL allow one memory object to attach to multiple scopes.

#### Scenario: Agent task in project
- **WHEN** Hermes creates memory during a project task
- **THEN** the object can include scopes for agent, project, task, and session simultaneously

#### Scenario: Global memory
- **WHEN** memory is intended for cross-project use
- **THEN** the object can include a global scope and `visibility = "global"`

### Requirement: Multi-Domain Classification
The system SHALL allow one memory object to belong to one or more domains.

#### Scenario: Code memory with business meaning
- **WHEN** a code analysis also records component responsibility
- **THEN** the object can include domains such as `code-intelligence` and `project-knowledge`

### Requirement: Content Blocks
The system SHALL represent content as one or more typed content blocks.

#### Scenario: Code scan with structured data
- **WHEN** a scanner emits code text plus AST JSON
- **THEN** the memory object can store a `code` content block and a `json` content block

#### Scenario: Binary or external artifact
- **WHEN** content is stored outside the object body
- **THEN** a content block can reference it through `uri` and `mimeType`

