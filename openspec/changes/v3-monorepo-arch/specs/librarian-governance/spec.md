## ADDED Requirements

### Requirement: Semantic deduplication scan
The system SHALL scan the vector storage for records with similar vectors but different CAS hashes, identifying potential duplicates across and within tracks.

#### Scenario: Detect near-duplicates
- **WHEN** a dedup scan is run on a track's records
- **THEN** pairs of records with cosine similarity > 0.95 but different hashes are flagged as potential duplicates

#### Scenario: No duplicates found
- **WHEN** a dedup scan is run and all records are sufficiently distinct
- **THEN** an empty list of conflicts is returned

### Requirement: Conflict detection and reporting
The system SHALL detect conflicts where records have similar meaning but contradictory content, and generate a conflict report.

#### Scenario: Detect contradictory knowledge
- **WHEN** two knowledge records have high vector similarity but contain negation or opposing claims
- **THEN** a conflict report is generated with both records and a conflict type classification

### Requirement: CLARIFY instruction dispatch
The system SHALL dispatch CLARIFY instructions to the kernel when conflicts are detected, allowing user or Agent resolution.

#### Scenario: Dispatch clarify for conflict
- **WHEN** a conflict is detected between two records
- **THEN** a CLARIFY instruction is dispatched with payload containing both records, conflict description, and resolution options (keep-first, keep-second, merge, skip)

#### Scenario: User resolves conflict
- **WHEN** a CLARIFY response is received with resolution="merge"
- **THEN** the librarian dispatches a MERGE instruction to combine the conflicting records

### Requirement: DISTILL operation for knowledge refinement
The system SHALL implement the DISTILL operation to summarize, consolidate, and improve knowledge quality in the background.

#### Scenario: Distill high-similarity records
- **WHEN** DISTILL is run on a set of similar records
- **THEN** the records are summarized into a single refined record, and originals are marked as superseded

### Requirement: Wiki-style knowledge rewriting
The system SHALL support rewriting knowledge records as concise, well-structured entries, preserving the original in CAS.

#### Scenario: Rewrite verbose entry
- **WHEN** a verbose knowledge record is identified for rewriting
- **THEN** a new condensed version is created via LLM, stored as a new CAS blob, and the vector record is updated to point to the new blob

### Requirement: Async execution mode
The system SHALL support running governance operations asynchronously as a background process, not blocking the main dispatch loop.

#### Scenario: Run governance in background
- **WHEN** a governance task is started
- **THEN** it runs independently and reports results via events, without blocking new dispatch calls

### Requirement: Scheduled execution
The system SHALL support both manual triggering and scheduled (interval-based) execution of governance tasks.

#### Scenario: Schedule periodic dedup
- **WHEN** a dedup task is scheduled with interval=3600000 (1 hour)
- **THEN** the dedup scan runs every hour automatically

#### Scenario: Manual trigger
- **WHEN** a governance task is triggered manually via CLI
- **THEN** it runs once immediately and reports results
