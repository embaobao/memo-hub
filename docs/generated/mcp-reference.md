# MCP Reference

Generated from `apps/cli/src/interface-metadata.ts`.

## Tools

### memohub_ingest_event

Status: `recommended`

Ingest external events through the Integration Hub

Inputs:

- `event.source`
- `event.channel`
- `event.kind`
- `event.projectId`
- `event.confidence`
- `event.payload.text`

### memohub_query

Status: `recommended`

Query named layered context views through the unified query tool

Inputs:

- `view`
- `actorId`
- `projectId`
- `sessionId`
- `taskId`
- `query`
- `limit`

### memohub_summarize

Status: `recommended`

Create a governed summary candidate from explicit memory text

Inputs:

- `text`
- `agentId`

### memohub_clarify

Status: `recommended`

Create clarification items for explicit conflicting or missing memory text

Inputs:

- `text`
- `agentId`

### memohub_resolve_clarification

Status: `recommended`

Write external clarification answers back as curated searchable memory

Inputs:

- `clarificationId`
- `answer`
- `resolvedBy`
- `projectId`
- `actorId`
- `memoryIds`

### memohub_config_get

Status: `recommended`

Read MemoHub resolved runtime configuration or a dotted raw config path

Inputs:

- `path`

### memohub_config_set

Status: `recommended`

Write MemoHub configuration by dotted path

Inputs:

- `path`
- `value`

### memohub_config_manage

Status: `recommended`

Check, initialize, or uninstall MemoHub global configuration

Inputs:

- `action=check|init|uninstall`

## Resources

### memohub_stats

URI: `memohub://stats`

Current unified runtime status, tools, views, storage, and logs

### memohub_tools

URI: `memohub://tools`

Self-describing MCP tool catalog for agents and skills

