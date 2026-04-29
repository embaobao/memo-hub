## Context

MemoHub needs to serve as a unified memory hub across Hermes, Codex, Gemini, IDEs, MCP clients, CLI, scanners, and future sources. The current codebase already has useful primitives such as CAS, vector retrieval, source normalization, and query planning. The architectural issue is that “track” became the public mental model even though the product needs multi-source, multi-scope, multi-domain, and multi-view memory.

The design introduces a stable runtime boundary above older implementation assets. New CLI/MCP code must use `UnifiedMemoryRuntime` and must not register or expose track providers.

## Goals

- Support future sources without changing core protocol enums.
- Represent one memory object across multiple scopes and domains.
- Preserve raw evidence while enabling curated memories, generated artifacts, conflicts, and archived records.
- Query through `self + project + global` layered recall, with weighted fusion and view-shaped results.
- Make weighting extensible so future scoring can include trust, recency, confidence, source, domain, user preference, and project policy.
- Allow agents to summarize, extract, annotate, and clarify memory records while preserving provenance and review state.
- Keep boundaries clear: if old logic is reused later, wrap it behind domain projection executors instead of exposing track concepts.

## Non-Goals

- Do not implement full graph reasoning in the first phase.
- Do not require deleting old package directories in this change; do remove them from new CLI/MCP runtime dependencies.
- Do not require llm-wiki generation in the first phase; the model should make it possible later.
- Do not turn every future source into a hard-coded enum.

## Proposed Architecture

```text
Hermes / Codex / Gemini / IDE / CLI / MCP / Scanner / Documents
        |
        v
Source Adapter
        |
        v
CanonicalMemoryEvent
        |
        v
MemoryObject Builder
        |
        v
Projection Policy
        |
        v
Stores
  - Evidence/CAS
  - Semantic Vector
  - Relation Graph
  - Structured Index
        |
        v
Governance
  - state
  - conflicts
  - clarification
  - snapshots
  - backup/restore
```

Query path:

```text
Query Request
  - actor
  - project/workspace
  - intent
  - domains
        |
        v
Scope Resolver
        |
        v
Self Recall + Project Recall + Global Recall
        |
        v
Weighted Fusion
        |
        v
Optional Agent Operation
  - summarize
  - extract
  - annotate
  - clarify
        |
        v
Context View Assembler
```

## Canonical Memory Object

Core fields should be stable, while source/domain/scope descriptors remain open.

```ts
type MemoryObject = {
  id: string;
  kind: "evidence" | "memory" | "artifact" | string;

  source: SourceDescriptor;
  actor?: ActorDescriptor;
  subject?: SubjectDescriptor;

  scopes: ScopeRef[];
  visibility: "private" | "shared" | "global" | string;
  domains: DomainRef[];
  state: "raw" | "curated" | "conflicted" | "archived" | string;

  content: ContentBlock[];
  links?: LinkRef[];
  claims?: ClaimRef[];
  embeddings?: EmbeddingRef[];

  provenance: Provenance;
  tags?: string[];
  metadata?: Record<string, unknown>;

  createdAt: string;
  updatedAt: string;
};
```

Descriptor shapes:

```ts
type SourceDescriptor = {
  type: "agent" | "ide" | "cli" | "mcp" | "scanner" | "document" | "user" | "external" | string;
  id: string;
  name?: string;
  vendor?: string;
  metadata?: Record<string, unknown>;
};

type ScopeRef = {
  type: "agent" | "session" | "task" | "project" | "workspace" | "global" | string;
  id: string;
};

type DomainRef = {
  type: string;
  subtype?: string;
};

type ContentBlock = {
  type: "text" | "json" | "markdown" | "code" | "binary_ref" | string;
  text?: string;
  data?: unknown;
  uri?: string;
  mimeType?: string;
  metadata?: Record<string, unknown>;
};
```

## Extensibility Rules

- New sources use `SourceDescriptor`; core protocol must not require a code change for `gemini`, `cursor`, `trae`, browser extensions, CI, meetings, or document systems.
- New domains use `DomainRef`; adding `meeting.summary`, `browser.trace`, or `design.asset` must not require protocol enum changes.
- Objects may attach to multiple scopes at once, such as `{agent: hermes}`, `{project: memo-hub}`, and `{task: task-123}`.
- Source-specific data belongs in `metadata` and `provenance`, not in new required top-level fields.
- Query-critical fields remain required: `kind`, `source`, `scopes`, `visibility`, `domains`, `state`, `content`, and `provenance.ingestedAt`.

## Query Views

First phase query views:

- `agent_profile`: agent habits, preferences, identity, and long-term memory.
- `recent_activity`: recent sessions, tasks, and actions for an actor/source.
- `project_context`: project facts, decisions, business context, and conventions.
- `coding_context`: code memory, files, symbols, dependencies, APIs, and related project knowledge.

