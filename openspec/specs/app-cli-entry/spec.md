# app-cli-entry Specification

## Purpose
The app-cli-entry capability provides the primary user interface for MemoHub, offering a unified command-line tool for knowledge and code management, as well as an MCP (Model Context Protocol) server for integration with AI clients.
## Requirements
### Requirement: Unified CLI entry point
The system SHALL provide a single CLI entry point (`memohub` command) using Commander.js that serves as the primary user interface.

#### Scenario: Display help
- **WHEN** `memohub --help` is executed
- **THEN** a help message is displayed listing all available commands

#### Scenario: Display version
- **WHEN** `memohub --version` is executed
- **THEN** the current version number is displayed

### Requirement: Kernel initialization on startup
The system SHALL initialize the unified runtime (including CAS storage, vector storage, AI provider, and channel registry) on CLI startup before processing any command.

#### Scenario: Successful initialization
- **WHEN** memohub CLI starts with valid configuration
- **THEN** the unified runtime is initialized with storage, embedding, and governed channel state ready

#### Scenario: Initialization failure
- **WHEN** memohub CLI starts with missing or invalid configuration
- **THEN** a clear error message is displayed and the process exits with code 1

### Requirement: MCP Server mode
The system SHALL support running as an MCP Server (`memohub mcp serve` or `memohub serve`), exposing unified memory operations as MCP tools.

#### Scenario: Start MCP server
- **WHEN** `memohub mcp serve` is executed
- **THEN** an MCP server starts, exposing the current unified memory tools and resources

#### Scenario: MCP tool dispatch
- **WHEN** an MCP client calls a tool such as `memohub_ingest_event` or `memohub_query`
- **THEN** the tool translates the request into a unified runtime ingest or query operation

### Requirement: Knowledge management commands
The system SHALL provide unified CLI commands for memory write and query operations, including `memohub add` and `memohub query`.

#### Scenario: Add knowledge via CLI
- **WHEN** `memohub add "knowledge text" --project memo-hub --source cli --category decision` is executed
- **THEN** the input is normalized into a canonical memory event and written through the unified ingest path

#### Scenario: Search knowledge via CLI
- **WHEN** `memohub query "query text" --view project_context --project memo-hub` is executed
- **THEN** the unified runtime returns a named layered context view and the CLI displays readable self/project/global sections

### Requirement: Code management commands
The system SHALL support code-context writes and reads through the same unified memory commands rather than separate code-only commands.

#### Scenario: Add code file via CLI
- **WHEN** `memohub add "apps/cli/src/index.ts wires the CLI entrypoint" --file apps/cli/src/index.ts --project memo-hub --source codex --category code-intelligence` is executed
- **THEN** the fact is written as memory that can later be retrieved from `coding_context`

### Requirement: Governance commands
The system SHALL provide CLI commands for channel governance, data governance, configuration governance, and clarification governance.

#### Scenario: Run dedup manually
- **WHEN** a user needs to verify onboarding data without clearing all storage
- **THEN** they can use `memohub data clean --channel <channel> --dry-run` and governed channel commands instead of broad destructive cleanup

### Requirement: Configuration management
The system SHALL provide grouped `memohub config` subcommands to display, validate, read, write, and uninstall current configuration.

#### Scenario: Validate configuration
- **WHEN** `memohub config check` is executed
- **THEN** the configuration file is validated and any issues are reported

### Requirement: Standardized CLI config loading and Kernel assembly
The CLI `index.ts` SHALL completely delegate configuration loading to `@memohub/config` and assemble the unified runtime from resolved storage, AI, memory, MCP, and registry settings.

#### Scenario: Kernel instantiation via configuration
- **WHEN** the CLI starts and runs `createRuntime()`
- **THEN** it reads the combined `memohub.json` config and assembles CAS, vector storage, embedding provider, and channel registry without manually assembling legacy track providers

### Requirement: CLI exposes memory operations
The CLI SHALL expose memory operations using unified memory terminology and SHALL NOT expose track options.

#### Scenario: Write memory
- **WHEN** a user writes memory through CLI
- **THEN** the command can normalize the input into a canonical memory object with source, actor, scopes, visibility, domains, and provenance

#### Scenario: Track option removed
- **WHEN** a user needs to influence storage behavior
- **THEN** they provide source/project/category/file inputs rather than `trackId`

