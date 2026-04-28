## 1. Integration Hub Foundation

- [ ] 1.1 Define `MemoHubEvent` and validation schema for external event envelopes
- [ ] 1.2 Implement `IntegrationHub.ingest(event)` with validation, trace metadata, and normalized result reporting
- [ ] 1.3 Implement CAS-backed content hashing/deduplication for event payload text/code/analysis bodies
- [ ] 1.4 Implement fixed projectors that convert event kinds into `Text2MemInstruction[]`
- [ ] 1.5 Ensure all projector writes use `MemoryKernel.dispatch()` and never write tracks directly

## 2. Hermes MCP Write Integration

- [ ] 2.1 Add `memohub_ingest_event` MCP tool for generic event ingestion
- [ ] 2.2 Add `memohub_write_memory` wrapper for Hermes memory center payloads
- [ ] 2.3 Add `memohub_write_repo_analysis` wrapper for Hermes repository and business analysis
- [ ] 2.4 Add `memohub_write_session_state` wrapper for multi-session project/task state
- [ ] 2.5 Add fixture-based tests for Hermes memory, repo analysis, API capability, and session state events

## 3. Soul Read Models and Indexes

- [ ] 3.1 Add minimal `api_capabilities` index model with symbol name, package, signature, examples, source refs, and content hash
- [ ] 3.2 Add minimal `relations` model for `calls`, `uses`, `implements`, `related_to`, and `mentioned_in` edges
- [ ] 3.3 Add minimal `session_states` model keyed by project/session/task
- [ ] 3.4 Add minimal `habits` and `project_contexts` read models
- [ ] 3.5 Keep CAS as the only body store; read models must reference `contentHash` for large content

## 4. MCP Knowledge Gateway

- [ ] 4.1 Add `memohub_read_memory` for project/session-aware memory retrieval
- [ ] 4.2 Add `memohub_get_session_state` for shared multi-session awareness
- [ ] 4.3 Add `memohub_get_project_context` for project, task, and business context
- [ ] 4.4 Add `memohub_query_api_capability` for component/library/API capability lookup
- [ ] 4.5 Add `memohub_get_habits` for user/project coding preferences
- [ ] 4.6 Add `memohub_get_coding_context` to aggregate memory, session state, habits, API capability, source refs, and business context for IDE use

## 5. Track Projection Behavior

- [ ] 5.1 Verify `memory` events project to `track-insight` with source/project/session metadata
- [ ] 5.2 Verify `session_state` events project to `track-stream` and update the session read model
- [ ] 5.3 Verify `repo_analysis` events project to `track-source` and preserve CAS references
- [ ] 5.4 Verify `api_capability` events update `track-source` and the API capability index
- [ ] 5.5 Verify `business_context` and stable summaries can create provisional `track-wiki` entries

## 6. Verification and Documentation

- [ ] 6.1 Add integration tests for Hermes -> MCP -> IntegrationHub -> Text2Mem -> query gateway
- [ ] 6.2 Add a documented Hermes MCP workflow showing memory read/write and repo analysis writeback
- [ ] 6.3 Add an IDE MCP workflow showing `memohub_get_coding_context` usage during code generation
- [ ] 6.4 Run `bun run build` and targeted tests for CLI, integration, protocol, and affected tracks
