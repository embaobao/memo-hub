## MODIFIED Requirements

### Requirement: MCP exposes unified memory tools
The MCP server SHALL expose tools in terms of memory ingestion, query views, and channel governance.

#### Scenario: Discover channel tools
- **WHEN** an Agent or skill connects to MemoHub MCP
- **THEN** it can discover channel governance tools and instructions through `memohub://tools`

### Requirement: CLI exposes access and operations support
The CLI SHALL expose commands that let users and Agents manage channel binding and inspect governance state.

#### Scenario: Inspect channels
- **WHEN** a user runs a future `memohub channel list` or `memohub channel status <channelId>`
- **THEN** the CLI returns readable channel governance state including owner Agent, purpose, project/workspace binding, status, and activity timestamps

#### Scenario: Bind channel for current runtime
- **WHEN** a user or Agent runs a future `memohub channel open` or `memohub channel use`
- **THEN** the CLI restores or creates a governed channel binding and exposes it to later runtime operations
