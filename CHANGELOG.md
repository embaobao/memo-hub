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
