# storage-vector Specification

## Purpose
The storage-vector capability provides vector database functionality using LanceDB, enabling semantic search and metadata-based retrieval for MemoHub.

## Requirements

### Requirement: Unified vector record schema
The system SHALL use a unified schema for all vector records with fields: `id` (string), `vector` (Float32Array), `hash` (string, pointing to CAS blob), `track_id` (string), `entities` (string array), `metadata` (Record<string, any>), `timestamp` (string ISO 8601).

#### Scenario: Create a valid vector record
- **WHEN** a vector record is created with all required fields
- **THEN** it conforms to the unified schema and can be stored in LanceDB

### Requirement: Create and initialize vector table
The system SHALL create a LanceDB table with the unified schema if it does not exist, using a seed record approach to establish the schema then removing the seed.

#### Scenario: First-time table creation
- **WHEN** storage-soul connects and the table does not exist
- **THEN** a new table is created with the unified schema

#### Scenario: Existing table reuse
- **WHEN** storage-soul connects and the table already exists
- **THEN** the existing table is used without modification

### Requirement: Add vector records
The system SHALL provide an `add(records)` method to insert one or more vector records into the LanceDB table.

#### Scenario: Add single record
- **WHEN** add is called with one vector record
- **THEN** the record is inserted and can be retrieved by its id

#### Scenario: Add batch records
- **WHEN** add is called with an array of vector records
- **THEN** all records are inserted in a single batch operation

### Requirement: Vector similarity search
The system SHALL provide a `search(vector, options)` method that performs cosine distance similarity search, returning results ordered by relevance.

#### Scenario: Search with limit
- **WHEN** search is called with a query vector and limit=5
- **THEN** up to 5 records are returned, ordered by cosine similarity (closest first)

#### Scenario: Search with track filter
- **WHEN** search is called with a filter on track_id
- **THEN** only records matching the specified track_id are returned

#### Scenario: Search with entity filter
- **WHEN** search is called with a filter on entities
- **THEN** only records containing the specified entity values are returned

### Requirement: Delete vector records
The system SHALL provide a `delete(filter)` method to remove records matching a filter condition.

#### Scenario: Delete by id
- **WHEN** delete is called with an id filter
- **THEN** the record with that id is removed from the table

#### Scenario: Delete by track_id
- **WHEN** delete is called with a track_id filter
- **THEN** all records belonging to that track are removed

### Requirement: List records with filtering
The system SHALL provide a `list(filter, limit)` method to retrieve records matching a filter, limited by count.

#### Scenario: List all records for a track
- **WHEN** list is called with a track_id filter and limit=100
- **THEN** up to 100 records for that track are returned

### Requirement: Update vector record
The system SHALL provide an `update(id, changes)` method to modify fields of an existing record (except id and vector which require delete+re-add).

#### Scenario: Update metadata
- **WHEN** update is called with an id and new metadata
- **THEN** the record's metadata field is updated while other fields remain unchanged
