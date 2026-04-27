## ADDED Requirements

### Requirement: Provider CRUD
The system SHALL provide a UI for users to add, update, and delete AI providers (e.g., Ollama, OpenAI).

#### Scenario: Add new provider
- **WHEN** user inputs API key and endpoint in the Settings panel
- **THEN** the provider is immediately available in the chat dropdown

### Requirement: Model Parameter Tuning
The system SHALL allow users to adjust temperature, top_p, and max_tokens per model.

#### Scenario: Real-time update
- **WHEN** user slides the temperature slider
- **THEN** subsequent messages to the model use the new value
