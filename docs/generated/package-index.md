# Package Index

Generated from workspace package manifests.

| Package | Directory | Workspace Dependencies |
| --- | --- | --- |
| `@memohub/protocol` | `packages/protocol` | - |
| `@memohub/ai-provider` | `packages/ai-provider` | - |
| `@memohub/config` | `packages/config` | - |
| `@memohub/storage-soul` | `packages/storage-soul` | - |
| `@memohub/storage-flesh` | `packages/storage-flesh` | `@memohub/protocol`, `@memohub/storage-soul` |
| `@memohub/core` | `packages/core` | `@memohub/ai-provider`, `@memohub/config`, `@memohub/protocol`, `@memohub/storage-flesh`, `@memohub/storage-soul` |
| `@memohub/librarian` | `packages/librarian` | `@memohub/protocol`, `@memohub/core` |
| `@memohub/builtin-tools` | `packages/builtin-tools` | `@memohub/protocol`, `@memohub/config`, `@memohub/core` |
| `@memohub/integration-hub` | `packages/integration-hub` | `@memohub/protocol`, `@memohub/core`, `@memohub/storage-flesh`, `@memohub/config` |
| `@memohub/track-wiki` | `tracks/track-wiki` | `@memohub/protocol` |
| `@memohub/track-stream` | `tracks/track-stream` | `@memohub/protocol` |
| `@memohub/track-source` | `tracks/track-source` | `@memohub/protocol` |
| `@memohub/track-insight` | `tracks/track-insight` | `@memohub/protocol` |
| `@memohub/cli` | `apps/cli` | `@memohub/ai-provider`, `@memohub/config`, `@memohub/core`, `@memohub/integration-hub`, `@memohub/protocol`, `@memohub/storage-flesh`, `@memohub/storage-soul` |
