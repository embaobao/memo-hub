## ADDED Requirements

### Requirement: Multi-provider configuration
The AI-Hub SHALL support defining multiple named AI providers (e.g., OpenAI, Ollama) with their respective connection details (baseUrl, apiKey, type).

#### Scenario: Multiple providers
- **WHEN** the config defines both `local` (Ollama) and `cloud` (OpenAI) providers
- **THEN** the system SHALL instantiate adapters for both simultaneously

### Requirement: Agent role abstraction
The system SHALL support defining `agents` that reference a specific provider and configure model-specific parameters (model, dimensions, temperature).

#### Scenario: Agent switching
- **WHEN** a tool requests the `embedder` agent
- **THEN** the AI-Hub SHALL return an instance configured according to the `embedder` agent settings (e.g., using `nomic-embed-text` on the `local` provider)
