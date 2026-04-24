# secret-manager Specification

## Purpose
TBD - created by archiving change core-optimization-web-readiness. Update Purpose after archive.
## Requirements
### Requirement: Dynamic environment secrets
The configuration loader SHALL resolve strings starting with `env://` by looking up the corresponding environment variable.

#### Scenario: Resolve API Key from environment
- **WHEN** config contains `apiKey: "env://MY_TOKEN"` and `process.env.MY_TOKEN` is "xyz"
- **THEN** the resolved configuration SHALL have `apiKey: "xyz"`

