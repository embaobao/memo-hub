## Context

LibreChat is a highly extensible AI chat platform. We will utilize its native architecture (Tailwind, Shadcn UI, React Query) to build the next-generation MemoHub interface. The focus is on functionality and ecosystem compatibility rather than custom aesthetic overrides.

## Goals / Non-Goals

**Goals:**
- **Native Experience**: Use LibreChat's original UI components for a familiar, high-performance chat interface.
- **Provider Autonomy**: Enable users to add and configure providers (API Keys, Endpoints) directly in the web UI.
- **MCP Native Support**: Treat MCP Skills as first-class citizens in the conversational settings.
- **Visual Orchestration**: Port the ReactFlow-based Flow Studio into a dedicated "Orchestration" tab within LibreChat.

**Non-Goals:**
- Custom CSS "Glassmorphism" styling (Ether UI is deprecated for this change).
- Rewriting LibreChat's state management (we will leverage its internal context/stores).

## Decisions

### 1. Style: Vanilla LibreChat (Shadcn/Tailwind)
- **Decision**: Adhere to the default LibreChat styling.
- **Rationale**: User requested to drop Ether UI. Native styling ensures better compatibility with upstream LibreChat updates and follows standard accessibility patterns.

### 2. Provider Integration: Endpoint Sync
- **Decision**: Map `MemoryKernel` as a custom "Endpoint" in LibreChat's backend.
- **Rationale**: This allows the UI to leverage existing model-switching and parameter-tuning components without modification.

### 3. Registry Governance: New Settings Module
- **Decision**: Build a specialized "MemoHub Control Center" within the Settings modal or a new sidebar entry.
- **Rationale**: Provides a centralized place to manage MCP skills, Tool registration, and Track configuration without cluttering the chat history.

### 4. Build Strategy: Optimized Monorepo Integration
- **Decision**: Refactor the LibreChat `client` directory to work as a Vite-based workspace in the MemoHub monorepo.
- **Rationale**: Ensures fast HMR and shared type definitions between the frontend and the kernel.

## Risks / Trade-offs

- **[Risk] Upstream Drift** → Heavy modifications to LibreChat's core might make updates difficult.
- **[Mitigation]** → Use the `/custom` and `/overrides` pattern where possible; minimize edits to the core `/client` and `/api` directories.
- **[Trade-off] System Overhead** → LibreChat requires MongoDB/Redis.
- **[Impact]** → Acceptable for an enterprise-ready memory system; provides better session persistence.

## Migration Plan

1. **Import Stage**: Clone/Subtree LibreChat into `apps/web`.
2. **Build Convergence**: Migrate build logic to Vite.
3. **Bridge Logic**: Implement the API routes for Kernels, MCP, and Registry.
4. **Dashboard Port**: Move Flow Studio logic into a new LibreChat View component.
