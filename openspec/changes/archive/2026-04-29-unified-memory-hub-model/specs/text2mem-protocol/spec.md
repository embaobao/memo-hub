## MODIFIED Requirements

### Requirement: Define Text2Mem five-element JSON contract
The system SHALL continue to support `Text2MemInstruction` for dispatch, and SHALL also define canonical memory event/object contracts above dispatch-level instructions.

#### Scenario: Existing instruction remains valid
- **WHEN** existing code constructs a Text2MemInstruction with op, trackId, and payload
- **THEN** validation continues to support the existing dispatch path during migration

#### Scenario: Canonical memory object can be converted to instruction
- **WHEN** a canonical memory object needs execution through existing internals
- **THEN** an adapter can convert it to one or more Text2MemInstruction objects without exposing `trackId` as the product-level model

## ADDED Requirements

### Requirement: Canonical Memory Event Contract
The protocol package SHALL define a canonical event contract for source adapters.

#### Scenario: Normalize external event
- **WHEN** an adapter receives source input from an agent, IDE, CLI, MCP, scanner, document, user, or external service
- **THEN** it can represent the input as a canonical event before creating a MemoryObject

### Requirement: Canonical Memory Object Validation
The protocol package SHALL provide validation for the canonical memory object core fields.

#### Scenario: Validate required fields
- **WHEN** a MemoryObject is created
- **THEN** validation ensures required query-critical fields exist before persistence
