## ADDED Requirements

### Requirement: MCP Skill Discovery
The system SHALL list all available MCP skills and their exposed tools in the UI.

#### Scenario: View tools
- **WHEN** user clicks on a skill in the governance center
- **THEN** all tools belonging to that skill are displayed with descriptions

### Requirement: Permission Control
The system SHALL allow users to enable or disable specific tools per session.

#### Scenario: Disable tool
- **WHEN** user toggles off a tool
- **THEN** the Agent SHALL NOT be able to call that tool in the current chat
