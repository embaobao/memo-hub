# MemoHub Hermes Connector

This directory contains the first official `Hermes Connector` for MemoHub.

It implements the Hermes memory provider plugin contract and deliberately keeps
the boundary thin:

- Hermes lifecycle hooks live here.
- Deterministic candidate extraction lives here.
- All storage, query, logs, and cleanup operations go through the MemoHub CLI.

That keeps the data source unified and prevents a Hermes-only memory store from
drifting away from the main MemoHub runtime.

Current compatibility target:

- Python `>=3.9`

Default installation path:

1. `memohub hermes install`
2. MemoHub copies the packaged Hermes plugin assets into:
   - `~/.memohub/integrations/hermes/plugin/`
   - `~/.memohub/integrations/hermes/provider.json`
3. MemoHub creates Hermes-facing symlinks:
   - `~/.hermes/plugins/memohub`
   - `~/.hermes/memohub-provider.json`
4. Hermes activates the provider via `hermes memory setup`

Official plugin layout:

```text
connectors/hermes/
└── plugins/
    └── memory/
        └── memohub/
            ├── __init__.py
            ├── plugin.yaml
            ├── provider.py
            ├── client.py
            ├── extractor.py
            ├── formatter.py
            └── cli.py
```

This shape matches the Hermes memory provider plugin example. The provider also
supports `register(ctx)` and `register_cli(subparsers)` so it can be mounted in
Hermes' native plugin discovery flow instead of only being imported manually.

The CLI release pipeline copies this plugin into `apps/cli/assets/hermes/`
before publishing, so end users do not need to clone the repository to install
the Hermes provider.

Provider setup notes:

- Hermes setup is still installation-first: `memohub hermes install` writes the
  default provider config file, and `hermes memory setup` activates it.
- Local model selection such as Ollama or LM Studio is controlled by MemoHub's
  shared config file, not by a second Hermes-only model config layer.
