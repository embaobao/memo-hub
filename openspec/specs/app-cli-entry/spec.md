# app-cli-entry Specification

## Purpose
TBD - created by archiving change unified-system-config. Update Purpose after archive.
## Requirements
### Requirement: Standardized CLI config loading and Kernel assembly
The CLI `index.ts` SHALL completely delegate configuration loading to `@memohub/config` and remove all hardcoded `registerTrack` and `new AIAdapter()` logic. It SHALL instantiate the `MemoryKernel` solely by passing the loaded configuration object.

#### Scenario: Kernel instantiation via configuration
- **WHEN** the CLI starts and runs `createKernel()`
- **THEN** it reads the combined `memohub.json` config and passes it to the `MemoryKernel` constructor without manually assembling tracks or tools

