## 1. Monorepo Infrastructure Setup

- [x] 1.1 Initialize Bun workspace in root package.json with `workspaces: ["apps/*", "packages/*", "tracks/*"]`
- [x] 1.2 Create shared base tsconfig.json with strict mode, ESM target, and path aliases
- [x] 1.3 Create shared ESLint and Prettier configs at root level
- [x] 1.4 Create directory structure: `apps/cli`, `apps/web` (placeholder), `packages/core`, `packages/protocol`, `packages/ai-provider`, `packages/storage-soul`, `packages/storage-flesh`, `packages/librarian`, `tracks/track-source`, `tracks/track-insight`, `tracks/track-stream` (placeholder)
- [x] 1.5 Add root-level build scripts: `build`, `test`, `lint`, `clean`
- [x] 1.6 Verify `bun install` resolves all workspace packages correctly

## 2. Protocol Package (packages/protocol)

- [x] 2.1 Create package.json with only "zod" as external dependency
- [x] 2.2 Define MemoOp enum with 12 atomic operations (ADD, RETRIEVE, UPDATE, DELETE, MERGE, CLARIFY, LIST, EXPORT, DISTILL, ANCHOR, DIFF, SYNC)
- [x] 2.3 Define Text2MemInstruction interface (op, trackId, payload, context, meta)
- [x] 2.4 Define Text2MemResult interface (success, data, error, meta)
- [x] 2.5 Implement Zod schema for Text2MemInstruction validation (validateInstruction function)
- [x] 2.6 Export all types and validation utilities from package index
- [x] 2.7 Write unit tests for enum, interfaces, and validation

## 3. CAS Storage Package (packages/storage-flesh)

- [x] 3.1 Create package.json with zero external dependencies (uses Node.js crypto)
- [x] 3.2 Implement SHA-256 hash computation utility
- [x] 3.3 Implement blob storage with `.memohub/blobs/{prefix}/{hash}` file layout
- [x] 3.4 Implement `write(content)` — compute hash, store blob, return hash (dedup)
- [x] 3.5 Implement `read(hash)` — retrieve content by hash
- [x] 3.6 Implement `has(hash)` — check blob existence
- [x] 3.7 Implement `delete(hash)` — remove blob (idempotent)
- [x] 3.8 Implement directory auto-creation on first use
- [x] 3.9 Write unit tests for all CAS operations

## 4. Vector Storage Package (packages/storage-soul)

- [x] 4.1 Create package.json with @lancedb/lancedb dependency
- [x] 4.2 Define unified vector record schema (id, vector, hash, track_id, entities, metadata, timestamp)
- [x] 4.3 Implement LanceDB connection and table creation with seed record approach
- [x] 4.4 Implement `add(records)` — insert single or batch vector records
- [x] 4.5 Implement `search(vector, options)` — cosine similarity search with filters (track_id, entities)
- [x] 4.6 Implement `delete(filter)` — remove records by id or track_id
- [x] 4.7 Implement `list(filter, limit)` — list records with filtering
- [x] 4.8 Implement `update(id, changes)` — update metadata fields
- [x] 4.9 Write unit tests for all vector storage operations

## 5. AI Provider Package (packages/ai-provider)

- [x] 5.1 Create package.json with openai dependency
- [x] 5.2 Define IEmbedder interface (embed, batchEmbed)
- [x] 5.3 Define ICompleter interface (chat, summarize)
- [x] 5.4 Define ChatMessage type and AIProviderError class
- [x] 5.5 Implement OllamaAdapter class (IEmbedder + ICompleter)
- [x] 5.6 Implement AIProviderRegistry for adapter registration and lookup
- [x] 5.7 Add timeout handling (default 30s) with typed error
- [x] 5.8 Write unit tests for adapter registration and error handling

## 6. Memory Kernel Package (packages/core)

- [x] 6.1 Create package.json with workspace deps: protocol, storage-flesh, storage-soul, ai-provider
- [x] 6.2 Define IKernel interface (getEmbedder, getCAS, getVectorStorage, getConfig, dispatch)
- [x] 6.3 Define ITrackProvider interface (id, name, initialize, execute)
- [x] 6.4 Implement MemoryKernel class with constructor accepting (config, embedder, casStorage, vectorStorage)
- [x] 6.5 Implement registerTrack(provider) — register and call initialize on track provider
- [x] 6.6 Implement unregisterTrack(trackId) — remove track provider
- [x] 6.7 Implement dispatch(instruction) — validate, route to track, return Text2MemResult
- [x] 6.8 Implement event emission (pre-dispatch, post-dispatch)
- [x] 6.9 Write unit tests for registration, dispatch, and event emission

## 7. Track: Insight (tracks/track-insight)

