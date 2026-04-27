## ADDED Requirements

### Requirement: Persistent Lifecycle
The system SHALL support a `memohub daemon start` command that initializes the MemoryKernel and keeps it running in the background.

#### Scenario: Shared context across sessions
- **WHEN** the daemon is running
- **THEN** multiple CLI or MCP clients SHALL connect to the same LanceDB instance without locking errors.

### Requirement: Health Monitoring
The daemon SHALL expose a `/health` endpoint and emit heartbeat events via a local socket/port.
