# text2mem-protocol Specification

## Purpose
The text2mem-protocol capability defines the formal communication contract between MemoHub components, specifying the 12 atomic operations and the five-element JSON instruction format.
## Requirements
### Requirement: Define Text2Mem operation enumeration
The system SHALL define a `MemoOp` enum containing exactly 12 atomic operations: ADD, RETRIEVE, UPDATE, DELETE, MERGE, CLARIFY, LIST, EXPORT, DISTILL, ANCHOR, DIFF, SYNC.

#### Scenario: Enum contains all 12 operations
- **WHEN** the MemoOp enum is inspected at runtime
- **THEN** it contains exactly the values: ADD, RETRIEVE, UPDATE, DELETE, MERGE, CLARIFY, LIST, EXPORT, DISTILL, ANCHOR, DIFF, SYNC

### Requirement: Define Text2Mem five-element JSON contract
The system SHALL continue to support `Text2MemInstruction` for dispatch, and SHALL also define canonical memory event/object contracts above dispatch-level instructions.

#### Scenario: Existing instruction remains valid
- **WHEN** existing code constructs a Text2MemInstruction with op, trackId, and payload
- **THEN** validation continues to support the existing dispatch path during migration

#### Scenario: Canonical memory object can be converted to instruction
- **WHEN** a canonical memory object needs execution through existing internals
- **THEN** an adapter can convert it to one or more Text2MemInstruction objects without exposing `trackId` as the product-level model

### Requirement: Validate instruction schema at runtime
The system SHALL provide a `validateInstruction` function that uses Zod schema validation to verify a Text2MemInstruction at runtime, returning a typed result or error.

#### Scenario: Validate a correct instruction
- **WHEN** validateInstruction is called with a valid JSON object containing op, trackId, and payload
- **THEN** it returns a success result with the parsed Text2MemInstruction

#### Scenario: Reject malformed instruction
- **WHEN** validateInstruction is called with an object missing required fields
- **THEN** it returns a failure result with Zod error details

### Requirement: Define instruction result type
The system SHALL define a `Text2MemResult` interface with fields: `success` (boolean), `data` (optional any), `error` (optional string), `meta` (optional Record<string, any>).

#### Scenario: Successful result
- **WHEN** a track provider completes an instruction successfully
- **THEN** it returns Text2MemResult with success=true and data containing the result

#### Scenario: Error result
- **WHEN** a track provider fails to execute an instruction
- **THEN** it returns Text2MemResult with success=false and error containing the error message

### Requirement: Zero external runtime dependencies
The `protocol` package SHALL have zero external runtime dependencies (only devDependencies for testing and Zod for runtime validation).

#### Scenario: Check package dependencies
- **WHEN** the protocol package's package.json is inspected
- **THEN** dependencies field SHALL only contain "zod"

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