Every view should return:

```ts
type ContextView = {
  view: string;
  selfContext: MemoryObject[];
  projectContext: MemoryObject[];
  globalContext: MemoryObject[];
  conflictsOrGaps: MemoryObject[];
  sources: SourceDescriptor[];
  metadata: Record<string, unknown>;
};
```

## Layered Recall Policy

Default recall policy:

1. Self recall: private/shared memories attached to the requesting actor/agent/session/task.
2. Project recall: shared memories attached to current project/repo/workspace.
3. Global recall: global memories and cross-project knowledge.

All layers are queried, then fused with default weight:

```text
self > project > global
```

The result must preserve layer attribution instead of flattening everything into an opaque list.

## Weighting Policy

Weighting must be a configurable policy, not a single hard-coded sort. The first implementation can use simple defaults, but the model should allow additional factors later.

Default factors:

- `layerWeight`: self, project, global.
- `recencyWeight`: newer evidence may rank higher for activity/session views.
- `confidenceWeight`: verified or observed evidence may rank higher than inferred evidence.
- `sourceTrustWeight`: source-specific trust, such as scanner evidence for code structure.
- `domainWeight`: view-specific relevance, such as code objects for `coding_context`.
- `stateWeight`: curated results rank above raw, conflicted results are separated into conflicts/gaps.

Example shape:

```ts
type RecallWeightPolicy = {
  id: string;
  layer: Record<string, number>;
  recency?: { halfLifeDays?: number; weight: number };
  confidence?: Record<string, number>;
  sourceTrust?: Record<string, number>;
  domain?: Record<string, number>;
  state?: Record<string, number>;
  metadata?: Record<string, unknown>;
};
```

The query planner should accept a policy ID or inline policy override. Returned views should include policy metadata so ranking is auditable.

## Agent Memory Operations

Agents can be used as governed operators over memory objects. They should never replace provenance; every generated result must reference the evidence it used.

First operations:

- `summarize`: generate a concise summary from one or more memory objects.
- `extract`: extract entities, claims, tasks, preferences, dependencies, or API facts.
- `annotate`: add notes, labels, reasoning, confidence, or review comments.
- `clarify`: generate clarification questions for conflicts or missing context.
- `review`: accept, reject, or revise proposed curated memories.

Agent outputs should be represented as `MemoryObject` records or governance records with:

- source descriptor for the agent/operator
- links to input evidence
- operation type
- model/provider metadata
- confidence
- review state

This keeps automatic summarization and extraction useful without hiding the fact that the content was generated by an agent.

## Projection and Governance

The first phase should support the following domains:

- `code-intelligence`: code files, snippets, symbols, dependencies, APIs.
- `project-knowledge`: facts, decisions, component responsibilities, business context.
- `task-session`: sessions, tasks, activities, execution traces.
- `habit-convention`: agent preferences, project conventions, team habits.

Governance states:

- `raw`: ingested evidence, not yet curated.
- `curated`: accepted or merged memory.
- `conflicted`: competing claims or incompatible observations exist.
- `archived`: retained for audit/history, hidden from default views.

Governance work can start simple: preserve evidence, mark conflict/gap candidates, and expose them in views. Full entity resolution and claim merging can follow in later phases.

Agent-assisted governance can run synchronously for small requests or asynchronously for larger batches. The design should allow background jobs later, but phase one can expose explicit operations.

## Migration Strategy

Phase 1: Add model and runtime.

- Add protocol types and schemas.
- Build source normalization into `packages/integration-hub`.
- Store canonical memory objects through `UnifiedMemoryRuntime` without CLI/MCP track dispatch.

Phase 2: Add query planner.

- Implement `self/project/global` recall policies.
- Return layered context views.
- Reject legacy query shapes on MCP and require named views.

Phase 3: Add projection handlers.

- Implement domain projection executors for `code-intelligence`, `project-knowledge`, `task-session`, and `habit-convention`.
- Reuse old logic only after it is isolated behind domain executor interfaces.

Phase 4: Add governance.

- Add conflict/gap states, clarification queue, snapshot, backup, restore, and artifact records.

## Boundary Rules

- CLI/MCP expose only canonical event ingestion, named context views, and Agent memory operations.
- CLI/MCP must not accept `trackId`, `--track`, or old compatibility tools such as `memohub_add` and `memohub_search`.
- Existing `track-*` packages may remain for old tests while equivalent domain handlers are built, but new runtime code must not depend on them.
- Text2Mem remains available for old internal packages, but canonical memory objects are the product-level model.

## Risks

- Over-modeling can delay delivery. Keep phase 1 focused on required fields, descriptors, and basic views.
- Query fusion can become hard to debug. Return layer attribution and source metadata in every view.
- Old implementation migration can become disruptive. Keep new runtime boundaries strict and migrate reusable logic behind domain executors only after tests cover the behavior.
