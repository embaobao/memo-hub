## Context

Orchestrating logic via JSON flows was a bottleneck for debugging and type safety. We are moving to a "Headless Memory OS" where the complexity of memory management is handled by robust TypeScript code inside Tracks, which leverage a shared registry of Atomic Tools. This eliminates the parsing overhead of the `FlowEngine` and simplifies the configuration surface.

## Goals / Non-Goals

**Goals:**
- **Zero-JSON Orchestration**: Remove all `flows` from configuration. Logic lives in code.
- **Direct Invocation**: Enable `this.kernel.getTool('builtin:cas').execute(...)` patterns inside Track classes.
- **Micro-Kernel**: Reduce the Kernel to a simple event-emitter that manages Registry lookup and Daemon state.
- **High Performance**: Direct code calls instead of JSONPath evaluation.

**Non-Goals:**
- Maintaining any backward compatibility for JSON `flow` definitions.
- Visualizing flows (since they no longer exist as data structures).

## Decisions

### 1. Architectural Simplification: Code-First Tracks
- **Decision**: Delete `FlowEngine` and `VariableResolver`.
- **Rationale**: Direct code invocation is 100% type-safe and significantly easier for developers to maintain than JSON-based state machines.
- **Alternative**: Keeping a "Simple Flow" engine. Rejected to ensure maximum focus on core logic.

### 2. Interface: Kernel as a Tool Provider
- **Decision**: Inject a `RegistryProxy` into every Track during initialization.
- **Rationale**: Allows Tracks to discovery and call tools without creating circular dependencies between packages.

### 3. Management: Registry-Centric TUI
- **Decision**: The CLI `inspect` command will now focus on the "Service Map" (which Tracks are alive, which Tools are registered) instead of execution graphs.

## Risks / Trade-offs

- **[Risk] Track Boilerplate** → Moving logic from JSON to Code might increase code size in `tracks/`.
  - **Mitigation**: Provide base classes and utility helpers for common Tool combinations (e.g., `MemoryStoreHelper` for CAS+Vector).
- **[Risk] Hot-reload Loss** → Logic changes now require a TypeScript compilation.
  - **Mitigation**: In CLI-first MVP, compile time is negligible, and reliability is prioritized over logic-level hot-reloading.

## Migration Plan

1. **Delete**: Physically remove `packages/core/src/flow-engine.ts` and `packages/config/src/resolver.ts`.
2. **Refactor Kernel**: Simplify `IKernel` to focus on `getTool` and `getTrack` methods.
3. **Update Tracks**: Refactor `track-insight` and `track-source` to implement their logic via direct tool calls.
4. **Clean Config**: Wipe `flows` from all `config.jsonc` files.
