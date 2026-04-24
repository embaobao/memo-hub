# observation-kernel Specification

## Purpose
TBD - created by archiving change unified-system-config. Update Purpose after archive.
## Requirements
### Requirement: TraceID generation and propagation
The system SHALL generate a unique `TraceID` (UUID) for every Flow execution and propagate it to all subsequent tool executions within the Flow context.

#### Scenario: Sub-step tracking
- **WHEN** a track executes a flow with multiple tools
- **THEN** each tool execution logs events with the same `TraceID` and a unique `SpanID`

### Requirement: Sandboxing via SafeRunner
The Engine SHALL wrap tool executions in a `SafeRunner` that handles timeouts and isolates exceptions, preventing them from crashing the main process unless explicitly configured otherwise.

#### Scenario: Tool timeout isolation
- **WHEN** a tool execution exceeds the configured `timeout`
- **THEN** the `SafeRunner` SHALL abort the execution, log the error with its `TraceID`, and execute the `on_fail` strategy without crashing the CLI

