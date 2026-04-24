# monorepo-workspace Specification

## Purpose
The monorepo-workspace capability defines the structural organization of the MemoHub project, utilizing Bun workspaces to manage multiple packages and applications within a single repository.

## Requirements

### Requirement: Bun workspace configuration
The root `package.json` SHALL define a Bun workspace with `workspaces: ["apps/*", "packages/*", "tracks/*"]`.

#### Scenario: Workspace resolution
- **WHEN** `bun install` is run at the project root
- **THEN** all packages in apps/*, packages/*, and tracks/* are resolved as workspace members

### Requirement: Per-package TypeScript configuration
Each package SHALL have its own `tsconfig.json` extending a shared base config, with appropriate `outDir` and `rootDir` settings.

#### Scenario: Build a single package
- **WHEN** `bun run build` is run within a specific package directory
- **THEN** only that package is compiled, with output in its local `dist/` directory

### Requirement: Shared build scripts
The root `package.json` SHALL provide scripts for building all packages (`build`), running all tests (`test`), and linting (`lint`).

#### Scenario: Build all packages
- **WHEN** `bun run build` is run at the project root
- **THEN** all workspace packages are built in dependency order

### Requirement: Package dependency graph enforcement
The dependency direction SHALL be enforced: `apps → tracks → core → protocol`, `core → {storage-*, ai-provider}`. No package SHALL depend on apps or tracks in reverse direction.

#### Scenario: Protocol has no external dependencies
- **WHEN** protocol package's package.json is inspected
- **THEN** dependencies SHALL only contain "zod"

#### Scenario: Tracks depend only on protocol
- **WHEN** a track package's package.json is inspected
- **THEN** its workspace dependencies SHALL only include "protocol"

### Requirement: Test infrastructure per package
Each package SHALL contain its own tests using Bun test runner, runnable independently.

#### Scenario: Run tests for a single package
- **WHEN** `bun test` is run within a specific package directory
- **THEN** only that package's tests are executed

### Requirement: Shared linting and formatting
The root project SHALL provide shared ESLint and Prettier configurations that apply to all packages.

#### Scenario: Lint all packages
- **WHEN** `bun run lint` is run at the project root
- **THEN** all packages are linted using the shared ESLint configuration
