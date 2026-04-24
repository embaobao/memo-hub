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
The system SHALL initialize the MemoryKernel (including CAS storage, vector storage, AI provider, and all registered tracks) on CLI startup before processing any command.

#### Scenario: Successful initialization
- **WHEN** memohub CLI starts with valid configuration
- **THEN** MemoryKernel is initialized with all built-in tracks registered

#### Scenario: Initialization failure
- **WHEN** memohub CLI starts with missing or invalid configuration
- **THEN** a clear error message is displayed and the process exits with code 1

### Requirement: MCP Server mode
The system SHALL support running as an MCP Server (`memohub serve` or `memohub mcp`), exposing kernel dispatch as MCP tools.

#### Scenario: Start MCP server
- **WHEN** `memohub serve` is executed
- **THEN** an MCP server starts, exposing tools for each Text2Mem operation

#### Scenario: MCP tool dispatch
- **WHEN** an MCP client calls a tool (e.g., `query_knowledge`)
- **THEN** the tool translates the request into a Text2MemInstruction and dispatches it through the kernel

### Requirement: Knowledge management commands
The system SHALL provide CLI commands for knowledge operations: `memohub add`, `memohub search`, `memohub list`, `memohub delete`.

#### Scenario: Add knowledge via CLI
- **WHEN** `memohub add "knowledge text" --category user --importance 0.8` is executed
- **THEN** an ADD instruction is dispatched to track-insight with the specified parameters

#### Scenario: Search knowledge via CLI
- **WHEN** `memohub search "query text" --limit 5` is executed
- **THEN** a RETRIEVE instruction is dispatched and results are displayed to the user

### Requirement: Code management commands
The system SHALL provide CLI commands for code operations: `memohub add-code <file>`, `memohub search-code <query>`.

#### Scenario: Add code file via CLI
- **WHEN** `memohub add-code src/index.ts` is executed
- **THEN** the file is parsed with Tree-sitter and an ADD instruction is dispatched to track-source

### Requirement: Governance commands
The system SHALL provide CLI commands for governance: `memohub dedup`, `memohub distill`.

#### Scenario: Run dedup manually
- **WHEN** `memohub dedup --track track-insight` is executed
- **THEN** a dedup scan is triggered on the specified track and results are displayed

### Requirement: Configuration management
The system SHALL provide a `memohub config` command to validate and display current configuration.

#### Scenario: Validate configuration
- **WHEN** `memohub config --validate` is executed
- **THEN** the configuration file is validated and any issues are reported

### Requirement: Standardized CLI config loading and Kernel assembly
The CLI `index.ts` SHALL completely delegate configuration loading to `@memohub/config` and remove all hardcoded `registerTrack` and `new AIAdapter()` logic. It SHALL instantiate the `MemoryKernel` solely by passing the loaded configuration object.

#### Scenario: Kernel instantiation via configuration
- **WHEN** the CLI starts and runs `createKernel()`
- **THEN** it reads the combined `memohub.json` config and passes it to the `MemoryKernel` constructor without manually assembling tracks or tools

