## MODIFIED Requirements

### Requirement: Integration Documentation
Documentation SHALL describe how to prepare a clean environment before the first real integration.

#### Scenario: First integration cleanup
- **WHEN** a user follows Hermes or MCP integration docs
- **THEN** the docs include the command for resetting config and clearing MemoHub-managed data directories

### Requirement: Test Data Isolation Documentation
Documentation SHALL describe how to run validation without polluting the default environment.

#### Scenario: Temporary test root
- **WHEN** a user runs examples, tests, or Connector validation experimentally
- **THEN** the docs show environment-variable based storage/log path overrides and dry-run cleanup
