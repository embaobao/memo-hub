## 1. Channel Registry Model

- [ ] 1.1 Define `ChannelRegistryEntry` model, purpose enum, status enum, and naming validation rules.
- [ ] 1.2 Define primary-channel uniqueness rules for `ownerAgentId + projectId + workspaceId`.
- [ ] 1.3 Define how channel registry is stored and queried without mixing it with free-form memory content.
- [ ] 1.4 Define provenance projection rules so channel metadata remains query-explainable.

## 2. CLI And MCP Governance

- [ ] 2.1 Add CLI commands for `channel open`, `channel list`, `channel status`, `channel close`, and `channel use`.
- [ ] 2.2 Add MCP tools for channel open/list/status/close.
- [ ] 2.3 Ensure `memohub://tools` exposes channel governance instructions, naming expectations, and default binding behavior.
- [ ] 2.4 Ensure `data clean --channel` only operates on registered channels and returns clear status when cleanup is not ready.

## 3. Agent Binding And IDE Auto-binding

- [ ] 3.1 Add Hermes-style explicit binding and recovery flow for primary/session/test channels.
- [ ] 3.2 Add IDE workspace auto-binding flow that restores or creates a workspace primary channel without explicit user interaction.
- [ ] 3.3 Add default runtime context inheritance so ingest/query can reuse the current bound channel when appropriate.
- [ ] 3.4 Add config surface for channel naming policy, auto-binding strategy, and default purpose mapping.

## 4. Query, Sharing, And Recall

- [ ] 4.1 Ensure layered query keeps `self > project > global` semantics and does not treat channel as visibility.
- [ ] 4.2 Ensure channel metadata can improve result explainability and recency ranking without overriding scope rules.
- [ ] 4.3 Add structured retrieval for “my current channels”, “my primary channel”, and “what channel did I use last time” scenarios.
- [ ] 4.4 Add cross-project recall rules that preserve project attribution when global knowledge is returned.

## 5. Documentation And Validation

- [ ] 5.1 Update Hermes integration docs with primary/session/test channel flows and recovery guidance.
- [ ] 5.2 Update IDE integration docs with workspace auto-binding behavior and governance visibility.
- [ ] 5.3 Add realistic examples for channel restoration, cleanup safety, and cross-project understanding queries.
- [ ] 5.4 Run `bun run docs:generate`, `bun run docs:check`, and `bun run check:release` before archiving the change.
