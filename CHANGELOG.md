# Changelog

All notable changes to MemoHub will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-04-17

### Added
- 🎉 Initial release of MemoHub
- 🧠 Dual-track memory system (GBrain + ClawMem)
- 🔍 Semantic search with vector embeddings
- 💾 LanceDB integration for high-performance storage
- 🤖 Local embedding model support via Ollama
- 🔧 CLI tool with `mh` command
- ⚙️ YAML configuration file support
- 🌍 Environment variable overrides
- 📊 Statistics and monitoring commands
- 🔌 Plugin system architecture (experimental)
  - Auto memory extraction from sessions
  - Memory injection to systems
- 📚 Comprehensive documentation
  - Quick start guide
  - Configuration guide
  - Private repository sync guide
  - API documentation
  - FAQ

### Features
- GBrain: General knowledge storage with categories, tags, and importance scores
- ClawMem: Code memory with AST type detection and language support
- Semantic search with similarity scores
- Multi-format search results
- Configuration validation
- Hermes compatibility (shared database support)

### Security
- Local-only data storage
- Private repository sync support
- Config file exclusion from Git
- No data uploaded to third-party services

### Documentation
- README.md with project overview
- Quick start guide (guides/quickstart.md)
- Configuration guide (guides/configuration.md)
- Private sync guide (guides/private-sync.md)
- API documentation (docs/api.md)
- FAQ (docs/faq.md)

### Technical
- TypeScript + Bun runtime
- Node.js >= 22.0.0
- LanceDB 0.26.2
- Ollama integration (nomic-embed-text-v2-moe)
- Commander.js CLI framework
- Chalk for terminal styling
- Ora for spinners

### CLI Commands
- `mh stats` - Display memory system statistics
- `mh add-knowledge` - Add knowledge to GBrain
- `mh search-knowledge` - Search knowledge
- `mh delete-knowledge` - Delete knowledge
- `mh add-code` - Add code to ClawMem
- `mh search-code` - Search code
- `mh config` - Configuration management
- `mh --help` - Display help

---

## [3.0.0] - 2026-04-24

### 🚨 BREAKING CHANGES

#### Architecture Overhaul
- **Monorepo Migration**: Complete restructuring from monolithic `src/` to Bun Workspace Monorepo (`apps/*`, `packages/*`, `tracks/*`)
- **Text2Mem Protocol**: Introduction of unified 12-operation instruction set replacing scattered CLI/MCP interfaces
- **Storage Separation**: "Flesh and Soul" separation — CAS (Content-Addressable Storage) for raw content + LanceDB for vector indices
- **API Changes**: All CLI commands and MCP tools now use Text2Mem instruction format

#### CLI Changes
- `mh add-knowledge` → `memohub add` (dispatches to track-insight)
- `mh search-knowledge` → `memohub search` (dispatches to track-insight)
- `mh add-code` → `memohub add-code` (dispatches to track-source)
- `mh search-code` → `memohub search-code` (dispatches to track-source)
- Old command format still supported but deprecated

#### Configuration Changes
- YAML configuration structure updated to reflect new architecture
- Environment variables renamed for consistency
- New routing configuration for intelligent track selection

#### Database Schema Changes
- Unified vector record schema with required `hash` and `track_id` fields
- All existing GBrain/ClawMem data requires migration
- Entity extraction now integrated into core write pipeline

### ✨ Added

#### Core Packages
- **@memohub/protocol**: Text2Mem protocol layer with 12 atomic operations (ADD, RETRIEVE, UPDATE, DELETE, MERGE, CLARIFY, LIST, EXPORT, DISTILL, ANCHOR, DIFF, SYNC)
- **@memohub/storage-flesh**: CAS (Content-Addressable Storage) for blob storage with SHA-256 deduplication
- **@memohub/storage-soul**: Unified LanceDB wrapper with consistent schema
- **@memohub/ai-provider**: Pluggable AI adapter interfaces (IEmbedder, ICompleter) with Ollama implementation
- **@memohub/core**: MemoryKernel调度总线，支持动态轨道注册
- **@memohub/librarian**: Asynchronous governance (deduplication, conflict detection, distillation)

#### Track System
- **@memohub/track-insight**: Knowledge/fact track (replaces GBrain)
  - Enhanced metadata: category, importance, tags, entities
  - Improved search with filtering and ranking
