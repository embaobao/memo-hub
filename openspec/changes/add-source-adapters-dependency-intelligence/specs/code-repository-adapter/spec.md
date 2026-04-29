## ADDED Requirements

### Requirement: Repository Source Configuration
The system SHALL support repository adapter configuration for GitLab-first code analysis.

#### Scenario: Configure GitLab repository
- **WHEN** a user configures a GitLab project URL or project ID
- **THEN** the adapter records repository identity, branch/ref, project scope, workspace scope, include/exclude rules, and credential reference

#### Scenario: Validate repository access
- **WHEN** the adapter health check runs
- **THEN** it verifies repository metadata access without writing memory

### Requirement: Repository Structure Memory
The system SHALL convert repository structure into organized code memory.

#### Scenario: Scan repository tree
- **WHEN** the adapter scans a repository
- **THEN** it emits memories for repository overview, package/module boundaries, important directories, and entry files

#### Scenario: Preserve organization
- **WHEN** files are converted into memory
- **THEN** the adapter preserves repo, package, file, and symbol relationships instead of only emitting disconnected text chunks

### Requirement: Code Intelligence Extraction
The system SHALL extract code intelligence suitable for `coding_context` queries.

#### Scenario: Extract TypeScript API surface
- **WHEN** the adapter analyzes TypeScript files
- **THEN** it records exported functions, classes, types, constants, file path, symbol name, and related imports when available

#### Scenario: Extract dependency references
- **WHEN** source files import local or package dependencies
- **THEN** the adapter records relation metadata linking file, symbol, package, and dependency identity

### Requirement: Repository Provenance
The system SHALL attach repository provenance to every emitted code memory.

#### Scenario: Preserve commit identity
- **WHEN** a code memory is emitted from a GitLab ref
- **THEN** the memory provenance includes repository id or URL, branch/ref, commit SHA when available, file path, and source adapter id

### Requirement: Hermes Code Recall
The system SHALL make repository memories usable by Hermes through named context views.

#### Scenario: Query file responsibility
- **WHEN** Hermes asks what a file or module does
- **THEN** `coding_context` can recall repository overview, file memory, symbols, dependencies, and related project decisions

#### Scenario: Query API usage
- **WHEN** Hermes asks how an internal API should be used
- **THEN** `coding_context` can recall API surface, examples or README-derived notes, and dependent files when available

