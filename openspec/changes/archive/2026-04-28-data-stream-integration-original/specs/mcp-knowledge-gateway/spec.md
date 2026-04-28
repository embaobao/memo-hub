## ADDED Requirements

### Requirement: Coding Context Query
The system SHALL expose an MCP query that returns coding-ready context for IDE clients.

#### Scenario: IDE requests coding context
- **WHEN** an IDE MCP client calls `memohub_get_coding_context` with `projectId`, optional `repo`, `currentFile`, `taskId`, `symbols`, and `query`
- **THEN** the system returns relevant memories, session state, habits, API capabilities, source references, business context, and wiki/source evidence

### Requirement: Project and Session Context Queries
The system SHALL expose MCP tools for project context and multi-session state.

#### Scenario: Query project context
- **WHEN** an MCP client calls `memohub_get_project_context` with a `projectId`
- **THEN** the system returns project facts, business context, active task/status information, and related source/wiki evidence

#### Scenario: Query session state
- **WHEN** an MCP client calls `memohub_get_session_state` with a `projectId` and optional `sessionId`
- **THEN** the system returns known session/task state across Hermes and IDE sessions

### Requirement: Habit and Memory Queries
The system SHALL expose MCP tools that retrieve project-aware memory and coding habits.

#### Scenario: Query habits for code generation
- **WHEN** an IDE MCP client asks for habits for a project or repository
- **THEN** the system returns relevant user/project coding preferences with confidence and source metadata

#### Scenario: Query project memory
- **WHEN** Hermes or an IDE asks for project memory
- **THEN** the system searches `track-insight` and related Soul indexes and returns results with evidence metadata
