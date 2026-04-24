## ADDED Requirements

### Requirement: Define IEmbedder interface
The system SHALL define an `IEmbedder` interface with methods: `embed(text: string): Promise<number[]>` and `batchEmbed(texts: string[]): Promise<number[][]>`.

#### Scenario: Embed single text
- **WHEN** embed is called with a text string
- **THEN** a 768-dimensional float array is returned

#### Scenario: Batch embed multiple texts
- **WHEN** batchEmbed is called with an array of text strings
- **THEN** an array of 768-dimensional float arrays is returned, one per input text

### Requirement: Define ICompleter interface
The system SHALL define an `ICompleter` interface with methods: `chat(messages: ChatMessage[]): Promise<string>` and `summarize(text: string): Promise<string>`.

#### Scenario: Chat completion
- **WHEN** chat is called with an array of messages
- **THEN** a string response is returned from the LLM

#### Scenario: Summarize text
- **WHEN** summarize is called with a text string
- **THEN** a concise summary string is returned

### Requirement: Ollama adapter implementation
The system SHALL provide an Ollama adapter implementing both IEmbedder and ICompleter, connecting to the Ollama API endpoint.

#### Scenario: Initialize Ollama embedder
- **WHEN** OllamaAdapter is constructed with url="http://localhost:11434/v1" and model="nomic-embed-text-v2-moe"
- **THEN** subsequent embed calls SHALL use the configured Ollama endpoint

#### Scenario: Handle Ollama connection failure
- **WHEN** embed is called but the Ollama endpoint is unreachable
- **THEN** an error SHALL be thrown (no silent zero-vector fallback in v3)

### Requirement: Adapter registration and lookup
The system SHALL provide an `AIProviderRegistry` that maps adapter names to factory functions, supporting runtime selection.

#### Scenario: Register and retrieve adapter
- **WHEN** an Ollama adapter is registered under name "ollama"
- **THEN** it can be retrieved by name from the registry

#### Scenario: Adapter not found
- **WHEN** a non-registered adapter name is requested
- **THEN** an error SHALL be thrown indicating the adapter is not available

### Requirement: Graceful error handling
All AI adapter methods SHALL throw typed errors with actionable messages rather than returning fallback values.

#### Scenario: Embedding timeout
- **WHEN** an embed call exceeds the configured timeout (default 30s)
- **THEN** an `AIProviderError` with timeout details is thrown