- **@memohub/track-source**: Code/AST track (replaces ClawMem)
  - Tree-sitter integration for accurate symbol extraction
  - Multi-language support with AST-based parsing
- **@memohub/track-stream**: Placeholder for future context/session track

#### Enhanced Features
- **Entity Extraction**: Automatic extraction of entities from text and code
- **Dual-Track Retrieval**: Unified search across knowledge and code with intelligent ranking
- **Routing System**: Intelligent routing based on file extensions and content type
- **Hydration**: Automatic content retrieval from CAS on search when needed
- **Git Hooks Integration**: Automatic knowledge extraction from commits
- **MCP Server**: Unified MCP server with 9 tools for AI agent integration

#### Developer Experience
- Monorepo with workspace dependencies
- Unified build system (`bun run build`, `bun test`)
- Comprehensive type safety with strict TypeScript
- Event-driven architecture for observability
- Pluggable track system for easy extension

### 🔧 Changed

#### Improved Performance
- CAS deduplication reduces storage footprint
- Optimized vector search with entity-based filtering
- Parallel track queries for faster retrieval
- Connection pooling for LanceDB

#### Better Reliability
- Zod runtime validation for all instructions
- Structured error handling with AIProviderError
- Event emission for debugging and monitoring
- Schema validation on database initialization

#### Enhanced Documentation
- Updated CLAUDE.md with monorepo architecture
- Migration guide for v2 → v1
- Protocol specification documentation
- Track implementation guide

### 🗑️ Removed

#### Deprecated Features
- Old monolithic `src/` structure (will be removed in v1.1)
- Legacy GBrain and ClawMem classes (use tracks instead)
- Old MCP server implementation (use new unified server)
- Plugin system (replaced by track system)

### 📦 Migration Guide

#### For Users

1. **Backup your data**:
   ```bash
   cp -r ~/.memohub ~/.memohub.backup
   ```

2. **Install dependencies**:
   ```bash
   bun install
   bun run build
   ```

3. **Run migration script**:
   ```bash
   # Dry run first
   bun run scripts/migrate-gbrain.ts --dry-run
   bun run scripts/migrate-clawmem.ts --dry-run
   
   # Actual migration
   bun run scripts/migrate-gbrain.ts
   bun run scripts/migrate-clawmem.ts
   ```

4. **Update configuration**:
   - Copy `config/config.example.yaml` to `config/config.yaml`
   - Update paths and settings as needed
   - Run `memohub config --validate` to verify

5. **Verify installation**:
   ```bash
   memohub list
   memohub search "test query"
   ```

#### For Developers

1. **Update imports**:
   ```typescript
   // Old
   import { GBrain } from './lib/gbrain';
   
   // New
   import { MemoOp } from '@memohub/protocol';
   import { InsightTrack } from '@memohub/track-insight';
   ```

2. **Use Kernel dispatch**:
   ```typescript
   // Old
   await gbrain.addKnowledge({ text, category });
   
   // New
   await kernel.dispatch({
     op: MemoOp.ADD,
     trackId: 'track-insight',
     payload: { text, category }
   });
   ```

3. **Implement tracks**:
   - Extend `ITrackProvider` interface
   - Register with `kernel.registerTrack(new MyTrack())`
   - Handle relevant MemoOp operations

### 🔐 Security

- All data remains local
- CAS provides content integrity verification
- No breaking changes to privacy model
- Enhanced error messages prevent accidental data exposure

### 📚 Documentation

- Updated README.md with v1 architecture
- New CLAUDE.md for developers
- Protocol specification in packages/protocol
- Migration scripts with --dry-run support

### 🧪 Testing

- Comprehensive unit tests for all packages
- Integration tests for CLI commands
- Migration script validation
- MCP server conformance tests

---

## [Unreleased]

### Planned
- Automatic sync with private repositories
- Multi-user support
- Advanced search filters
- Code snippet preview
- Knowledge graph visualization
- Backup and restore UI
- Web interface
- Mobile app support
- API rate limiting
- Database encryption
- Audit logging

---

## Version History

### 1.0.0 (2026-04-17)
- Initial public release
- Complete dual-track memory system
- Full CLI functionality
- Comprehensive documentation

---

## Links

- [GitHub Repository](https://github.com/your-username/memohub)
- [Documentation](docs/)
- [Issue Tracker](https://github.com/your-username/memohub/issues)
- [Changelog](CHANGELOG.md)
