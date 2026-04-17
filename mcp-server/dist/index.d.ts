/**
 * MemoHub MCP Server - 统一的双轨记忆系统
 *
 * Transport: stdio (native Hermes support)
 * Storage:   LanceDB
 *   - GBrain:  ~/.hermes/data/gbrain.lancedb
 *   - ClawMem: ~/.hermes/data/clawmem.lancedb
 * Embedding: nomic-embed-text-v2-moe via Ollama (768d)
 *
 * Tracks:
 *   - GBrain:  General Knowledge Memory
 *   - ClawMem: Code Memory
 *
 * Tools:
 *   GBrain:
 *     - query_knowledge: Vector search for knowledge records
 *     - add_knowledge:   Insert a new knowledge record
 *     - list_categories: List all categories with counts
 *     - delete_knowledge: Delete knowledge by ID
 *
 *   ClawMem:
 *     - search_code:  Vector search for code snippets
 *     - add_code:      Insert a new code memory record
 *     - list_symbols:  List all symbols (classes, functions, etc.)
 *
 *   Unified:
 *     - get_stats: Database statistics for both tracks
 *     - search_all: Search both knowledge and code
 */
export {};
//# sourceMappingURL=index.d.ts.map