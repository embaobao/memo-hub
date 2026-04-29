## ADDED Requirements

### Requirement: Agent Operation Contract
The system SHALL define a common contract for agent-assisted operations over memory objects.

#### Scenario: Run operation over evidence
- **WHEN** an operation such as summarize, extract, annotate, clarify, or review runs
- **THEN** it records operation type, input memory IDs, output memory IDs or governance records, source agent, timestamp, confidence, and metadata

### Requirement: Summarization Operation
The system SHALL support summarizing selected memories into a linked summary object.

#### Scenario: Summarize recent Hermes activity
- **WHEN** the caller requests a summary of Hermes recent activity
- **THEN** the operation creates an artifact or memory summary linked to the original sessions, tasks, and activity records

### Requirement: Extraction Operation
The system SHALL support extracting structured knowledge from raw or semi-structured memories.

#### Scenario: Extract tasks from session memory
- **WHEN** session evidence contains task commitments or progress updates
- **THEN** extraction can propose task-session memory objects linked to the session evidence

#### Scenario: Extract claims from project discussion
- **WHEN** project discussion evidence contains decisions or component responsibilities
- **THEN** extraction can propose project-knowledge claims linked to the discussion evidence

### Requirement: Annotation Operation
The system SHALL support remarks and review notes on existing memories.

#### Scenario: Add clarification note
- **WHEN** a human or agent adds a note to a conflicted memory
- **THEN** the note is stored as an annotation linked to the target memory and actor

### Requirement: Clarification Operation
The system SHALL support generating and resolving clarification items.

#### Scenario: Generate clarification from conflict
- **WHEN** two memories conflict
- **THEN** the system can create a clarification item with the question, relevant evidence links, and target subject

#### Scenario: Resolve clarification
- **WHEN** a user or trusted agent answers a clarification item
- **THEN** the system links the answer to the clarification and can propose curated memory updates

### Requirement: Review State
The system SHALL keep agent-generated outputs reviewable.

#### Scenario: Proposed summary
- **WHEN** an agent creates a summary
- **THEN** it is marked as proposed/raw unless policy explicitly allows automatic curation

#### Scenario: Accepted output
- **WHEN** a reviewer accepts an agent-generated output
- **THEN** the object state can transition to curated while preserving provenance
