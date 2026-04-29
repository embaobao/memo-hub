## ADDED Requirements

### Requirement: Domain Projection Policy
The system SHALL route canonical memory objects to projection policies based on domain descriptors rather than user-facing tracks.

#### Scenario: Project knowledge projection
- **WHEN** an object has domain `project-knowledge`
- **THEN** the system can project it into semantic memory and knowledge governance stores

#### Scenario: Code intelligence projection
- **WHEN** an object has domain `code-intelligence`
- **THEN** the system can project it into semantic memory and structured code/dependency indexes

#### Scenario: Task session projection
- **WHEN** an object has domain `task-session`
- **THEN** the system can project it into activity and session views

### Requirement: Evidence Retention
The system SHALL preserve raw evidence separately from curated memories.

#### Scenario: Raw evidence ingested
- **WHEN** an external source writes a new raw observation
- **THEN** the system keeps an evidence record that can be traced from later curated memories or artifacts

### Requirement: Governance State
The system SHALL track governance state for memory objects.

#### Scenario: Raw state
- **WHEN** a memory object is first ingested without review
- **THEN** it may be stored with `state = "raw"`

#### Scenario: Curated state
- **WHEN** a memory object is accepted, merged, or confirmed
- **THEN** it may be stored with `state = "curated"`

#### Scenario: Conflict state
- **WHEN** two memories make incompatible claims about the same subject
- **THEN** at least one related object or governance record is marked `conflicted` and exposed in query views

#### Scenario: Archived state
- **WHEN** a memory object is retained for history but should not appear in default context
- **THEN** it is marked `archived`

### Requirement: Clarification Queue
The system SHALL support generating clarification items from conflicts or missing context.

#### Scenario: Conflicting component responsibility
- **WHEN** different sources disagree about a component responsibility
- **THEN** the system can create a clarification item linked to the conflicting evidence

### Requirement: Agent-Assisted Summarization
The system SHALL support agent-assisted summarization over selected memory objects.

#### Scenario: Summarize agent activity
- **WHEN** a caller asks to summarize Hermes recent work
- **THEN** an agent operation can create a summary object linked to the input sessions, tasks, and memories

#### Scenario: Preserve summary provenance
- **WHEN** an agent creates a summary
- **THEN** the summary records source agent, model/provider metadata when available, operation type, input references, confidence, and review state

### Requirement: Agent-Assisted Extraction
The system SHALL support extracting entities, claims, tasks, preferences, dependencies, and API facts from raw evidence.

#### Scenario: Extract code dependency facts
- **WHEN** an agent or scanner processes code evidence
- **THEN** extraction can create structured memory objects or claims linked to the original code evidence

#### Scenario: Extract user preference
- **WHEN** a conversation contains a durable user or agent preference
- **THEN** extraction can propose a habit/convention memory linked to the source conversation

### Requirement: Agent Annotations
The system SHALL support adding agent or human annotations to memory objects.

#### Scenario: Add review note
- **WHEN** a reviewer adds a note explaining why a memory is accepted or rejected
- **THEN** the annotation is preserved with actor/source, timestamp, target memory, and optional confidence

### Requirement: Agent-Generated Clarification
The system SHALL support agent-generated clarification prompts for conflicts and gaps.

#### Scenario: Generate clarification question
- **WHEN** conflicting evidence is detected for the same subject
- **THEN** an agent operation can generate a clarification question linked to all relevant evidence

### Requirement: Reviewable Agent Output
Agent-generated summaries, extractions, annotations, and clarifications SHALL be reviewable before they become curated knowledge.

#### Scenario: Proposed extraction
- **WHEN** an agent extracts a claim from raw evidence
- **THEN** the extracted claim starts as raw or proposed state until accepted by a review operation or policy

### Requirement: Snapshot and Artifact Records
The system SHALL represent snapshots, exports, and generated documents as artifacts.

#### Scenario: Backup snapshot
- **WHEN** a backup is created
- **THEN** the system records an artifact with scope, source, timestamp, and references to included memory objects

#### Scenario: Future wiki export
- **WHEN** a wiki-like export is generated
- **THEN** the system can represent it as an artifact linked to source memories and provenance
