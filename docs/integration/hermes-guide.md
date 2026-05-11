# Hermes Plugin Integration

Last updated: 2026-05-07

This document defines the single supported Hermes integration pattern for MemoHub:

- Hermes uses MemoHub as an official memory provider plugin
- Hermes, CLI, and MCP share one MemoHub datasource
- Hermes does not maintain a private memory store

This is the standard integration document that can be given directly to Hermes.

## What Hermes Gets

After integration, Hermes can use MemoHub as its shared long-term memory center:

- recover its own durable habits and preferences
- replay recent work and session history
- read project context
- write clarified facts back into governed memory
- inspect logs and validate test cleanup safely

The default retrieval order stays:

```text
self -> project -> global
```

## Install

Hermes only needs this sequence:

```bash
memohub hermes install
hermes memory setup
hermes plugins reload
memohub hermes doctor
```

Expected result:

- `hermes memory setup` can see `memohub`
- active memory provider can be switched to `memohub`
- `memohub hermes doctor` passes
- Hermes shares the same MemoHub datasource used by CLI and MCP

## Managed Paths

MemoHub manages one real plugin asset copy:

```text
~/.memohub/integrations/hermes/
  plugin/
  provider.json
```

Hermes reads that installation through symlinks:

```text
~/.hermes/plugins/memohub -> ~/.memohub/integrations/hermes/plugin
~/.hermes/memohub-provider.json -> ~/.memohub/integrations/hermes/provider.json
```

Hermes user-side discovery must read:

```text
~/.hermes/plugins/memohub
```

MemoHub does not ask Hermes to clone this repository or build the CLI.

## Shared Config

Hermes does not carry a second model configuration layer.

MemoHub shared config is the only source of truth:

```text
~/.memohub/memohub.json
```

That shared config can define local providers such as:

- `ollama`
- `lmstudio`

MemoHub currently supports separate provider and model selection for:

- `ai.agents.embedder`
- `ai.agents.summarizer`

Example:

```json
{
  "configVersion": "unified-memory-1",
  "system": {
    "root": "~/.memohub",
    "lang": "zh"
  },
  "storage": {
    "root": "~/.memohub",
    "blobPath": "~/.memohub/blobs",
    "vectorDbPath": "~/.memohub/data/memohub.lancedb",
    "vectorTable": "memohub",
    "dimensions": 768
  },
  "ai": {
    "providers": [
      {
        "id": "ollama",
        "type": "ollama",
        "url": "http://localhost:11434/v1"
      },
      {
        "id": "lmstudio",
        "type": "openai-compatible",
        "url": "http://127.0.0.1:1234/v1"
      }
    ],
    "agents": {
      "embedder": {
        "provider": "ollama",
        "model": "nomic-embed-text-v2-moe",
        "dimensions": 768
      },
      "summarizer": {
        "provider": "ollama",
        "model": "qwen2.5:7b"
      }
    }
  }
}
```

If LM Studio is used, it should be configured here, not in a Hermes-only file.

## Provider Config

MemoHub writes the Hermes provider config here:

```text
~/.memohub/integrations/hermes/provider.json
```

Typical content:

```json
{
  "memohub_command": ["memohub"],
  "language": "auto",
  "test_validation": true
}
```

Rules:

- `memohub_command` must point to the shared global `memohub`
- do not point Hermes to a private db path
- do not create a Hermes-only storage root

## Minimal Verification

Run:

```bash
memohub config check
memohub config show
memohub hermes install
hermes memory setup
hermes plugins reload
memohub hermes doctor
memohub list --perspective actor --actor hermes --json
memohub logs query --tail 50 --actor hermes --json
```

If local embedding is required, make sure the configured local provider is already running.

Examples:

```bash
ollama serve
```

or use a running LM Studio OpenAI-compatible endpoint.

## First Production Loop

Hermes should use this operational pattern:

1. Activate `memohub` in `hermes memory setup`
2. Read its own memory first
3. Continue task work
4. Write durable preferences, activity, project facts, and clarifications
5. Use CLI or MCP for traceable recall and troubleshooting

The intended loop is:

```text
Hermes
  -> recover self memory
  -> read project context
  -> perform task
  -> write durable memory
  -> later recover from the same shared memory center
```

## Safe Test Governance

Validation data must use `purpose=test`.

Preview cleanup first:

```bash
memohub data clean --actor hermes --purpose test --dry-run --json
```

Only execute real deletion after explicit authorization:

```bash
memohub data clean --actor hermes --purpose test --yes --confirm DELETE_MEMOHUB_DATA
```

Do not execute these during normal onboarding:

- `config-init`
- full reset
- schema rebuild
- clean all data

## What Hermes Can Be Told To Do

The following text can be sent directly to Hermes:

```text
Use MemoHub as your shared long-term memory provider.

Execute:

memohub hermes install
hermes memory setup
hermes plugins reload
memohub hermes doctor

Then verify:

1. `hermes memory setup` can see `memohub`
2. active memory provider is `memohub`
3. `memohub hermes doctor` passes
4. MemoHub datasource is shared with CLI and MCP

Then run recall checks:

memohub list --perspective actor --actor hermes --json
memohub query "Hermes habits" --view agent_profile --actor hermes --project memo-hub --json
memohub logs query --tail 100 --actor hermes --json

If you create validation data, only use test semantics and preview cleanup first:

memohub data clean --actor hermes --purpose test --dry-run --json

Do not execute config-init, rebuild schema, full reset, or create a Hermes-only datasource.

Report:

- install success
- provider discovery success
- shared datasource confirmed
- write -> query -> logs -> dry-run cleanup loop confirmed
- ready for full adoption or not
```

## Source Layout

Hermes plugin source in this repository:

```text
connectors/hermes/plugins/memory/memohub/
```

Bundled CLI release assets:

```text
apps/cli/assets/hermes/plugins/memory/memohub/
```

The plugin follows the official Hermes fixed-directory pattern and supports:

- `register(ctx)`
- `register_cli(subparsers)`
- `plugin.yaml`

## Compatibility

- Python `>=3.9`
- one shared MemoHub datasource
- no Hermes private storage fork

## Related Documents

- [Integration Index](/Users/embaobao/workspace/ai/memo-hub/docs/integration/index.md)
- [Configuration Guide](/Users/embaobao/workspace/ai/memo-hub/docs/guides/configuration.md)
- [Preflight Checklist](/Users/embaobao/workspace/ai/memo-hub/docs/integration/preflight-checklist.md)
- [Hermes Validation Report](/Users/embaobao/workspace/ai/memo-hub/docs/integration/hermes-validation-report.md)
