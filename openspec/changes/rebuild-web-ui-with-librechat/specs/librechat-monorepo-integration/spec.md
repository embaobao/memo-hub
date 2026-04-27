## ADDED Requirements

### Requirement: Workspace Integration
The system SHALL integrate LibreChat source code into the `apps/web` directory of the MemoHub monorepo.

#### Scenario: Successful build in monorepo
- **WHEN** developer runs `bun run build` in the monorepo root
- **THEN** the `apps/web` (LibreChat) client is compiled using Vite

### Requirement: Shared Configuration
The system SHALL ensure the web application shares the central JSONC configuration for system paths and ports.

#### Scenario: Unified port management
- **WHEN** active port is changed in `config.jsonc`
- **THEN** both CLI and Web server respect the new port
