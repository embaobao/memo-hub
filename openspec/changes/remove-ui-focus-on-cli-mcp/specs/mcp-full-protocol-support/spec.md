## ADDED Requirements

### Requirement: Tool Mapping
The system SHALL expose all 12 Text2Mem operations as MCP tools.

| Text2Mem Op | MCP Tool Name | Description |
| :--- | :--- | :--- |
| ADD | `memohub_add` | Add new memory |
| RETRIEVE | `memohub_search` | Search memories |
| DELETE | `memohub_delete` | Remove memory |
| CONNECT | `memohub_link` | Link two entities |
| CLARIFY | `memohub_resolve` | Solve conflicts |
| INSPECT | `memohub_inspect` | Get kernel status |

### Requirement: Resource Exposure
The system SHALL provide MCP Resources for system inspection.
- `memohub://config`: Current JSONC config.
- `memohub://tracks`: List of registered tracks and their flow stats.
