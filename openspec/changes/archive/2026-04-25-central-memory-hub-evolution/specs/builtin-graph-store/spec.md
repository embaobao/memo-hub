## ADDED Requirements

### Requirement: Triple-store graph storage
The system SHALL provide a `builtin:graph-store` tool to store and query entity-relation triples (subject, predicate, object).

#### Scenario: Link knowledge entities
- **WHEN** adding a fact about "Rust" being "loved by" "Developers"
- **THEN** a triple `(Rust, loved-by, Developers)` SHALL be stored in the graph index

### Requirement: Associative retrieval
The `builtin:graph-retriever` SHALL support finding related memories by traversing linked entities in the graph store.

#### Scenario: Find related context
- **WHEN** querying for "Rust" with relation depth 1
- **THEN** it SHALL return memories linked to "Rust" and its direct neighbor entities
