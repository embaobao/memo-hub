# daemon-kernel Specification

## Purpose
TBD

## Requirements

### Requirement: Daemon process singleton
The system SHALL ensure that only one instance of the MemoHub Daemon is running at any given time using a file lock mechanism.

#### Scenario: Prevent duplicate daemon
- **WHEN** a second instance of `memohub serve` is started while one is already running
- **THEN** the second instance SHALL exit with an error message indicating the daemon is already active

### Requirement: SSE and WebSocket support
The Daemon SHALL provide both Server-Sent Events (SSE) and WebSocket transports for real-time memory updates and MCP tool communication.

#### Scenario: Connect via SSE
- **WHEN** a client connects to the `/mcp/sse` endpoint
- **THEN** it SHALL receive a continuous stream of events and be able to send JSON-RPC commands
