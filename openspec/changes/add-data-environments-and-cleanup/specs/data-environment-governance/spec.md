## ADDED Requirements

### Requirement: Reset Clears Managed Data
The system SHALL clear MemoHub-managed data directories when resetting global configuration for first integration.

#### Scenario: Reset before first integration
- **WHEN** the user runs the config reset/init flow
- **THEN** the system removes managed `data`, `blobs`, `logs`, `cache`, and stale `tracks` directories under the MemoHub config root before writing the default config

#### Scenario: Preserve unmanaged paths
- **WHEN** reset runs
- **THEN** it does not delete source repositories, arbitrary user directories, or paths outside the MemoHub managed root

### Requirement: Data Environment Profiles
The system SHALL support isolated data environments for production, testing, and sandbox usage.

#### Scenario: Use test environment
- **WHEN** tests or temporary validation run
- **THEN** they can target a dedicated data root that does not write to the default user data root

#### Scenario: Show active environment
- **WHEN** the user checks data status
- **THEN** the response includes active environment name, root, vector database path, blob path, log path, and table name

### Requirement: Data Cleanup Commands
The system SHALL provide safe data cleanup operations.

#### Scenario: Dry run cleanup
- **WHEN** cleanup is requested without explicit confirmation
- **THEN** the system reports planned deletions or filters without deleting data

#### Scenario: Clean by scope
- **WHEN** the user cleans by project, source, channel, session, or task
- **THEN** the system deletes only matching records and reports what was affected

### Requirement: Cleanup Safety Guard
The system SHALL prevent destructive cleanup outside managed MemoHub data roots.

#### Scenario: Unsafe root
- **WHEN** a cleanup target resolves to home, filesystem root, repository root, or an unmanaged path
- **THEN** the operation fails before deleting anything

### Requirement: Data Portability Extension Point
The system SHALL preserve an extension point for backup, export, import, and restore.

#### Scenario: Future export
- **WHEN** export/import is implemented later
- **THEN** it can reuse the data environment and scope filters defined by this capability

