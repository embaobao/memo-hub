## ADDED Requirements

### Requirement: Package Manifest Analysis
The system SHALL analyze package manifests and workspace package metadata.

#### Scenario: Read package.json
- **WHEN** dependency intelligence scans a project
- **THEN** it extracts package name, version, scripts, dependencies, dev dependencies, peer dependencies, exports, types, and workspace metadata

#### Scenario: Identify workspace packages
- **WHEN** a monorepo contains workspace packages
- **THEN** it records package boundaries and internal package dependency relationships

### Requirement: Lockfile Analysis
The system SHALL analyze supported JavaScript lockfiles.

#### Scenario: Read lockfile
- **WHEN** a supported lockfile exists
- **THEN** it records resolved versions, direct/transitive relationship hints, duplicate versions, and package source metadata when available

#### Scenario: Detect lockfile drift
- **WHEN** package manifest and lockfile disagree
- **THEN** the analysis records a conflict or gap candidate for later clarification

### Requirement: Private Registry Awareness
The system SHALL support private npm registry metadata without leaking secrets.

#### Scenario: Read private registry config
- **WHEN** `.npmrc` or equivalent registry config references a private registry
- **THEN** the analyzer records registry host identity, package scope mapping, and credential reference status without storing tokens

#### Scenario: Fetch private package metadata
- **WHEN** credentials are configured and access succeeds
- **THEN** the analyzer records package version, dist tags, README summary, exports/types metadata, and provenance with redacted registry identity

### Requirement: Dependency Memory Domain
The system SHALL write dependency facts into a dedicated dependency intelligence domain.

#### Scenario: Emit dependency memory
- **WHEN** dependency analysis produces package facts
- **THEN** emitted memories include `dependency-intelligence` plus related `code-intelligence` or `project-knowledge` domains when applicable

#### Scenario: Query dependencies
- **WHEN** Hermes asks which packages a project uses or why a package exists
- **THEN** `coding_context` can recall package purpose, version, source registry, direct users, and related files

### Requirement: API And Upgrade Context
The system SHALL produce dependency context useful for API lookup and upgrade planning.

#### Scenario: Query package API
- **WHEN** Hermes asks how a dependency API should be used
- **THEN** the result can include exports, types, README notes, examples, and project-local usage references

#### Scenario: Query upgrade impact
- **WHEN** Hermes asks what an upgrade may affect
- **THEN** the result can include direct dependents, peer constraints, duplicate versions, and files importing the package

