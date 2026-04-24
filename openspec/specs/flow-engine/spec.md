# flow-engine Specification

## Purpose
TBD - created by archiving change unified-system-config. Update Purpose after archive.
## Requirements
### Requirement: Flow-based track orchestration
The Kernel SHALL execute `Tracks` as a `Flow` consisting of sequential `steps`. Each step SHALL invoke a specified `tool` with an `input` mapped from the Context Pool.

#### Scenario: Step execution
- **WHEN** a track starts, the payload is placed in the Context Pool at `$.payload`
- **THEN** the Flow Engine executes each step sequentially, passing the mapped input to the tool

### Requirement: Context Pool variable mapping
The Engine SHALL evaluate JSONPath expressions (e.g., `$.step_name.result`) in the `input` configuration of a step against the current Context Pool.

#### Scenario: Variable substitution
- **WHEN** a step configures `input: { content: "$.payload.text" }`
- **THEN** the Flow Engine SHALL extract the `text` property from the `payload` context variable and pass it as the `content` argument to the tool

