# flow-visualizer-api Specification

## Purpose
TBD - created by archiving change core-optimization-web-readiness. Update Purpose after archive.
## Requirements
### Requirement: Metadata reflection for Web UI
The Engine SHALL expose an API or MCP tool that returns the full system metadata, including registered tools' schemas, current tracks flow topology, and recent execution trace summaries.

#### Scenario: Inspect system for Web UI
- **WHEN** user requests system inspection
- **THEN** the system SHALL return a JSON object containing all tool manifests and flow graphs

