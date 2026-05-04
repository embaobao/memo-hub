## 1. Contracts And Models

- [ ] 1.1 Define `RepoSnapshot`, `FileAsset`, `SymbolAsset`, `RelationEdge`, and `CodeMemoryProjection` contracts.
- [ ] 1.2 Define stable identity rules based on `repo + branch + commit + path (+ symbol)`.
- [ ] 1.3 Define raw corpus, structural index, retrieval index, and memory projection boundaries.
- [ ] 1.4 Document downgrade behavior for non-Git code ingestion.

## 2. Git As Source Of Truth

- [ ] 2.1 Define Git adapter boundary for repository discovery, branch/commit capture, and change-set extraction.
- [ ] 2.2 Define repository snapshot lifecycle and retention rules.
- [ ] 2.3 Define file version and commit provenance requirements for code ingestion.
- [ ] 2.4 Define how blame/author/message metadata is exposed without polluting memory content.

## 3. Retrieval Architecture

- [ ] 3.1 Define path/full-text/symbol/relation/vector index responsibilities.
- [ ] 3.2 Define when full-text search should be preferred over AST or vector recall.
- [ ] 3.3 Define query execution order for code questions.
- [ ] 3.4 Define how `coding_context` consumes code asset results plus memory projection results.

## 4. Query Protocol

- [ ] 4.1 Define code query protocol surface: text/path/symbol/dependency/read/explain.
- [ ] 4.2 Define separation between code query protocol and memory query protocol.
- [ ] 4.3 Define CLI/MCP exposure plan for future `code` / `repo` capabilities.
- [ ] 4.4 Define Hermes/IDE expectations for using code query first and memory query second.

## 5. Adapter Integration Boundary

- [ ] 5.1 Document that GitLab/local repo/IDE adapters must first write into the code asset layer.
- [ ] 5.2 Document projection rules from code assets into `code-intelligence` / `project-knowledge`.
- [ ] 5.3 Align this proposal with `add-source-adapters-dependency-intelligence` without duplicating adapter runtime design.

## 6. Documentation And Validation

- [ ] 6.1 Update architecture docs to establish “原文是根，AST 是派生视图，记忆是治理结果”.
- [ ] 6.2 Add realistic Hermes/Git/IDE code retrieval scenarios.
- [ ] 6.3 Regenerate OpenSpec generated docs and verify indexes.
