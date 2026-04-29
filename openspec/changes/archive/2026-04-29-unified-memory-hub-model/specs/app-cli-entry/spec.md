## ADDED Requirements

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
- **THEN** it registers `memohub_ingest_event`, `memohub_query`, `memohub_summarize`, `memohub_clarify`, and `memohub_resolve_clarification`
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
- **THEN** the client can call `memohub_resolve_clarification`
- **AND** MemoHub writes the answer as a curated searchable memory object linked to the clarification and original memory IDs

### Requirement: CLI exposes access and operations support
The CLI SHALL expose commands that let agents discover how to connect to the MCP service, inspect resolved configuration, and maintain service status.

#### Scenario: Generate MCP access instructions
- **WHEN** a user runs `memohub mcp-config` or `memohub mcp-tools`
- **THEN** the CLI returns agent-readable MCP client config, current tool catalog, resources, views, layers, operations, and usage instructions

#### Scenario: Check service status and logs
- **WHEN** a user runs `memohub mcp-status`, `memohub mcp-doctor`, or `memohub mcp-logs`
- **THEN** the CLI returns unified runtime status, resolved storage paths, log path, latest logs, exposed MCP dimensions, and access-readiness checks

### Requirement: Configuration drives the unified runtime
The unified CLI/MCP runtime SHALL be assembled from new architecture configuration sections rather than hard-coded storage and MCP defaults.

#### Scenario: Resolve runtime configuration
- **WHEN** CLI or MCP starts
- **THEN** it resolves storage, AI, MCP, and memory capability settings from configuration and environment overrides
- **AND** those settings drive CAS path, vector path, vector table, embedding model, MCP log path, exposed resources, views, layers, and operations

#### Scenario: Read and write runtime configuration
- **WHEN** a user runs `memohub config-get <path>` or `memohub config-set <path> <value>`
- **THEN** the CLI reads or writes the requested dotted configuration path
- **AND** string values can be provided as JSON strings to avoid ambiguous type coercion
