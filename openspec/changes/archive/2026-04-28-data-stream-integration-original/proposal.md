## Why

MemoHub already has the important internal foundation: Text2Mem as the memory operation protocol, `MemoryKernel.dispatch()` as the single execution entry, four semantic tracks, `storage-flesh` as the CAS content body, and `storage-soul` as the retrieval/index layer. The missing piece is not a replacement for this architecture. The missing piece is a small integration layer that lets Hermes, IDEs, and MCP clients write and read project memory without knowing MemoHub's internal track layout.

The first product goal is concrete: Hermes should read/write memories through MCP, write repository and business analysis back into MemoHub, and IDE MCP clients should retrieve project memory, multi-session state, coding habits, related API capabilities, and repository context quickly enough to reduce repeated searching during code generation and remix-style iteration.

## What Changes

- Add an MCP-first Integration Hub that accepts external event envelopes and projects them into existing Text2Mem instructions.
- Preserve Text2Mem, tracks, CAS, and Soul as the core internal architecture.
- Add Hermes-focused ingestion for memory center payloads, repository analysis, business context, and API capability analysis.
- Add session-state ingestion so multiple Hermes/IDE sessions can observe shared project and task context.
- Add query-oriented MCP tools that return coding context, project context, session state, habits, and API capabilities.
- Extend Soul with minimal structured indexes for API capabilities, project context, session state, habits, and relations while continuing to store source content in CAS.

## Capabilities

### New Capabilities

- `integration-hub`: Accepts external event envelopes, validates source/channel/kind metadata, deduplicates content through CAS, and projects events into Text2Mem instructions.
- `hermes-mcp-integration`: Allows Hermes to read/write memory, session state, repository analysis, business analysis, and API capability data through MCP.
- `mcp-knowledge-gateway`: Exposes task/project/session/habit/API/coding-context query tools for Hermes and IDE MCP clients.
- `code-business-indexing`: Maintains minimal Soul-side structured indexes for symbols, API capabilities, business concepts, project context, habits, and relations.

### Modified Capabilities

- `memory-kernel-api`: Remains the internal dispatch path; Integration Hub may only write through `Text2MemInstruction` and `MemoryKernel.dispatch()`.
- `track-source`: Stores repository analysis and API capability projections while preserving CAS-backed source references.
- `track-insight`: Stores memories, habits, project/business facts, and task/project status facts.
- `track-stream`: Stores raw session/event fragments for replay and later distillation.
- `track-wiki`: Stores stable or provisional project/API/business summaries derived from Hermes analysis.

## Impact

- **Architecture**: Adds an outer Event Envelope layer and an outer MCP Knowledge Gateway layer without replacing Text2Mem, Track, CAS, or Soul.
- **Storage**: Original content remains deduplicated in `storage-flesh`; Soul adds purpose-built indexes and relation records for fast code/business retrieval.
- **MCP**: Existing `memohub_add/search` remain useful, but new higher-level MCP tools provide the coding workflow surface Hermes and IDEs need.
- **Scope Control**: This change does not implement a full graph database, real-time collaboration, full IDE plugins, or autonomous Librarian governance. It creates the minimal read/write loop needed for Hermes and IDE integration.
