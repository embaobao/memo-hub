## MODIFIED Requirements

### Requirement: Source Adapter Normalization
The system SHALL normalize every external source into canonical memory events or memory objects using governed channel and binding metadata when available.

#### Scenario: Normalize governed Hermes channel
- **WHEN** Hermes sends a memory event after restoring a governed channel
- **THEN** the normalized object records the governed channel ID, owner Agent binding, relevant scopes, and stable provenance

#### Scenario: Normalize auto-bound IDE workspace
- **WHEN** an IDE source writes through an auto-restored or auto-created workspace channel
- **THEN** the normalized object records the managed workspace channel binding rather than an unconstrained ad hoc channel string

### Requirement: Stable Provenance
The system SHALL preserve channel governance metadata inside provenance without conflating it with visibility.

#### Scenario: Preserve channel provenance
- **WHEN** a normalized memory object is persisted
- **THEN** its provenance records channel ID, source, owner Agent, and binding metadata sufficient for audit, cleanup, and explanation
