## Why

Current Web UI and JSONC-based "Flow Orchestration" add excessive complexity and cognitive load. Orchestrating flows via JSON is brittle and hard to debug. By pivoting to a code-driven, track-centric model, we empower developers to write clean, type-safe logic within Tracks while utilizing a centralized Tool Registry. This moves MemoHub towards a highly focused "Memory OS" that prioritizes execution efficiency and simplicity for CLI/MCP usage.

## What Changes

- **BREAKING**: Remove `FlowEngine` and all support for JSONC-defined flows in `config.jsonc`.
- **BREAKING**: Archive `apps/web` and all UI-related orchestration logic.
- **Architectural Shift**: Transition from "Flow-Driven" to "Track-Tool Direct" architecture.
- **Enhanced Track Interface**: Tracks will now have direct, simplified access to the `ToolRegistry` via the Kernel to perform their operations.
- **Daemon-first**: Focus on a background daemon providing raw Tool/Track access via MCP.

## Capabilities

### New Capabilities
- `kernel-daemon-mode`: Persistent background service for multi-agent memory access.
- `direct-tool-invocation-api`: A refined API for Tracks to synchronously or asynchronously call atomic tools from the registry.
- `mcp-full-protocol-support`: Expose all Text2Mem operations as MCP tools, backed by simplified Track implementations.

### Modified Capabilities
- `memory-kernel-api`: Stripped of flow orchestration logic; focused on Registry management and Track dispatching.

## Impact

- **packages/core**: Deletion of `FlowEngine.ts` and `VariableResolver.ts`. Significant simplification of `MemoryKernel`.
- **config/config.jsonc**: Removed `flows` and `flow` sections. Config now only defines system paths, AI providers, and track registration.
- **apps/cli**: Refactored to handle direct track dispatching without flow middleware.
