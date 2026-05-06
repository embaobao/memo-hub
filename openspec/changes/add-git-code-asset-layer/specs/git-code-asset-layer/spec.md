## ADDED Requirements

### Requirement: Git Code Asset Layer
The system SHALL model code as versioned assets before projecting selected conclusions into Memory.

#### Scenario: Store repository snapshot
- **WHEN** a code Connector scans a Git-backed repository
- **THEN** MemoHub records repository identity, branch, commit, file paths, content hashes, and scan time as a repository snapshot
- **AND** the raw code facts remain separable from governed Memory records

#### Scenario: Preserve source text as root fact
- **WHEN** MemoHub extracts structure from a source file
- **THEN** the original file content or content reference remains available for traceability
- **AND** the extracted structure does not become the only source of truth

### Requirement: Code Asset Indexes
The system SHALL support multiple code indexes derived from repository assets.

#### Scenario: Build structural index
- **WHEN** source files are scanned
- **THEN** MemoHub can derive symbols, imports, exports, dependency edges, and API surfaces as structured code assets

#### Scenario: Build retrieval indexes
- **WHEN** code assets are available
- **THEN** MemoHub can query by path, full text, symbol, dependency relation, and semantic recall
- **AND** full-text and path search are not replaced by vector search alone

### Requirement: Code Query Separation
The system SHALL separate code queries from Memory queries.

#### Scenario: Ask a code question
- **WHEN** Hermes, CLI, MCP, or IDE asks for source code, symbol usage, dependencies, or API shape
- **THEN** MemoHub uses the code asset query path first
- **AND** Memory results are used as governance explanations or project conclusions, not as the only source of code facts

#### Scenario: Project context consumes code projection
- **WHEN** code assets produce durable project conclusions
- **THEN** MemoHub may project those conclusions into Memory as code intelligence or project knowledge with source asset references

### Requirement: Code Connector Boundary
The system SHALL require code-related Connectors to write through the code asset layer before Memory projection.

#### Scenario: GitLab Connector scans repository
- **WHEN** a future GitLab Connector scans repository files and metadata
- **THEN** it writes repository snapshot and code assets first
- **AND** only governed summaries or conclusions are projected into Memory

#### Scenario: IDE Connector reports workspace code
- **WHEN** a future IDE Connector reports workspace code context
- **THEN** it binds through Channel, writes code assets with project and repository context, and preserves provenance for later cleanup and audit
