# monorepo-workspace Specification

## Purpose
The monorepo-workspace capability defines the structural organization of the MemoHub project, utilizing Bun workspaces to manage multiple packages and applications within a single repository.
## Requirements
### Requirement: Bun workspace configuration
The root `package.json` SHALL define a Bun workspace with scalable globs for `apps/*`, `packages/*`, and `tracks/*`.

#### Scenario: Workspace resolution
- **WHEN** `bun install` is run at the project root
- **THEN** all packages in apps/*, packages/*, and tracks/* are resolved as workspace members

### Requirement: Per-package TypeScript configuration
Each package SHALL have its own `tsconfig.json` extending a shared base config, with appropriate `outDir` and `rootDir` settings.

#### Scenario: Build a single package
- **WHEN** `bun run build` is run within a specific package directory
- **THEN** only that package is compiled, with output in its local `dist/` directory

### Requirement: Shared build scripts
The root `package.json` SHALL provide scripts for building, type checking, testing, linting, formatting checks, documentation checks, dependency checks, benchmarks, local checks, and release checks.

#### Scenario: Build all packages
- **WHEN** `bun run build` is run at the project root
- **THEN** all workspace packages are built in dependency order

#### Scenario: Run release gate
- **WHEN** `bun run check:release` is run at the project root
- **THEN** build, tests, docs checks, dependency graph checks, and benchmark reporting are executed

### Requirement: Package dependency graph enforcement
The dependency direction SHALL be enforced through automated checks: apps may depend on packages and transitional tracks; packages SHALL NOT depend on apps; core SHALL NOT depend on concrete built-in tool implementations; protocol SHALL remain dependency-light.

#### Scenario: Protocol has constrained dependencies
- **WHEN** protocol package's package.json is inspected
- **THEN** dependencies SHALL contain only explicitly approved minimal runtime dependencies

#### Scenario: Package imports app code
- **WHEN** any package imports code from `apps/*`
- **THEN** the dependency check fails

#### Scenario: Core imports concrete built-in tools
- **WHEN** `packages/core` imports implementation modules from `packages/builtin-tools`
- **THEN** the dependency check fails

### Requirement: Test infrastructure per package
Each package SHALL contain its own tests under `test/` using the repository default test runner policy, runnable independently.

#### Scenario: Run tests for a single package
- **WHEN** the package test command is run within a specific package directory
- **THEN** only that package's tests are executed

### Requirement: Shared linting and formatting
The root project SHALL provide shared ESLint and Prettier configurations that apply to all packages.

#### Scenario: Lint all packages
- **WHEN** `bun run lint` is run at the project root
- **THEN** all packages are linted using the shared ESLint configuration

