## Why

Current bespoke UI lacks the robust conversational features and multi-model ecosystem of professional chat platforms. By migrating to LibreChat, MemoHub gains access to a mature, high-performance interface for model interaction, while the team can focus entirely on Memory Orchestration and Flow Engine capabilities.

## What Changes

- **BREAKING**: Replace the current custom frontend with a direct integration of LibreChat into the MemoHub monorepo.
- **Provider & Model Configuration**: Native-style UI for managing AI providers (Ollama, OpenAI, Anthropic, etc.) and specific model parameters.
- **V2 Orchestration Integration**: Port existing CLI/Kernel features into LibreChat's modular interface.
- **Vite Build System**: Optimize LibreChat to compile within the monorepo's Vite-based pipeline.
- **MCP & Tooling Governance**: Dedicated management panels for MCP Skills, Custom Tracks, and Atomic Tool registration.

## Capabilities

### New Capabilities
- `librechat-monorepo-integration`: Structural port of LibreChat into `apps/web`.
- `ui-provider-management`: Integrated forms for provider credentials and model selection.
- `mcp-skill-governance-center`: Visual configuration for MCP tools and skill-level permissions.
- `registry-orchestration-dashboard`: Managing the lifecycle and config of tracks/tools.

### Modified Capabilities
- `memory-kernel-api`: Ensure the core kernel provides a compatible API surface for LibreChat's message streaming and config state.

## Impact

- **apps/web**: Complete replacement with LibreChat.
- **packages/config**: Alignment with LibreChat's database-backed configuration for models and providers.
- **Dependencies**: Introduce MongoDB and Redis to support the state management of the new UI.
