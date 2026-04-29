## Context

The repository currently mixes several maturity levels:

- Business direction is moving to a unified memory hub, while legacy `track-*` packages still exist as transition slices.
- Tests have started moving out of `src/`, but there is no repository-level contract for `test/`, benchmarks, fixtures, or runner usage.
- TypeDoc configuration exists, but documentation generation and index validation are not yet standard gates.
- Root build/test scripts are simple workspace fan-out commands and do not yet encode dependency order, changed-package selection, or performance budgets.
- CLI and MCP interfaces have historically drifted because docs were maintained separately from implementation.

The engineering foundation should be a small governance layer around the existing monorepo, not a new product layer.

## Goals

- Make documentation repeatable: API references, command references, package indexes, and OpenSpec summaries should be scriptable.
- Keep tests organized: unit, integration, e2e, fixtures, and benchmarks must have predictable locations.
- Make build/test performance visible: scripts should support full verification and narrower changed-package verification.
- Prevent interface drift: CLI and MCP docs should be generated from or checked against shared metadata.
- Support future extensibility: new source adapters, memory stores, scoring policies, and agent operations should fit the same package/test/doc layout.

## Non-Goals

- This change does not choose the final storage engine or retrieval algorithm.
- This change does not remove legacy track packages immediately.
- This change does not require Agent-driven doc updates for routine generated content.
- This change does not add a heavyweight build system unless simple Bun/TypeScript scripts cannot meet the gates.

## Proposed Engineering Shape

### Directory Responsibilities

```text
apps/                  Runtime entry points such as CLI, MCP, future daemon or UI.
packages/              Reusable libraries and platform services.
tracks/                Transitional compatibility slices only; not product-facing architecture.
test/                  Optional root-level cross-package e2e, fixtures, and shared test utilities.
<workspace>/test/      Package-local unit and integration tests.
scripts/               Engineering automation scripts.
scripts/benchmarks/    Transitional location; should move under test/benchmarks or package test/benchmarks.
docs/                  Human-authored docs plus generated API/reference output.
openspec/              Proposal, design, spec, and task source of truth.
```

### Documentation Pipeline

Documentation should have three classes:

- Authored docs: architecture, guides, integration notes, design decisions.
- Generated docs: TypeDoc API reference, CLI command reference, MCP tool reference, package index, OpenSpec change index.
- Checked docs: docs that remain authored but include validated links, command names, and package references.

Routine generated docs should be updated by scripts such as:

- `docs:api`: run TypeDoc into a stable generated output.
- `docs:cli`: extract CLI commands and options from the command registry.
- `docs:mcp`: extract MCP tools and schemas from the MCP registry.
- `docs:index`: rebuild package/spec/change indexes.
- `docs:check`: fail on stale generated docs, broken internal links, or undocumented public commands/tools.

### Test Layout

Tests should not live under `src/`. The default structure is:

```text
packages/<name>/test/unit/*.test.ts
packages/<name>/test/integration/*.test.ts
apps/<name>/test/unit/*.test.ts
apps/<name>/test/integration/*.test.ts
test/e2e/*.test.ts
test/fixtures/**
test/benchmarks/*.test.ts
```

Package-local tests should import from the package public entry when practical. Internal tests may import internal files, but should not force production code to export test-only APIs.

### Build And Verification Gates

The root verification model should distinguish quick local checks from full release checks:

- `build`: compile all packages in dependency order.
- `typecheck`: run TypeScript project references without emitting.
- `test`: run package and root tests.
- `test:unit`: run only fast unit tests.
- `test:integration`: run integration tests with explicit environment requirements.
- `bench`: run benchmark tests with thresholds and stable output.
- `docs:check`: verify generated docs and links.
- `check`: run the default local gate.
- `check:release`: run full build, test, docs, dependency, and performance gates.

Performance checks should start with coarse budgets around critical paths:

- cold build wall time
- changed-package build wall time
- unit test wall time
- memory query latency benchmark
- ingestion throughput benchmark

Budgets should be allowed to warn initially and become blocking once baselines are stable.

### Dependency Governance

Dependency enforcement should be automated from manifests and source imports:

- `apps/*` may depend on `packages/*` and transitional `tracks/*`.
- `packages/*` must not depend on `apps/*`.
- `packages/protocol` must stay minimal and dependency-light.
- `packages/core` must not depend directly on concrete tool implementations; use registries/interfaces.
- `tracks/*` are transitional and must not become new product-facing dependency roots.

### Relationship To Unified Memory Hub

The unified memory hub proposal depends on this foundation for scale:

- New source adapters get a standard package, test, and docs path.
- Weighting policies get benchmark and explainability tests.
- Agent summarize/extract/annotate/clarify operations get contract tests and generated docs.
- CLI/MCP interface parity is checked from shared metadata instead of manually maintained prose.

## Risks

- Overbuilding automation too early can slow feature work. Mitigation: start with simple Bun scripts and only add tooling when scripts become hard to maintain.
- Generated docs can become noisy. Mitigation: keep generated output in a clear generated section and reserve authored docs for architecture decisions.
- Performance budgets can be flaky. Mitigation: begin as non-blocking reports, then promote stable thresholds to blocking gates.
