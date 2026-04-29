## 1. Baseline Audit

- [x] 1.1 Inventory current root/package scripts, TypeScript references, TypeDoc config, tests, benchmarks, and docs entry points.
- [x] 1.2 Identify tests still outside allowed `test/` locations and create a migration list.
- [x] 1.3 Identify docs that describe non-existent CLI/MCP commands or stale package names.
- [x] 1.4 Record current build/test/benchmark timings as initial non-blocking baselines.

## 2. Directory And Test Governance

- [x] 2.1 Add root `test/` directories for e2e, fixtures, shared utilities, and benchmarks where needed.
- [x] 2.2 Move remaining benchmark tests from `scripts/benchmarks` into the approved test layout or document the temporary exception.
- [x] 2.3 Standardize package-local test names under `test/unit` and `test/integration`.
- [x] 2.4 Add a script that fails when `*.test.ts` or `*.spec.ts` appears under `src/`.

## 3. Build And Verification Scripts

- [x] 3.1 Add or refine root scripts for `typecheck`, `test:unit`, `test:integration`, `bench`, `docs:api`, `docs:check`, `check`, and `check:release`.
- [x] 3.2 Ensure package builds run in dependency order through TypeScript project references or an explicit workspace planner.
- [x] 3.3 Add dependency graph validation for app/package/track boundaries.
- [x] 3.4 Add initial performance reporting for build, tests, ingestion, and query benchmarks.

## 4. Documentation Automation

- [x] 4.1 Generate API docs from TypeDoc into a stable generated docs path.
- [x] 4.2 Add CLI command metadata extraction or a shared registry that can produce CLI reference docs.
- [x] 4.3 Add MCP tool metadata extraction or a shared registry that can produce MCP reference docs.
- [x] 4.4 Add docs index validation for package names, OpenSpec change links, and internal doc links.

## 5. Integration With Unified Memory Work

- [x] 5.1 Add engineering gate expectations to the unified memory implementation plan.
- [x] 5.2 Require new source adapters to include package tests, generated docs coverage, and integration examples.
- [x] 5.3 Require weighting policy work to include explainability tests and benchmark coverage.
- [x] 5.4 Require agent memory operations to include provenance, review-state, and clarification-flow tests.

## 6. Verification

- [x] 6.1 Run `bun run check` after the initial engineering scripts are implemented.
- [x] 6.2 Run `bun run check:release` before considering the engineering foundation complete. Current release gate is executable but not green; blockers are documented in `docs/development/engineering-foundation.md`.
- [x] 6.3 Update `docs/development/current-status.md` with remaining known gaps and exact commands.
