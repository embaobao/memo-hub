# test-layout-governance Specification

## Purpose
TBD - created by archiving change engineering-foundation-governance. Update Purpose after archive.
## Requirements
### Requirement: Tests Outside Source Directories
Test files SHALL NOT be placed under production `src/` directories.

#### Scenario: Test under src
- **WHEN** a file matching `*.test.ts` or `*.spec.ts` is added under `src/`
- **THEN** the test layout check fails

### Requirement: Package Local Test Directories
Each workspace package or app SHALL place local tests under its own `test/` directory.

#### Scenario: Package unit test
- **WHEN** a package adds a unit test
- **THEN** the test is placed under `packages/<name>/test/unit/` or an equivalent package-local `test/` subdirectory

#### Scenario: App integration test
- **WHEN** an app adds an integration test
- **THEN** the test is placed under `apps/<name>/test/integration/`

### Requirement: Root Cross-Package Tests
Cross-package e2e tests, shared fixtures, and repository-level benchmarks SHALL live under root `test/`.

#### Scenario: Cross-package workflow test
- **WHEN** a test exercises CLI, kernel, storage, and retrieval together
- **THEN** the test is placed under `test/e2e/` or `test/integration/`

#### Scenario: Shared fixture
- **WHEN** multiple packages need the same fixture data
- **THEN** the fixture is placed under `test/fixtures/`

### Requirement: Benchmark Test Placement
Benchmark tests SHALL be part of the test hierarchy rather than hidden as ad hoc scripts.

#### Scenario: Query latency benchmark
- **WHEN** a benchmark measures query latency
- **THEN** it is placed under `test/benchmarks/` or the owning package's `test/benchmarks/`

### Requirement: Test Runner Policy
The repository SHALL define one default test runner policy for standard tests.

#### Scenario: Run all standard tests
- **WHEN** `bun run test` is run at the project root
- **THEN** standard unit and integration tests use the configured default runner consistently

