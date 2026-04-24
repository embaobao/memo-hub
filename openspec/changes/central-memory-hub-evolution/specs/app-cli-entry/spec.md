## MODIFIED Requirements

### Requirement: Standardized CLI config loading and Kernel assembly
The CLI `index.ts` SHALL completely delegate configuration loading to `@memohub/config`. In "client mode", it SHALL prioritize communication with the running Daemon over direct filesystem access.

#### Scenario: Proxy commands to Daemon
- **WHEN** the CLI starts and detects an active Daemon lock
- **THEN** it SHALL forward instructions (like `ADD`, `RETRIEVE`) to the Daemon via RPC instead of initializing a local MemoryKernel
