# layered-memory-query Specification

## Purpose
TBD - created by archiving change unified-memory-hub-model. Update Purpose after archive.
## Requirements
### Requirement: Layered Recall Policy
The system SHALL support a default query policy that recalls from `self`, `project`, and `global` layers.

#### Scenario: Query agent habits
- **WHEN** Hermes asks for its habits
- **THEN** the query planner recalls Hermes self memory, project-shared habit/context memory, and global habit/convention memory

#### Scenario: Query coding context
- **WHEN** an agent asks for code context in a project
- **THEN** the query planner recalls relevant self/task memory, project code/knowledge memory, and global conventions

### Requirement: Weighted Fusion
The system SHALL combine layered recall results using default weight order `self > project > global`.

#### Scenario: Same fact appears in multiple layers
- **WHEN** similar memories are recalled from self and project layers
- **THEN** fusion preserves both source attribution and ranks the self-context version higher by default

### Requirement: Configurable Weight Policy
The system SHALL support configurable recall weighting policies beyond the default layer order.

#### Scenario: Apply view-specific weights
- **WHEN** the caller requests `coding_context`
- **THEN** the query planner can increase domain weight for `code-intelligence` and source trust for scanner evidence while preserving self/project/global layer attribution

#### Scenario: Apply recency weights
- **WHEN** the caller requests `recent_activity`
- **THEN** the query planner can increase the score of recent session and task memories

#### Scenario: Apply confidence weights
- **WHEN** verified and inferred memories both match a query
- **THEN** the configured policy can rank verified or observed memories above inferred memories

### Requirement: Weight Explainability
The system SHALL expose enough metadata to audit why results were ranked.

#### Scenario: Return weighted result metadata
- **WHEN** a context view returns recalled objects
- **THEN** the response includes layer attribution and policy metadata such as policy ID, applied factors, or score breakdown

### Requirement: Layer Attribution
The system SHALL preserve which layer produced each result.

#### Scenario: Return context view
- **WHEN** a query returns a context view
- **THEN** results are grouped or tagged as `selfContext`, `projectContext`, `globalContext`, and `conflictsOrGaps`

### Requirement: Query Views
The system SHALL support named query views for common product scenarios.

#### Scenario: Agent profile view
- **WHEN** the caller requests `agent_profile`
- **THEN** the response emphasizes agent habits, preferences, recent activity, and long-term memory

#### Scenario: Project context view
- **WHEN** the caller requests `project_context`
- **THEN** the response emphasizes business facts, project decisions, component responsibilities, and project conventions

#### Scenario: Coding context view
- **WHEN** the caller requests `coding_context`
- **THEN** the response includes code memory, files, symbols, dependencies, API references, and related project knowledge

#### Scenario: Recent activity view
- **WHEN** the caller requests `recent_activity`
- **THEN** the response emphasizes sessions, tasks, activity timeline, and actor/source attribution

### Requirement: Visibility Filtering
The system SHALL enforce visibility while resolving recall layers.

#### Scenario: Private memory
- **WHEN** a memory object has `visibility = "private"`
- **THEN** it is visible only to allowed actor/self queries and not to unrelated project or global queries

#### Scenario: Shared project memory
- **WHEN** a memory object has project scope and `visibility = "shared"`
- **THEN** it can be recalled by compatible actors in that project scope

