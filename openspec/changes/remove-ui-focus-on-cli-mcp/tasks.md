## 1. Cleanup & Archival

- [x] 1.1 Archive `apps/web` directory and remove from workspaces in root `package.json`
- [x] 1.2 DELETE `packages/core/src/flow-engine.ts` and `packages/config/src/resolver.ts`
- [x] 1.3 Remove `flows` sections from all JSONC configuration files

## 2. Kernel & Registry Refactoring

- [x] 2.1 Refactor `IKernel` interface to include `getTool(id: string)` and `listTools()`
- [x] 2.2 Refactor `MemoryKernel` to remove all references to `FlowEngine`
- [x] 2.3 Refactor `ITrackProvider.initialize` to receive a registry-capable host context

## 3. Track Logic Re-implementation

- [x] 3.1 Refactor `track-insight` to use direct `resources.kernel.getTool('builtin:vector')` calls
- [x] 3.2 Refactor `track-source` to use direct code analyzer and storage tool calls
- [ ] 3.3 Validate ADD/RETRIEVE operations via direct code-driven execution

## 4. Headless & Daemon Support

- [x] 4.1 Implement `MemoryDaemon` for persistent lifecycle management (Fastify based)
- [ ] 4.2 Map simplified Track operations to MCP Tool handlers
- [ ] 4.3 Update `memohub inspect` command to display a clean Registry Map (Tracks x Tools)

## 5. Verification & Documentation

- [ ] 5.1 Perform integration tests for code-driven memory ingestion
- [ ] 5.2 Update `README.md` and `docs/` to reflect the new code-first architecture
- [ ] 5.3 Verify Claude Desktop integration with the simplified MCP tools
