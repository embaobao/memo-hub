## ADDED Requirements

### Requirement: Directory Responsibility Contract
The repository SHALL document and enforce the responsibility of major top-level directories.

#### Scenario: Add runtime entry point
- **WHEN** a new runtime entry point is added
- **THEN** it is placed under `apps/`

#### Scenario: Add reusable platform code
- **WHEN** reusable code is added for protocol, core, storage, retrieval, config, tools, or integration
- **THEN** it is placed under `packages/`

#### Scenario: Add transitional track code
- **WHEN** legacy track-compatible code is added
- **THEN** it remains under `tracks/` and is documented as an internal compatibility slice

### Requirement: Generated Output Isolation
Generated outputs SHALL be isolated from authored source where practical.

#### Scenario: Generated API docs
- **WHEN** API docs are generated
- **THEN** the output path is documented and can be regenerated from source metadata

#### Scenario: Build output
- **WHEN** a package is built
- **THEN** build artifacts are emitted under that package's configured output directory

### Requirement: Script Responsibility
Engineering automation scripts SHALL live under `scripts/` and be grouped by purpose when the set grows.

#### Scenario: Add validation script
- **WHEN** a script validates docs, dependency graph, or test layout
- **THEN** it is placed under `scripts/` with a clear name and root package script entry

### Requirement: OpenSpec As Planning Source
OpenSpec SHALL remain the source of truth for proposals, design decisions, specs, and implementation tasks.

#### Scenario: Add major engineering change
- **WHEN** a change modifies build, test, docs, or project layout behavior
- **THEN** an OpenSpec change describes the expected behavior before implementation
