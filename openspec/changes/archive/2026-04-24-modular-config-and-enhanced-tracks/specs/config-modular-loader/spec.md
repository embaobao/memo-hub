## ADDED Requirements

### Requirement: Recursive configuration directory scanning
The configuration loader SHALL recursively scan the `~/.memohub/conf.d/` directory for `.json` and `.jsonc` files and merge them into the primary configuration.

#### Scenario: Merging modular tracks
- **WHEN** `conf.d/tracks/meeting.json` contains a track definition
- **THEN** it SHALL be available in the system as if it were defined in the main `memohub.json`

### Requirement: Deduplication during merge
When merging lists (like `tracks` or `tools`), the system SHALL use the `id` property as a unique key. If a duplicate ID is found, the definition in the main `memohub.json` SHALL take precedence.

#### Scenario: Override modular track with main config
- **WHEN** both `memohub.json` and `conf.d/tracks/custom.json` define a track with ID `track-x`
- **THEN** the definition in `memohub.json` is used
