## MODIFIED Requirements

### Requirement: Visibility Filtering
The system SHALL enforce visibility while resolving recall layers, and SHALL NOT use channel identity as a substitute for visibility or scope.

#### Scenario: Channel provenance does not override visibility
- **WHEN** a memory object belongs to a channel associated with the current Agent
- **THEN** it is still filtered by visibility and scope policy rather than becoming globally readable through channel match alone

### Requirement: Layered Recall Policy
The system SHALL preserve self/project/global recall order while allowing channel provenance to improve explanation and ranking.

#### Scenario: Prefer current bound channel in self layer
- **WHEN** Hermes queries recent activity after restoring its primary or session channel
- **THEN** self-layer recall can rank memories from the currently bound or recent governed channel higher while preserving self/project/global grouping

#### Scenario: Preserve cross-project attribution
- **WHEN** a query returns relevant global knowledge from another project
- **THEN** the response includes project and channel provenance so the caller can understand that the result is a cross-project reference rather than current-project truth
