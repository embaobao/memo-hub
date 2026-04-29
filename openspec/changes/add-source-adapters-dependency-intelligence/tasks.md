## 1. Planning And Contracts

- [ ] 1.1 Define `source-adapter-runtime` package boundary and public interfaces.
- [ ] 1.2 Define adapter manifest, scan input, scan cursor, scan report, and normalized output types.
- [ ] 1.3 Define credential reference and redaction rules in config schema.
- [ ] 1.4 Add OpenSpec-driven docs for adapter lifecycle and security expectations.

## 2. Code Repository Adapter MVP

- [ ] 2.1 Add GitLab repository adapter package or module with health check and scan skeleton.
- [ ] 2.2 Support GitLab project URL/project ID, branch/ref, include/exclude, token ref, and project/workspace scope config.
- [ ] 2.3 Implement repository tree and file metadata scan.
- [ ] 2.4 Implement TypeScript-first file summary, exported symbol, import relation, and API surface extraction.
- [ ] 2.5 Emit `code-intelligence` and `project-knowledge` events with repo, commit, file, symbol, and adapter provenance.
- [ ] 2.6 Add incremental cursor based on commit SHA and file hash.

## 3. Dependency Intelligence MVP

- [ ] 3.1 Parse `package.json` and workspace package manifests.
- [ ] 3.2 Parse `bun.lock` first, then design extension points for npm/pnpm/yarn lockfiles.
- [ ] 3.3 Detect direct/dev/peer dependencies, workspace links, duplicate versions, and package source hints.
- [ ] 3.4 Parse `.npmrc` registry/scope mapping with credential redaction.
- [ ] 3.5 Fetch public/private registry metadata when credentials are available.
- [ ] 3.6 Emit `dependency-intelligence` events with package, version, registry, API surface, and usage provenance.

## 4. CLI/MCP Integration

- [ ] 4.1 Add CLI commands for adapter list, health check, dry run, scan, and status.
- [ ] 4.2 Add MCP tools/resources for adapter discovery and scan initiation.
- [ ] 4.3 Ensure `memohub://tools` exposes adapter capabilities and Hermes instructions.
- [ ] 4.4 Ensure config get/set/check covers adapter configuration.

## 5. Query And Recall Validation

- [ ] 5.1 Add tests proving GitLab-style code events are recalled through `coding_context`.
- [ ] 5.2 Add tests proving dependency events are recalled through `coding_context` and `project_context`.
- [ ] 5.3 Add tests for self/project/global layering when Hermes asks repository and package questions.
- [ ] 5.4 Add conflict/gap tests for manifest-lockfile drift and missing private registry credentials.

## 6. Documentation And Verification

- [ ] 6.1 Document Hermes GitLab repository onboarding.
- [ ] 6.2 Document npm/private registry dependency intelligence flow.
- [ ] 6.3 Add realistic examples for private package API recall and upgrade impact questions.
- [ ] 6.4 Update generated CLI/MCP references after commands/tools are implemented.
- [ ] 6.5 Run `bun run docs:site` and `bun run check:release` before implementation archive.
