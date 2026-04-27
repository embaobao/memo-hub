## MODIFIED Requirements

### Requirement: Thread-Safe Dispatching
The kernel MUST be refactored to handle concurrent requests from multiple MCP/CLI clients.

#### Scenario: Simultaneous writes
- **WHEN** two Agents attempt to ADD memory at the same time
- **THEN** the kernel SHALL queue the requests and ensure LanceDB integrity.

### Requirement: Event Bus Exposure
The internal `EventEmitter` MUST expose events to a local socket for external monitoring by the TUI.
