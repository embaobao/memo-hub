## ADDED Requirements

### Requirement: Interval-based governance trigger
The system SHALL support an asynchronous scheduler that triggers specific "governance flows" (e.g., deduplication, summarization) at configured time intervals.

#### Scenario: Run weekly summarization
- **WHEN** the governance interval for `track-insight` is reached
- **THEN** the system SHALL execute the `distill` flow on un-processed records in the background

### Requirement: Background flow execution
The governance scheduler SHALL execute flows in a way that does not block the primary memory dispatching operations.

#### Scenario: Simultaneous add and govern
- **WHEN** a background governance task is running
- **THEN** an incoming `ADD` instruction SHALL be processed immediately with minimal latency impact
