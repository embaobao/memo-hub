## Why

MemoHub is moving from a track-centered memory system to a unified memory hub for all AI scenarios. The current track vocabulary is useful as an implementation detail, but it does not model cross-agent memory, project-wide sharing, code intelligence, knowledge governance, backup/restore, or future sources such as Gemini and other IDE agents.

This change defines the durable contract for that hub: extensible memory objects, source normalization, layered recall, projection/governance, and a migration path away from track-first product semantics.

## What Changes

- Introduce a canonical `MemoryObject` model with stable core fields and open descriptors for future sources, domains, scopes, content blocks, links, provenance, and metadata.
- Introduce canonical source normalization so Hermes, Codex, Gemini, IDEs, CLI, MCP, scanners, document systems, and future sources can enter without changing core protocol enums.
- Add layered query semantics: every query may recall from `self`, `project`, and `global`, then return a weighted, view-shaped result.
- Add an extensible weighting policy so recall fusion can consider layer, source trust, recency, confidence, domain relevance, explicit user preference, and future project-specific scoring plugins.
- Add agent-assisted memory operations for summarization, extraction, annotation, and clarification so the system can turn raw evidence into curated memories without hard-coding every governance step.
- Add projection and governance concepts so raw evidence can become code intelligence, project knowledge, task/session context, habits, conflicts, clarification items, snapshots, and export artifacts.
- Define direct implementation boundaries where external APIs and new runtime code use unified objects and query views, without exposing `track-*` or `trackId`.
- Deprecate “multi-track” as the primary architecture concept in new docs, specs, and user-facing APIs.

## Capabilities

### New Capabilities

- `unified-memory-object`: Canonical, extensible memory object and descriptor model.
- `source-normalization`: Normalization of multiple AI, IDE, scanner, CLI, MCP, document, and external sources into canonical memory objects.
- `layered-memory-query`: `self + project + global` recall, weighting, fusion, and context view assembly.
- `agent-memory-operations`: Agent-assisted summarize, extract, annotate, clarify, and review operations over memory objects and evidence.
- `projection-governance`: Domain projections, evidence retention, conflict state, clarification queue, snapshots, backup, restore, and artifacts.
- `legacy-track-migration`: Removal of track-facing surfaces and rules for replacing old implementation slices with domain handlers/projections.

### Modified Capabilities

- `text2mem-protocol`: Extend protocol requirements to support canonical memory events/objects and reduce reliance on user-facing `trackId`.
- `memory-kernel`: Extend kernel requirements so dispatch can remain the execution boundary while higher-level planners operate on canonical memory objects.
- `app-cli-entry`: Update CLI/MCP requirements so user-facing commands and tools are described as memory-object/query-view operations rather than track operations.

## Impact

- Affected packages: `packages/protocol`, `packages/core`, `packages/integration-hub`, `packages/storage-flesh`, `packages/storage-soul`, and future relation/structured-index packages.
- Affected apps: `apps/cli` MCP and CLI entry points.
- Affected docs: architecture, API reference, integration docs, current status, and AGENT guidance.
- Existing `track-*` packages may remain in the repository temporarily, but CLI/MCP and new runtime code must not depend on them.
- MCP compatibility tools and CLI track flags are removed from the new architecture surface.
