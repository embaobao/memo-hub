## ADDED Requirements

### Requirement: Managed Channel Registry
The system SHALL manage channels as first-class registry entries rather than treating them as unconstrained free-form strings.

#### Scenario: Create channel entry
- **WHEN** an Agent or tool opens a channel
- **THEN** the system creates or restores a registry entry with owner Agent, source, purpose, project/workspace binding, status, timestamps, and stable channel ID

#### Scenario: Validate channel naming
- **WHEN** a caller supplies a channel ID
- **THEN** the system validates it against the configured naming and purpose policy before using it for runtime binding

### Requirement: Primary Channel Uniqueness
The system SHALL ensure there is at most one active primary channel for the same Agent and workspace binding.

#### Scenario: Reuse active primary
- **WHEN** Hermes opens a primary channel for a project/workspace that already has an active primary channel
- **THEN** the system restores the existing primary channel instead of creating another one

#### Scenario: Reject conflicting primary
- **WHEN** a caller attempts to create a second active primary channel for the same owner Agent and workspace binding
- **THEN** the operation fails or forces explicit replacement according to policy

### Requirement: Explicit Agent Binding
The system SHALL support explicit channel binding and recovery for long-running Agents.

#### Scenario: Recover Hermes channel
- **WHEN** Hermes reconnects to MemoHub
- **THEN** it can query its existing channels and restore the active primary or recent session channel before normal query and ingest operations

### Requirement: IDE Auto-binding
The system SHALL support low-friction automatic channel binding for IDE and workspace-style sources.

#### Scenario: Restore workspace channel
- **WHEN** an IDE source connects with source, project ID, and workspace ID
- **THEN** the system restores the matching workspace or primary channel if one exists

#### Scenario: Create workspace channel automatically
- **WHEN** no matching workspace or primary channel exists for an IDE source
- **THEN** the system automatically creates a managed channel entry without requiring explicit user registration

### Requirement: Channel Governance Surfaces
The system SHALL expose governance operations for channel lifecycle and status.

#### Scenario: List channels
- **WHEN** a user or Agent requests channel list
- **THEN** the response includes channel ID, owner Agent, purpose, status, project/workspace binding, primary flag, and activity timestamps

#### Scenario: Close channel
- **WHEN** a user or Agent closes a channel
- **THEN** the system marks it closed or archived and prevents further implicit reuse unless explicitly reopened

### Requirement: Cleanup Safety By Registry
The system SHALL align channel-scoped cleanup with registered channel state.

#### Scenario: Cleanup registered channel
- **WHEN** cleanup is requested for a registered channel
- **THEN** the system reports or deletes only the records linked to that registered channel according to confirmation policy

#### Scenario: Cleanup unknown channel
- **WHEN** cleanup is requested for an unknown or invalid channel
- **THEN** the system refuses the operation and returns a clear governance error
