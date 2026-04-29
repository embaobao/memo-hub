## 1. Protocol Model

Implementation of this change must follow the engineering gates from `engineering-foundation-governance`: new protocol/source/query/agent work requires package-local tests under `test/`, generated docs updates when interfaces change, dependency boundary validation, and benchmark coverage for retrieval weighting or agent operation hot paths.

- [x] 1.1 Define `MemoryObject`, `CanonicalMemoryEvent`, and validation schemas in `packages/protocol`.
- [x] 1.2 Define descriptor types: `SourceDescriptor`, `ActorDescriptor`, `SubjectDescriptor`, `ScopeRef`, `DomainRef`, `ContentBlock`, `LinkRef`, and `Provenance`.
- [x] 1.3 Add tests for required fields, open source descriptors, multi-scope objects, multi-domain objects, and content blocks.
- [x] 1.4 Keep existing `Text2MemInstruction` validation backward compatible.

## 2. Source Normalization

- [x] 2.1 Add a normalization module in `packages/integration-hub` that maps external inputs to `CanonicalMemoryEvent` and `MemoryObject`.
- [x] 2.2 Implement adapter mappings for Hermes, CLI, MCP, IDE, scanner, and generic external sources.
- [x] 2.3 Add Gemini as an explicit test case using open descriptors rather than protocol enum changes.
- [x] 2.4 Preserve source-specific metadata in descriptor/provenance metadata.
- [x] 2.5 Add unit tests for validation failures and provenance defaults.

## 3. Storage Projection MVP

- [x] 3.1 Persist raw memory evidence through CAS and store the resulting content hash in the memory object.
- [x] 3.2 Index text-bearing content blocks in vector storage with scope, visibility, domain, state, source, actor, and subject metadata.
- [x] 3.3 Add a simple structured index interface for refs/links used by code and activity views.
- [x] 3.4 Keep legacy track execution as an adapter path for existing behavior.

## 4. Query Planner

- [x] 4.1 Implement `QueryPlanner` in `packages/core` or a dedicated package.
- [x] 4.2 Add `self/project/global` scope resolution using actor, project, workspace, task, and session inputs.
- [x] 4.3 Query all three layers and preserve layer attribution.
- [x] 4.4 Implement default weight order `self > project > global`.
- [x] 4.5 Return `ContextView` with `selfContext`, `projectContext`, `globalContext`, `conflictsOrGaps`, `sources`, and metadata.
- [x] 4.6 Define `RecallWeightPolicy` with layer, recency, confidence, source trust, domain, and state factors.
- [x] 4.7 Add score metadata or policy metadata to context view results for ranking explainability.

## 5. Query Views

- [x] 5.1 Implement `agent_profile`.
- [x] 5.2 Implement `recent_activity`.
- [x] 5.3 Implement `project_context`.
- [x] 5.4 Implement `coding_context`.
- [x] 5.5 Add tests that verify Hermes self memory, project-shared memory, and global memory are all recalled and attributed correctly.

## 6. Projection and Governance

- [x] 6.1 Add domain policy mapping for `code-intelligence`, `project-knowledge`, `task-session`, and `habit-convention`.
- [x] 6.2 Add governance state handling for `raw`, `curated`, `conflicted`, and `archived`.
- [x] 6.3 Add a minimal conflict/gap output path in query views.
- [x] 6.4 Add clarification item model and tests for conflicting evidence.
- [x] 6.5 Add artifact model support for snapshots, backups, restores, and future wiki exports.

## 7. Agent Memory Operations

- [x] 7.1 Define `AgentMemoryOperation` contract for summarize, extract, annotate, clarify, and review.
- [x] 7.2 Implement operation result metadata: input memory IDs, output IDs, source agent, model/provider metadata, confidence, and review state.
- [x] 7.3 Add summarization operation for recent activity and selected memory sets.
- [x] 7.4 Add extraction operation for entities, claims, tasks, preferences, dependencies, and API facts.
- [x] 7.5 Add annotation operation for human/agent remarks and clarification notes.
- [x] 7.6 Add clarification generation and resolution flow linked to conflicts/gaps.
- [x] 7.7 Ensure agent-generated outputs default to raw/proposed unless accepted by review policy.

## 8. CLI and MCP Integration

- [x] 8.1 Update CLI write/query paths to use canonical memory objects and remove legacy track flags.
- [x] 8.2 Update MCP ingest to normalize incoming events to canonical memory objects.
- [x] 8.3 Update MCP query to accept named views and layered recall inputs.
- [x] 8.4 Add MCP/CLI access to agent operations where appropriate, starting with explicit summarize and clarify commands/tools.
- [x] 8.5 Remove `memohub_add`, `memohub_search`, `memohub_delete`, and type-based MCP query compatibility surfaces.
- [x] 8.6 Update API docs to describe unified memory objects and query views instead of primary track selection.

## 9. Legacy Track Migration

- [x] 9.1 Remove `track-*` imports and registration from the CLI/MCP runtime.
- [x] 9.2 Remove `track-*` dependencies from `apps/cli`.
- [x] 9.3 Ensure external `metadata.trackId` cannot override projection boundaries.
- [x] 9.4 Update docs/specs so track-facing APIs are no longer described as transitional user surfaces.
- [x] 9.5 Add regression tests proving old MCP query shape is rejected and new view-based shape works.

## 10. Documentation

- [x] 10.1 Update architecture docs with the new model, chain, and migration plan.
- [x] 10.2 Update OpenSpec references so new work uses `unified-memory-hub-model`.
- [x] 10.3 Update `docs/development/current-status.md` with what is implemented vs proposed.
- [x] 10.4 Add examples for Hermes profile query, current project activity query, IDE session query, coding context query, summarization, extraction, and clarification.

## 11. Verification

- [x] 11.1 Run targeted protocol, integration-hub, core, CLI, and MCP tests.
- [x] 11.2 Add integration tests for `self/project/global` recall and view assembly.
- [x] 11.3 Add tests for configurable weighting and ranking metadata.
- [x] 11.4 Add tests for agent operation provenance and review state.
- [x] 11.5 Run `bun run build` after known build blockers are resolved or document blockers if out of scope.
- [x] 11.6 Verify no new tests are placed under `src/`.

## 12. Access, Configuration, and Closure

- [x] 12.1 Add clarification answer write-back through CLI and MCP as searchable curated memory.
- [x] 12.2 Add `memohub://tools` MCP resource so agents can discover current tools, resources, views, layers, and operations.
- [x] 12.3 Add CLI commands for MCP config generation, tool catalog, runtime status, service logs, and resolved configuration.
- [x] 12.4 Connect new runtime assembly to `storage`, `ai`, `mcp`, and `memory` configuration sections.
- [x] 12.5 Ensure MCP stdio startup does not write non-protocol output to stdout.
- [x] 12.6 Add tests for clarification write-back, MCP catalog, config defaults, and coding-context reads.
- [x] 12.7 Add CLI config read/write commands, MCP doctor diagnostics, and documented access validation scenarios.
