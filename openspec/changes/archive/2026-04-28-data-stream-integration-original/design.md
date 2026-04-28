## Context

The previous proposal treated external telemetry as a broad ingestion problem. The refined design keeps MemoHub's existing architecture and adds two focused edges:

1. **Integration Hub** on the write side: external events become internal Text2Mem instructions.
2. **MCP Knowledge Gateway** on the read side: Hermes and IDEs ask workflow-level questions instead of low-level track queries.

This preserves the project principles:

- Text2Mem remains the internal memory operation protocol.
- `MemoryKernel.dispatch()` remains the only write path into tracks.
- CAS in `storage-flesh` remains the only content body store.
- Soul stores projections: vectors, structured indexes, relation/call graph records, and metadata.
- Librarian may govern projections and confidence but must not rewrite CAS content or bypass Text2Mem.

## Goals / Non-Goals

**Goals:**

- Provide a single external event envelope for Hermes and IDE/MCP clients.
- Convert external events into one or more Text2Mem instructions through projectors.
- Support Hermes memory center read/write through MCP.
- Support Hermes repository and business analysis writeback through MCP.
- Support multi-session state so Hermes and IDE clients share project/task context.
- Support fast MCP queries for coding context, API capability, project context, session state, and habits.
- Maintain CAS deduplication across tracks and generated summaries.

**Non-Goals:**

- Replacing Text2Mem, tracks, or `MemoryKernel.dispatch`.
- Building full VSCode/Trae/Gemini extensions in this change.
- Building a full graph database or a complete autonomous Librarian.
- Treating LLM-inferred facts as verified truth.
- Direct writes from integrations into vector storage, SQLite indexes, or CAS without going through the Integration Hub/projector contract.

## Proposed Architecture

```text
Hermes / IDE / MCP Client
        |
        v
MCP Tools / REST Ingest
        |
        v
Integration Hub
  - validate EventEnvelope
  - normalize channel payload
  - dedupe via source keys and CAS hash
  - select projector(s)
        |
        v
Text2MemInstruction[]
        |
        v
MemoryKernel.dispatch()
        |
        v
Tracks
  - track-stream   raw sessions/events
  - track-source   repository/API/source analysis
  - track-insight  memories, habits, project facts, business facts
  - track-wiki     provisional/stable summaries
        |
        v
storage-flesh CAS + storage-soul indexes
        |
        v
MCP Knowledge Gateway
  - coding context
  - API capability
  - project context
  - session state
  - habits
```

## Event Envelope

External integrations send an event shape that is stable across channels:

```ts
type MemoHubEvent = {
  id?: string;
  source: "hermes" | "ide" | "cli" | "mcp" | "external";
  channel: string;
  kind:
    | "memory"
    | "session_state"
    | "repo_analysis"
    | "api_capability"
    | "business_context"
    | "habit";
  projectId: string;
  sessionId?: string;
  taskId?: string;
  repo?: string;
  entityRefs?: Array<{ type: string; id: string; name?: string }>;
  confidence: "reported" | "observed" | "inferred" | "provisional" | "verified";
  occurredAt?: string;
  payload: unknown;
};
```

External events are not Text2Mem instructions. They are normalized by the Integration Hub and projected into internal operations.

## Projection Rules

The MVP uses fixed projectors instead of a complex configurable router:

- `memory` -> `track-insight`, optionally `track-stream` for audit.
- `session_state` -> `track-stream` and a session read model in Soul.
- `repo_analysis` -> `track-source`, optional `track-wiki` provisional summary.
- `api_capability` -> `track-source` and `api_capabilities` Soul index.
- `business_context` -> `track-insight`, optional `track-wiki` provisional summary.
- `habit` -> `track-insight` and `habits` Soul index.

This keeps the first implementation predictable. Later changes may add configurable channel policies once the fixed projectors are proven.

## CAS and Soul Boundary

All substantial text/code/analysis content is written to CAS and referenced by hash. Multiple projections may reference the same hash:

```text
CAS hash abc123
  <- source symbol record
  <- API capability record
  <- wiki provisional summary sourceRefs
  <- insight/business fact evidence
```

Soul owns query acceleration:

- `api_capabilities`: component/function/API names, signatures, props/params, examples, source refs.
- `project_contexts`: project status, business summary, active risks, latest known task refs.
- `session_states`: active session/task/project state per client/session.
- `habits`: user/project coding preferences and workflow habits.
- `relations`: `implements`, `calls`, `uses`, `related_to`, `mentioned_in`, `verified_by` edges.

The implementation may start with SQLite-style structured tables plus existing LanceDB vectors. It does not require a graph database.

## MCP Surface

Write tools:

- `memohub_ingest_event`
- `memohub_write_memory`
- `memohub_write_repo_analysis`
- `memohub_write_session_state`

Read tools:

- `memohub_read_memory`
- `memohub_get_session_state`
- `memohub_get_project_context`
- `memohub_query_api_capability`
- `memohub_get_habits`
- `memohub_get_coding_context`

`memohub_get_coding_context` is the primary IDE workflow tool. Given `projectId`, `repo`, `currentFile`, optional `taskId`, optional `symbols`, and optional `query`, it returns the most relevant project memory, session state, habits, API capabilities, source references, business context, and wiki/source evidence.

## Confidence and Governance

All projections preserve confidence:

- `reported`: explicitly provided by Hermes or an external system.
- `observed`: observed from session/activity streams.
- `inferred`: generated by rules or LLM analysis.
- `provisional`: useful but not authoritative.
- `verified`: confirmed by a user or trusted rule.

Librarian may later merge duplicates, promote confidence, create wiki summaries, and surface conflicts. It may not rewrite CAS content or override reported facts with inferred claims.

## Risks / Trade-offs

- **Risk: Too many MCP tools too early.** Mitigation: implement `memohub_ingest_event` and `memohub_get_coding_context` first, then add convenience wrappers.
- **Risk: Slow code/API retrieval if only vector search is used.** Mitigation: create minimal structured Soul indexes for API capability and relation lookup in the MVP.
- **Risk: External payload drift.** Mitigation: normalize all Hermes/IDE payloads into the stable Event Envelope before projection.
- **Risk: Mixing fact and inference.** Mitigation: confidence is required on every event/projection and must be returned in query results.
