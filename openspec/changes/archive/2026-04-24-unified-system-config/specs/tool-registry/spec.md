## ADDED Requirements

### Requirement: Manifest-based Tool Contract
The Tool Registry SHALL require all registered tools to provide a `Manifest` containing their `id`, `description`, `inputSchema` (Zod), and `outputSchema` (Zod).

#### Scenario: Registering a tool
- **WHEN** a tool with a valid manifest is registered
- **THEN** it SHALL be added to the registry and accessible by its `id`

#### Scenario: Missing schema declaration
- **WHEN** a tool attempts to register without an `inputSchema`
- **THEN** the system SHALL reject the registration with a validation error
