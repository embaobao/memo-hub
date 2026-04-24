## ADDED Requirements

### Requirement: ADD operation for knowledge ingestion
The track SHALL implement the ADD operation to ingest knowledge: compute CAS hash → store in flesh → embed → store in soul with track_id="track-insight".

#### Scenario: Add a knowledge entry
- **WHEN** an ADD instruction is dispatched with payload containing text, category, importance, and tags
- **THEN** the knowledge text is stored in CAS, embedded, and a vector record is created in soul with track_id="track-insight" and metadata containing category, importance, tags

#### Scenario: Add with entity extraction
- **WHEN** an ADD instruction is dispatched with payload containing text
- **THEN** entities are extracted from the text (using NLP patterns or LLM) and stored in the entities field of the vector record

### Requirement: RETRIEVE operation for knowledge search
The track SHALL implement the RETRIEVE operation to search knowledge by vector similarity, with optional filters for category, tags, importance threshold.

#### Scenario: Search by semantic query
- **WHEN** a RETRIEVE instruction is dispatched with payload.query="user authentication preferences"
- **THEN** knowledge records are returned ordered by semantic similarity

#### Scenario: Filter by category
- **WHEN** a RETRIEVE instruction includes payload.filters.category="user"
- **THEN** only knowledge records in the "user" category are returned

#### Scenario: Filter by importance threshold
- **WHEN** a RETRIEVE instruction includes payload.filters.minImportance=0.7
- **THEN** only knowledge records with importance >= 0.7 are returned

### Requirement: UPDATE operation for knowledge modification
The track SHALL implement the UPDATE operation to modify existing knowledge records.

#### Scenario: Update knowledge text
- **WHEN** an UPDATE instruction is dispatched with payload.id and payload.text
- **THEN** the knowledge is re-embedded, CAS blob is updated, and the vector record is updated

### Requirement: DELETE operation for knowledge removal
The track SHALL implement the DELETE operation to remove knowledge records by id or filter.

#### Scenario: Delete by id
- **WHEN** a DELETE instruction is dispatched with payload.ids=["id1", "id2"]
- **THEN** those records are removed from soul

#### Scenario: Delete by category
- **WHEN** a DELETE instruction is dispatched with payload.category="obsolete"
- **THEN** all records in that category are removed

### Requirement: MERGE operation for knowledge consolidation
The track SHALL implement the MERGE operation to combine multiple knowledge records into one, with conflict detection.

#### Scenario: Merge compatible records
- **WHEN** a MERGE instruction is dispatched with payload.ids pointing to semantically similar records
- **THEN** the records are combined into a single record with merged metadata and tags

### Requirement: LIST operation for category listing
The track SHALL implement the LIST operation to list knowledge categories with counts.

#### Scenario: List all categories
- **WHEN** a LIST instruction is dispatched
- **THEN** all categories are returned with record counts per category
