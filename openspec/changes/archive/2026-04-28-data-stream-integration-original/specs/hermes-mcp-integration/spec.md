## ADDED Requirements

### Requirement: Hermes MCP Memory Access
The system SHALL expose MCP tools that allow Hermes to read and write MemoHub memory without knowing internal track implementation details.

#### Scenario: Hermes writes memory
- **WHEN** Hermes calls `memohub_write_memory` with project memory or business facts
- **THEN** the system ingests a `memory` event and stores the projection in `track-insight` with Hermes source metadata

#### Scenario: Hermes reads memory
- **WHEN** Hermes calls `memohub_read_memory` with a project-aware query
- **THEN** the system returns relevant memories with confidence, source, project, session, and evidence metadata

### Requirement: Hermes Repository Analysis Writeback
The system SHALL allow Hermes to write repository analysis, business analysis, and API capability findings through MCP.

#### Scenario: Hermes writes API capability analysis
- **WHEN** Hermes calls `memohub_write_repo_analysis` with API/component/function capability data
- **THEN** the system stores source projections in `track-source`, updates the API capability read model, and preserves source references

#### Scenario: Hermes writes business context
- **WHEN** Hermes writes business context related to a repository or project
- **THEN** the system stores facts in `track-insight` and may create provisional `track-wiki` summaries with the original CAS evidence

### Requirement: Shared Session State
The system SHALL allow Hermes and IDE MCP clients to update and read shared project/session/task state.

#### Scenario: Hermes updates task session state
- **WHEN** Hermes calls `memohub_write_session_state` with a `projectId`, `sessionId`, and optional `taskId`
- **THEN** the system records the session event in `track-stream` and updates the session state read model
