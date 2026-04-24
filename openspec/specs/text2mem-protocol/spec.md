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
The system SHALL define a `Text2MemInstruction` interface with five fields: `op` (MemoOp), `trackId` (string), `payload` (any), `context` (optional Record<string, any>), `meta` (optional Record<string, any>).

#### Scenario: Create a valid instruction
- **WHEN** a Text2MemInstruction is constructed with op=ADD, trackId="track-insight", payload={text: "hello"}
- **THEN** the instruction is valid and contains all five fields with context and meta as undefined

#### Scenario: Reject invalid operation
- **WHEN** a Text2MemInstruction is constructed with op="INVALID" (not in MemoOp enum)
- **THEN** validation SHALL fail with a descriptive error message

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
