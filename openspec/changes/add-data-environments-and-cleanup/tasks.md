## 1. Immediate Cleanup

- [x] 1.1 Update config reset to delete MemoHub-managed `tracks`, `data`, `blobs`, `logs`, and `cache` directories.
- [x] 1.2 Add unit test proving reset removes managed data directories.
- [x] 1.3 Fix clean-environment unified memory vector schema so first Hermes write does not fail.
- [x] 1.4 Preserve CLI `--source hermes` as event source so Hermes memories are recalled in the self layer.

## 2. CLI Data Commands

- [x] 2.1 Add `memohub data status` with readable default output and `--json`.
- [x] 2.2 Add `memohub data clean --dry-run` as the default behavior.
- [x] 2.3 Add `memohub data clean --all --yes --confirm DELETE_MEMOHUB_DATA` for explicit full environment cleanup.
- [x] 2.4 Add scoped cleanup flag: `--channel`.
- [ ] 2.5 Add path safety guard tests.

## 3. Environment Profiles

- [ ] 3.1 Add config schema for data environments/profiles.
- [ ] 3.2 Add `memohub env list`, `env use`, `env create`, and `env status`.
- [ ] 3.3 Ensure runtime config resolves storage/log paths from active env.
- [ ] 3.4 Ensure tests default to temporary env roots.

## 4. MCP Data Management

- [x] 4.1 Expose data status through MCP.
- [x] 4.2 Expose safe dry-run cleanup through MCP.
- [x] 4.3 Ensure destructive cleanup is gated and auditable.
- [x] 4.4 Expose channel-scoped cleanup through MCP with dry-run and second confirmation.

## 5. Documentation And Verification

- [x] 5.1 Update Hermes and MCP integration docs with first-integration cleanup.
- [ ] 5.2 Add docs for temporary test data roots.
- [x] 5.3 Add data cleanup examples to README or integration guide.
- [ ] 5.4 Run `bun run docs:site` and `bun run check:release`.
