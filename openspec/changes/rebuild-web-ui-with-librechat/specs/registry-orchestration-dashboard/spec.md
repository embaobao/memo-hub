## ADDED Requirements

### Requirement: Registry Matrix
The system SHALL display a matrix of all registered Tracks and Atomic Tools.

#### Scenario: Real-time reflection
- **WHEN** a new tool is registered via the API
- **THEN** it immediately appears in the Registry Matrix UI

### Requirement: Hot-Reload Config
The system SHALL support updating Track flow configurations without server restarts.

#### Scenario: Commit new flow
- **WHEN** user updates a flow in the dashboard and clicks "Apply"
- **THEN** the backend kernel reloads the flow in memory