- [x] 7.1 Create package.json with workspace dep: protocol only
- [x] 7.2 Implement ITrackProvider with id="track-insight", name="Insight Track"
- [x] 7.3 Implement ADD — store text in CAS, embed, store vector record with category/importance/tags metadata
- [x] 7.4 Implement RETRIEVE — vector search with category, tags, importance filters
- [x] 7.5 Implement UPDATE — re-embed text, update CAS and vector record
- [x] 7.6 Implement DELETE — remove records by id or category filter
- [x] 7.7 Implement MERGE — combine records, merge metadata and tags
- [x] 7.8 Implement LIST — list categories with counts
- [x] 7.9 Write unit tests for all insight track operations
- [x] 7.10 Implement all 12 Text2Mem operations (CLARIFY, DISTILL, etc.)

## 8. Track: Source (tracks/track-source)

- [x] 8.1 Create package.json with workspace deps: protocol, web-tree-sitter, tree-sitter-javascript, tree-sitter-typescript
- [x] 8.2 Implement ITrackProvider with id="track-source", name="Source Track"
- [x] 8.3 Integrate Tree-sitter for TypeScript/JavaScript AST parsing (reuse existing text-entities logic)
- [x] 8.4 Implement symbol extraction (symbol_name, ast_type, file_path, parent_symbol)
- [x] 8.5 Implement ADD — parse code, compute CAS hash, embed, store vector record
- [x] 8.6 Implement RETRIEVE — vector search with language, ast_type, symbol_name filters
- [x] 8.7 Implement DELETE — remove records by symbol_name
- [x] 8.8 Implement LIST — list symbols with optional ast_type filter
- [x] 8.9 Write unit tests for all source track operations
- [x] 8.10 Implement all 12 Text2Mem operations

## 9. Track: Stream & Wiki (tracks/track-stream, track-wiki)

- [x] 9.1 Implement StreamTrack for dialogue logs with TTL
- [x] 9.2 Implement WikiTrack for verified authoritative knowledge
- [x] 9.3 Register all core tracks in MemoryKernel

## 9. Librarian Package (packages/librarian)

- [x] 9.1 Create package.json with workspace deps: protocol, core, ai-provider
- [x] 9.2 Implement semantic deduplication scan (cosine similarity > 0.95, different hashes)
- [x] 9.3 Implement conflict detection and reporting
- [x] 9.4 Implement CLARIFY instruction dispatch for conflict resolution
- [x] 9.5 Implement DISTILL operation for knowledge refinement via LLM
- [x] 9.6 Implement Wiki-style knowledge rewriting
- [x] 9.7 Implement async execution mode (non-blocking background tasks)
- [x] 9.8 Implement scheduled execution (interval-based) and manual trigger
- [x] 9.9 Write unit tests for dedup, conflict detection, and distill operations

## 10. CLI Entry Point (apps/cli)

- [x] 10.1 Create package.json with workspace deps: core, protocol, track-insight, track-source, librarian, and commander, chalk, ora, inquirer, yaml, zod, @modelcontextprotocol/sdk
- [x] 10.2 Implement kernel initialization flow (load config → create storages → create embedder → create kernel → register tracks)
- [x] 10.3 Implement `memohub add` command — dispatch ADD to track-insight
- [x] 10.4 Implement `memohub search` command — dispatch RETRIEVE to track-insight
- [x] 10.5 Implement `memohub list` command — dispatch LIST to track-insight
- [x] 10.6 Implement `memohub delete` command — dispatch DELETE to track-insight
- [x] 10.7 Implement `memohub add-code` command — dispatch ADD to track-source
- [x] 10.8 Implement `memohub search-code` command — dispatch RETRIEVE to track-source
- [x] 10.9 Implement `memohub dedup` command — trigger librarian dedup scan
- [x] 10.10 Implement `memohub distill` command — trigger librarian distill
- [x] 10.11 Implement `memohub config --validate` command
- [x] 10.12 Implement `memohub serve` (MCP Server mode) — wrap kernel.dispatch as MCP tools
- [x] 10.13 Write integration tests for CLI commands

## 11. Data Migration & Validation

- [x] 11.1 Create migration script to convert existing GBrain LanceDB data to new track-insight schema
- [x] 11.2 Create migration script to convert existing ClawMem LanceDB data to new track-source schema
- [x] 11.3 Add dry-run mode to migration scripts with record count verification
- [x] 11.4 Test migration against real existing data

## 12. Cleanup & Documentation

- [x] 12.1 Update root package.json version to 3.0.0
- [x] 12.2 Update CLAUDE.md to reflect new monorepo structure and commands
- [ ] 12.3 Remove old `src/`, `mcp-server/`, `plugins/` directories after migration is verified
- [x] 12.4 Update CHANGELOG.md with v1 breaking changes and migration guide
- [x] 12.5 Run full build, lint, and test suite to verify everything works
