# track-source Specification

## Purpose
The track-source capability provides a memory track for source code, utilizing AST parsing via Tree-sitter to enable symbol-aware search and retrieval.

## Requirements

### Requirement: Tree-sitter based code parsing
The system SHALL parse source code files using Tree-sitter to extract AST nodes, supporting TypeScript and JavaScript as initial languages.

#### Scenario: Parse TypeScript file
- **WHEN** a TypeScript file is submitted for parsing
- **THEN** AST nodes are extracted with types: function, class, interface, type, variable, import

#### Scenario: Parse unsupported language
- **WHEN** a file with unsupported language extension is submitted
- **THEN** the system SHALL fall back to plain text extraction (no AST structure)

### Requirement: Symbol extraction from AST
The system SHALL extract symbol information from parsed AST nodes including: symbol_name, ast_type, file_path, parent_symbol, and source text.

#### Scenario: Extract function symbol
- **WHEN** a TypeScript file containing `export function add(a: number, b: number): number` is parsed
- **THEN** a symbol with name="add", ast_type="function", and the full source text is extracted

#### Scenario: Extract class with methods
- **WHEN** a TypeScript class is parsed
- **THEN** the class symbol is extracted with parent_symbol=null, and method symbols are extracted with parent_symbol=className

### Requirement: ADD operation for code ingestion
The track SHALL implement the ADD operation to ingest code: compute CAS hash → store in flesh → embed → store in soul with track_id="track-source".

#### Scenario: Ingest a code file
- **WHEN** an ADD instruction is dispatched with payload containing file content and metadata
- **THEN** the code text is stored in CAS, embedded, and a vector record is created in soul with track_id="track-source"

#### Scenario: Duplicate code detection
- **WHEN** an ADD instruction is dispatched for code that already exists (same CAS hash)
- **THEN** the system returns the existing record id without creating a duplicate

### Requirement: RETRIEVE operation for code search
The track SHALL implement the RETRIEVE operation to search code by vector similarity, with optional filters for language, ast_type, symbol_name.

#### Scenario: Search by semantic query
- **WHEN** a RETRIEVE instruction is dispatched with payload.query="error handling middleware"
- **THEN** code records are returned ordered by semantic similarity

#### Scenario: Filter by language
- **WHEN** a RETRIEVE instruction includes payload.filters.language="typescript"
- **THEN** only TypeScript code records are returned

### Requirement: DELETE operation for code removal
The track SHALL implement the DELETE operation to remove code records from soul.

#### Scenario: Delete by symbol name
- **WHEN** a DELETE instruction is dispatched with payload.symbol_name="deprecatedFunc"
- **THEN** all records for that symbol are removed from soul

### Requirement: LIST operation for symbol listing
The track SHALL implement the LIST operation to list all symbols, optionally filtered by type.

#### Scenario: List all functions
- **WHEN** a LIST instruction is dispatched with payload.ast_type="function"
- **THEN** all function symbols in the track are returned with their names and file paths
