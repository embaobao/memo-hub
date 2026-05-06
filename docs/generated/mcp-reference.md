# MCP Reference

Generated from `apps/cli/src/interface-metadata.ts`.

## Tools

### memohub_ingest_event

Status: `recommended`

Ingest external events into shared MemoHub memory with channel binding and project context

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

### memohub_list

Status: `recommended`

List governed memory objects directly by actor/project/global perspective

Inputs:

- `perspective`
- `actorId`
- `projectId`
- `workspaceId`
- `sessionId`
- `taskId`
- `domains`
- `limit`

### memohub_summarize

Status: `recommended`

Create a governed summary candidate from explicit memory text

Inputs:

- `text`
- `actorId`

### memohub_clarification_create

Status: `recommended`

Create clarification items for explicit conflicting or missing memory text

Inputs:

- `text`
- `actorId`

### memohub_clarification_resolve

Status: `recommended`

Write external clarification answers back as curated searchable memory

Inputs:

- `clarificationId`
- `answer`
- `resolvedBy`
- `projectId`
- `actorId`
- `memoryIds`

### memohub_logs_query

Status: `recommended`

Query MemoHub logs by event, level, channel, project, session, task, or source for agent self-diagnosis

Inputs:

- `tail`
- `event`
- `level`
- `channel`
- `projectId`
- `sessionId`
- `taskId`
- `source`

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

Check config or uninstall global config with second confirmation.

Inputs:

- `action=check|uninstall`
- `confirm=DELETE_MEMOHUB_CONFIG for uninstall`

### memohub_data_manage

Status: `recommended`

Preview cleanup targets, clean one channel, clean all MemoHub-managed data with second confirmation, or rebuild schema. clean_channel, clean_all, and rebuild_schema require explicit user authorization.

Inputs:

- `action=status|clean_channel|clean_all|rebuild_schema`
- `channel or actorId/source/projectId/purpose/status for clean_channel`
- `confirm=DELETE_MEMOHUB_DATA for deletion`
- `dryRun`

### memohub_channel_open

Status: `recommended`

Open or restore a governed channel binding for an actor or workspace source

Inputs:

- `actorId`
- `source`
- `projectId`
- `purpose`
- `workspaceId`
- `sessionId`
- `taskId`
- `channelId`

### memohub_channel_list

Status: `recommended`

List governed channels and their current lifecycle state

Inputs:

- `actorId`
- `source`
- `projectId`
- `purpose`
- `status`

### memohub_channel_status

Status: `recommended`

Read one governed channel entry by channelId

Inputs:

- `channelId`

### memohub_channel_close

Status: `recommended`

Close a governed channel so it is no longer implicitly reused

Inputs:

- `channelId`

### memohub_channel_use

Status: `recommended`

Restore an existing governed channel as the current active binding

Inputs:

- `channelId`

## Resources

### memohub_stats

URI: `memohub://stats`

Current unified runtime status, tools, views, storage, and logs

### memohub_tools

URI: `memohub://tools`

Self-describing MCP tool catalog for agents and skills

