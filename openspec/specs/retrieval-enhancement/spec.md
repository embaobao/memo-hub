# retrieval-enhancement Specification

## Purpose
TBD - created by archiving change modular-config-and-enhanced-tracks. Update Purpose after archive.
## Requirements
### Requirement: Atomic Reranker Tool
The system SHALL provide a `builtin:reranker` tool that takes a list of results and a query, and returns the results re-ordered by semantic relevance using an AI model.

#### Scenario: Reranking search results
- **WHEN** the retriever returns 10 results
- **THEN** the reranker SHALL use the `ranker` agent to re-score them and return the top-N results

### Requirement: Result Aggregator Tool
The system SHALL provide a `builtin:aggregator` tool to merge results from multiple tracks into a single unified list.

#### Scenario: Unified search
- **WHEN** results come from both `track-insight` and `track-source`
- **THEN** the aggregator SHALL de-duplicate by `hash` and sort by `timestamp` or `score`