### Requirement: MCP exposes unified memory tools
The MCP server SHALL expose tools in terms of memory ingestion and query views.

#### Scenario: Tool registration
- **WHEN** the MCP server starts
- **THEN** it registers `memohub_ingest_event`, `memohub_query`, `memohub_summarize`, `memohub_clarification_create`, and `memohub_clarification_resolve`
- **AND** it does not register track compatibility tools

#### Scenario: Query agent profile
- **WHEN** an MCP client asks for an agent profile view
- **THEN** the server uses layered recall and returns self/project/global context sections

#### Scenario: Query project code context
- **WHEN** an MCP client asks for coding context in a project
- **THEN** the server returns code memory, project knowledge, global conventions, source attribution, and conflicts or gaps

#### Scenario: Discover MCP capabilities
- **WHEN** an Agent or skill connects to MemoHub MCP
- **THEN** it can read `memohub://tools`
- **AND** the resource returns current tools, resources, query views, layers, operations, startup command, storage paths, and log path

#### Scenario: Resolve external clarification
- **WHEN** a user clarifies a conflict or missing memory through an MCP client
- **THEN** the client can call `memohub_clarification_resolve`
- **AND** MemoHub writes the answer as a curated searchable memory object linked to the clarification and original memory IDs

### Requirement: CLI exposes access and operations support
The CLI SHALL expose commands that let agents discover how to connect to the MCP service, inspect resolved configuration, and maintain service status.

#### Scenario: Generate MCP access instructions
- **WHEN** a user runs `memohub mcp config` or `memohub mcp tools`
- **THEN** the CLI returns agent-readable MCP client config, current tool catalog, resources, views, layers, operations, and usage instructions

#### Scenario: Check service status and logs
- **WHEN** a user runs `memohub mcp status`, `memohub mcp doctor`, or `memohub logs query`
- **THEN** the CLI returns unified runtime status, resolved storage paths, log path, latest logs, exposed MCP dimensions, and access-readiness checks

### Requirement: Configuration drives the unified runtime
The unified CLI/MCP runtime SHALL be assembled from new architecture configuration sections rather than hard-coded storage and MCP defaults.

#### Scenario: Resolve runtime configuration
- **WHEN** CLI or MCP starts
- **THEN** it resolves storage, AI, MCP, and memory capability settings from configuration and environment overrides
- **AND** those settings drive CAS path, vector path, vector table, embedding model, MCP log path, exposed resources, views, layers, and operations

#### Scenario: Read and write runtime configuration
- **WHEN** a user runs `memohub config get <path>` or `memohub config set <path> <value>`
- **THEN** the CLI reads or writes the requested dotted configuration path
- **AND** string values can be provided as JSON strings to avoid ambiguous type coercion

### Requirement: Data governance commands
The CLI and MCP SHALL separate data governance from configuration management.

#### Scenario: Rebuild managed schema
- **WHEN** a user runs `memohub data rebuild-schema --yes --confirm DELETE_MEMOHUB_DATA`
- **THEN** MemoHub removes managed data directories, rebuilds the managed schema baseline, and requires the caller to restart any running MCP service

#### Scenario: MCP data governance
- **WHEN** an MCP client needs cleanup status, channel cleanup, full cleanup, or schema rebuild
- **THEN** it uses `memohub_data_manage`
- **AND** destructive operations require explicit confirmation

### Requirement: Shared CLI And MCP Interface Metadata
CLI commands and MCP tools SHALL be described by shared metadata sufficient for registration, validation, and documentation generation.

#### Scenario: Generate CLI docs
- **WHEN** CLI reference docs are generated
- **THEN** command names, options, descriptions, and examples come from the CLI command metadata

#### Scenario: Generate MCP docs
- **WHEN** MCP reference docs are generated
- **THEN** tool names, schemas, descriptions, and examples come from the MCP tool metadata

### Requirement: Interface Drift Detection
The project SHALL detect drift between implemented CLI/MCP interfaces and documented interfaces.

#### Scenario: Undocumented MCP tool
- **WHEN** a MCP tool is registered but missing from generated or checked docs
- **THEN** the docs check reports the mismatch

#### Scenario: Removed CLI command remains documented
- **WHEN** a CLI command is removed from implementation but still appears in checked docs
- **THEN** the docs check reports the stale command
