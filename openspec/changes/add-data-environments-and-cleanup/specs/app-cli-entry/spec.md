## MODIFIED Requirements

### Requirement: Configuration Management Commands
CLI configuration commands SHALL prepare MemoHub for a clean first integration.

#### Scenario: Initialize and clear managed data
- **WHEN** the user runs `memohub data rebuild-schema --yes --confirm DELETE_MEMOHUB_DATA`
- **THEN** the command removes MemoHub-managed stale data directories under the config root and rebuilds the managed schema baseline

### Requirement: Data Management Commands
CLI SHALL expose readable data status and cleanup commands.

#### Scenario: Show data status
- **WHEN** the user runs `memohub data status`
- **THEN** the CLI prints active environment, root, storage paths, log path, table name, and cleanup guidance in readable text by default

#### Scenario: Clean data with confirmation
- **WHEN** the user runs `memohub data clean`
- **THEN** the CLI supports dry-run by default and requires explicit confirmation for destructive cleanup
