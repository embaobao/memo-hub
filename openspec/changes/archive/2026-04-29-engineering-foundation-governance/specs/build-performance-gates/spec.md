## ADDED Requirements

### Requirement: Standard Verification Commands
The root package SHALL expose standard commands for local and release verification.

#### Scenario: Local check
- **WHEN** `bun run check` is run
- **THEN** it runs the default local gate including typecheck, lint or format check, and fast tests

#### Scenario: Release check
- **WHEN** `bun run check:release` is run
- **THEN** it runs build, tests, docs checks, dependency graph checks, and performance reporting

### Requirement: Type And Build Separation
The project SHALL separate type checking from build output generation.

#### Scenario: Typecheck only
- **WHEN** `bun run typecheck` is run
- **THEN** TypeScript project references are checked without requiring runtime execution

#### Scenario: Build all packages
- **WHEN** `bun run build` is run
- **THEN** workspace packages are built in dependency order

### Requirement: Dependency Boundary Gate
The project SHALL validate dependency boundaries across apps, packages, and transitional tracks.

#### Scenario: Package imports app code
- **WHEN** a package imports from `apps/*`
- **THEN** the dependency boundary check fails

#### Scenario: Core imports concrete built-in tools directly
- **WHEN** `packages/core` imports concrete implementations from `packages/builtin-tools`
- **THEN** the dependency boundary check fails

### Requirement: Performance Baseline Reporting
The project SHALL report baseline performance for build, test, ingestion, and query paths.

#### Scenario: Benchmark run
- **WHEN** `bun run bench` is run
- **THEN** benchmark results are emitted with names, timings, and threshold status

#### Scenario: Initial unstable benchmark
- **WHEN** a benchmark threshold is not yet stable
- **THEN** it may warn without blocking release checks if explicitly marked non-blocking

### Requirement: Incremental Verification
The project SHALL support changed-package verification to avoid expensive full checks during routine development.

#### Scenario: Changed package check
- **WHEN** a package and its dependents are selected for verification
- **THEN** only the affected workspace graph is built and tested
