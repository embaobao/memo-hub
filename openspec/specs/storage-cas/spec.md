# storage-cas Specification

## Purpose
The storage-cas capability provides content-addressed storage (CAS) for MemoHub, using SHA-256 hashes to uniquely identify and deduplicate content blobs on the filesystem.

## Requirements

### Requirement: Compute SHA-256 content hash
The system SHALL compute a SHA-256 hash for any input content string and use it as the unique identifier for that content blob.

#### Scenario: Hash computation
- **WHEN** content "Hello, World!" is submitted for storage
- **THEN** the system computes its SHA-256 hash as the blob identifier

#### Scenario: Deterministic hashing
- **WHEN** the same content is hashed multiple times
- **THEN** the resulting hash SHALL be identical every time

### Requirement: Store content blobs on filesystem
The system SHALL store content blobs as files at `.memohub/blobs/{first-2-chars}/{hash}`, using a two-level directory structure for filesystem performance.

#### Scenario: Store new blob
- **WHEN** content is stored via CAS and no blob with the same hash exists
- **THEN** the content is written to `.memohub/blobs/{prefix}/{hash}` and the hash is returned

#### Scenario: Deduplicate identical content
- **WHEN** content is stored via CAS and a blob with the same hash already exists
- **THEN** no new file is written and the existing hash is returned without error

### Requirement: Read content blobs by hash
The system SHALL provide a `read(hash)` method that retrieves the original content from the filesystem given its SHA-256 hash.

#### Scenario: Read existing blob
- **WHEN** read is called with a valid hash that exists in storage
- **THEN** the original content string is returned

#### Scenario: Read non-existent blob
- **WHEN** read is called with a hash that does not exist in storage
- **THEN** an error SHALL be thrown indicating the blob was not found

### Requirement: Check blob existence
The system SHALL provide a `has(hash)` method that returns boolean indicating whether a blob exists.

#### Scenario: Check existing blob
- **WHEN** has is called with a hash that exists in storage
- **THEN** true is returned

#### Scenario: Check non-existent blob
- **WHEN** has is called with a hash that does not exist
- **THEN** false is returned

### Requirement: Delete content blobs
The system SHALL provide a `delete(hash)` method that removes a blob from storage.

#### Scenario: Delete existing blob
- **WHEN** delete is called with a valid hash
- **THEN** the blob file is removed from the filesystem

#### Scenario: Delete non-existent blob
- **WHEN** delete is called with a non-existent hash
- **THEN** no error is thrown (idempotent operation)

### Requirement: Initialize storage directory
The system SHALL create the `.memohub/blobs/` directory structure on first use if it does not exist.

#### Scenario: First time initialization
- **WHEN** CAS storage is initialized and `.memohub/blobs/` does not exist
- **THEN** the directory structure is created automatically
