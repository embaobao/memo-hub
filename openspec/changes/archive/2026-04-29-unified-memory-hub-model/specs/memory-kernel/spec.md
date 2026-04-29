## MODIFIED Requirements

### Requirement: Dispatch instructions to tracks
The system SHALL keep `MemoryKernel.dispatch()` as the execution boundary, while allowing higher-level planners to work with canonical memory objects and query views.

#### Scenario: Dispatch legacy instruction
- **WHEN** existing code dispatches a Text2MemInstruction
- **THEN** MemoryKernel routes it through the current execution path

#### Scenario: Execute canonical memory object via adapter
- **WHEN** a planner needs to execute a canonical memory object through existing internals
- **THEN** it converts the object to one or more dispatch instructions and preserves canonical metadata

## ADDED Requirements

### Requirement: Query Planner Boundary
The system SHALL introduce a query planning boundary above dispatch for layered recall.

#### Scenario: Layered query
- **WHEN** a caller requests a context view
- **THEN** the query planner resolves self, project, and global recall scopes before dispatching retrieval operations

### Requirement: Context View Assembly
The system SHALL assemble query results into named context views.

#### Scenario: Assemble coding context
- **WHEN** coding context is requested
- **THEN** the system returns a structured view with layer attribution, source metadata, and conflicts or gaps
