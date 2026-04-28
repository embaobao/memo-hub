## ADDED Requirements

### Requirement: API Capability Index
The system SHALL maintain a Soul-side API capability read model for fast lookup of repository libraries, components, functions, hooks, classes, and endpoints.

#### Scenario: Store component API capability
- **WHEN** a projected event describes a component or API capability
- **THEN** the system records symbol name, package/repo, kind, signature, params or props, examples, source references, confidence, and `contentHash`

#### Scenario: Query API capability by symbol
- **WHEN** an MCP client queries a component, package, function, or API name
- **THEN** the system returns matching API capability records before falling back to semantic vector retrieval

### Requirement: Code and Business Relation Index
The system SHALL maintain relation records that connect code symbols, APIs, tasks, projects, sessions, and business concepts.

#### Scenario: Store business implementation relation
- **WHEN** repository or business analysis identifies that a symbol implements a business concept
- **THEN** the system records an `implements` or `related_to` relation between the symbol and the business concept

#### Scenario: Retrieve code by business concept
- **WHEN** an MCP client asks which code supports a business feature
- **THEN** the system uses relation records and source indexes to return related symbols, files, source references, and evidence

### Requirement: Content Body Separation
The system SHALL keep large text/code/analysis bodies in CAS and keep structured read models as projections that reference `contentHash`.

#### Scenario: Hydrate API capability evidence
- **WHEN** an MCP query result includes a source or API capability record
- **THEN** the system can hydrate the original body from CAS using the stored `contentHash`
