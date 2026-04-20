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
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as lancedb from "@lancedb/lancedb";
import { z } from "zod";
import * as path from "node:path";
// ─── Config ───────────────────────────────────────────────
import * as os from "node:os";
const HOME = process.env.HOME ?? os.homedir();
const GBRAIN_DB_PATH = path.resolve((process.env.GBRAIN_DB_PATH ?? path.join(HOME, ".hermes/data/gbrain.lancedb")).replace(/^~/, HOME));
const CLAWMEM_DB_PATH = path.resolve((process.env.CLAWMEM_DB_PATH ?? path.join(HOME, ".hermes/data/clawmem.lancedb")).replace(/^~/, HOME));
const GBRAIN_TABLE_NAME = "gbrain";
const CLAWMEM_TABLE_NAME = "clawmem";
const EMBEDDING_URL = process.env.EMBEDDING_URL ?? "http://localhost:11434/v1";
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL ?? "nomic-embed-text-v2-moe";
const VECTOR_DIM = 768;
// ─── Embedding ────────────────────────────────────────────
async function getEmbedding(text) {
    try {
        const resp = await fetch(`${EMBEDDING_URL}/embeddings`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ model: EMBEDDING_MODEL, input: text }),
        });
        if (!resp.ok) {
            console.error(`[MemoHub MCP] Embedding API error: ${resp.status}`);
            return Array.from({ length: VECTOR_DIM }).fill(0);
        }
        const data = (await resp.json());
        return data.data[0].embedding;
    }
    catch (err) {
        console.error("[MemoHub MCP] Embedding failed:", err);
        return Array.from({ length: VECTOR_DIM }).fill(0);
    }
}
// ─── Server ───────────────────────────────────────────────
async function main() {
    const server = new McpServer({
        name: "memohub",
        version: "1.0.0"
    });
    // ── Initialize GBrain ───────────────────────────────────
    const gbrainDb = await lancedb.connect(GBRAIN_DB_PATH);
    let gbrainTable;
    try {
        gbrainTable = await gbrainDb.openTable(GBRAIN_TABLE_NAME);
    }
    catch {
        const seed = {
            id: "__schema__", text: "",
            vector: Array.from({ length: VECTOR_DIM }).fill(0),
            category: "other", scope: "global", importance: 0,
            timestamp: new Date().toISOString(), tags: [],
            source: "seed", access_count: 0, last_accessed: null,
        };
        gbrainTable = await gbrainDb.createTable(GBRAIN_TABLE_NAME, [seed]);
        await gbrainTable.delete('id = "__schema__"');
    }
    const gbrainRecords = await gbrainTable.countRows();
    // ── Initialize ClawMem ──────────────────────────────────
    const clawmemDb = await lancedb.connect(CLAWMEM_DB_PATH);
    let clawmemTable;
    try {
        clawmemTable = await clawmemDb.openTable(CLAWMEM_TABLE_NAME);
    }
    catch {
        const seed = {
            id: "__schema__", text: "",
            vector: Array.from({ length: VECTOR_DIM }).fill(0),
            ast_type: "unknown", symbol_name: "", parent_symbol: "",
            file_path: "", language: "unknown", importance: 0,
            timestamp: new Date().toISOString(), source: "seed", tags: [],
        };
        clawmemTable = await clawmemDb.createTable(CLAWMEM_TABLE_NAME, [seed]);
        await clawmemTable.delete('id = "__schema__"');
    }
    const clawmemRecords = await clawmemTable.countRows();
    // ── GBrain Tools ────────────────────────────────────────
    // query_knowledge
    server.tool("query_knowledge", "Search GBrain (general knowledge) by semantic similarity.", {
        query: z.string().describe("Search query"),
        limit: z.number().optional().default(5).describe("Max results"),
        category: z.string().optional().describe("Filter by category"),
    }, async ({ query, limit, category }) => {
        const vector = await getEmbedding(query);
        let search = gbrainTable.vectorSearch(vector).distanceType("cosine").limit(limit);
        if (category) {
            search = search.where(`category = '${category.replace(/'/g, "\\'")}'`);
        }
        const results = await search.toArray();
        const formatted = results.map((row) => ({
            id: row.id,
            text: row.text,
            category: row.category,
            importance: row.importance,
            timestamp: row.timestamp,
            tags: row.tags ?? [],
            source: row.source,
            _distance: row._distance,
        }));
        return {
            content: [{
                    type: "text",
                    text: JSON.stringify({
                        track: "gbrain",
                        query,
                        results: formatted,
                        total: formatted.length
                    }, null, 2)
                }],
        };
    });
    // add_knowledge
    server.tool("add_knowledge", "Add a new knowledge record to GBrain.", {
        text: z.string().describe("Knowledge text"),
        category: z.string().optional().default("other"),
        importance: z.number().optional().default(0.5),
        tags: z.array(z.string()).optional().default([]),
    }, async ({ text, category, importance, tags }) => {
        const vector = await getEmbedding(text);
        const id = `gbrain-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
        await gbrainTable.add([{
                id, text, vector, category, scope: "global", importance,
                timestamp: new Date().toISOString(), tags,
                source: "memohub-mcp", access_count: 0, last_accessed: null,
            }]);
        return {
            content: [{
                    type: "text",
                    text: JSON.stringify({
                        track: "gbrain",
                        success: true,
                        id
                    })
                }],
        };
    });
    // list_categories
    server.tool("list_categories", "List all GBrain categories with counts.", {}, async () => {
        const all = await gbrainTable.query().limit(10000).toArray();
        const counts = {};
        for (const r of all) {
            const c = String(r.category ?? "unknown");
            counts[c] = (counts[c] || 0) + 1;
        }
        return {
            content: [{
                    type: "text",
                    text: JSON.stringify({
                        track: "gbrain",
                        categories: counts,
                        total: all.length
                    })
                }]
        };
    });
    // delete_knowledge
    server.tool("delete_knowledge", "Delete knowledge from GBrain by ID(s).", {
        ids: z.array(z.string()).describe("List of knowledge IDs to delete"),
    }, async ({ ids }) => {
        const conditions = ids.map(id => `id = '${id.replace(/'/g, "\\'")}'`).join(" OR ");
        await gbrainTable.delete(conditions);
        return {
            content: [{
                    type: "text",
                    text: JSON.stringify({
                        track: "gbrain",
                        success: true,
                        deleted: ids.length
                    })
                }],
        };
    });
    // ── ClawMem Tools ───────────────────────────────────────
    // search_code
    server.tool("search_code", "Search ClawMem (code memory) by semantic similarity.", {
        query: z.string().describe("Natural language description of code to find"),
        limit: z.number().optional().default(5).describe("Max results"),
        language: z.string().optional().describe("Filter by language"),
        ast_type: z.string().optional().describe("Filter by AST type"),
    }, async ({ query, limit, language, ast_type }) => {
        const vector = await getEmbedding(query);
        let search = clawmemTable.vectorSearch(vector).distanceType("cosine").limit(limit);
        const conditions = [];
        if (language)
            conditions.push(`language = '${language.replace(/'/g, "\\'")}'`);
        if (ast_type)
            conditions.push(`ast_type = '${ast_type.replace(/'/g, "\\'")}'`);
        if (conditions.length > 0)
            search = search.where(conditions.join(" AND "));
        const results = await search.toArray();
        const formatted = results.map((row) => ({
            id: row.id,
            text: row.text,
            ast_type: row.ast_type,
            symbol_name: row.symbol_name,
            file_path: row.file_path,
            language: row.language,
            importance: row.importance,
            tags: row.tags ?? [],
            _distance: row._distance,
        }));
        return {
            content: [{
                    type: "text",
                    text: JSON.stringify({
                        track: "clawmem",
                        query,
                        results: formatted,
                        total: formatted.length
                    }, null, 2)
                }],
        };
    });
    // add_code
    server.tool("add_code", "Add a new code snippet to ClawMem.", {
        text: z.string().describe("Code text"),
        ast_type: z.string().optional().default("unknown"),
        symbol_name: z.string().optional().default(""),
        file_path: z.string().optional().default(""),
        language: z.string().optional().default("typescript"),
        importance: z.number().optional().default(0.5),
        tags: z.array(z.string()).optional().default([]),
    }, async ({ text, ast_type, symbol_name, file_path, language, importance, tags }) => {
        const vector = await getEmbedding(text);
        const id = `clawmem-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
        await clawmemTable.add([{
                id, text, vector, ast_type, symbol_name,
                parent_symbol: null, file_path, language, importance,
                timestamp: new Date().toISOString(), source: "memohub-mcp", tags,
            }]);
        return {
            content: [{
                    type: "text",
                    text: JSON.stringify({
                        track: "clawmem",
                        success: true,
                        id
                    })
                }],
        };
    });
    // list_symbols
    server.tool("list_symbols", "List all ClawMem symbols (classes, functions, etc.).", {
        language: z.string().optional(),
        ast_type: z.string().optional()
    }, async ({ language, ast_type }) => {
        const conditions = [];
        if (language)
            conditions.push(`language = '${language}'`);
        if (ast_type)
            conditions.push(`ast_type = '${ast_type}'`);
        const queryBuilder = clawmemTable.query();
        if (conditions.length > 0) {
            queryBuilder.where(conditions.join(" AND "));
        }
        const all = await queryBuilder.limit(10000).toArray();
        const symbols = all
            .filter((r) => r.symbol_name && String(r.symbol_name) !== "")
            .map((r) => ({
            symbol: r.symbol_name,
            ast_type: r.ast_type,
            file_path: r.file_path,
            language: r.language,
        }));
        return {
            content: [{
                    type: "text",
                    text: JSON.stringify({
                        track: "clawmem",
                        symbols,
                        total: symbols.length
                    })
                }]
        };
    });
    // ── Unified Tools ───────────────────────────────────────
    // get_stats
    server.tool("get_stats", "Get database statistics for both GBrain and ClawMem.", {}, async () => {
        const gbrainCount = await gbrainTable.countRows();
        const clawmemCount = await clawmemTable.countRows();
        return {
            content: [{
                    type: "text",
                    text: JSON.stringify({
                        gbrain: {
                            total_records: gbrainCount,
                            db_path: GBRAIN_DB_PATH,
                            table_name: GBRAIN_TABLE_NAME,
                        },
                        clawmem: {
                            total_records: clawmemCount,
                            db_path: CLAWMEM_DB_PATH,
                            table_name: CLAWMEM_TABLE_NAME,
                        },
                        embedding: {
                            model: EMBEDDING_MODEL,
                            url: EMBEDDING_URL,
                            vector_dim: VECTOR_DIM,
                        }
                    })
                }]
        };
    });
    // search_all
    server.tool("search_all", "Search both GBrain (knowledge) and ClawMem (code) simultaneously.", {
        query: z.string().describe("Search query"),
        limit: z.number().optional().default(5).describe("Max results per track"),
    }, async ({ query, limit }) => {
        const vector = await getEmbedding(query);
        // Search GBrain
        const gbrainSearch = gbrainTable.vectorSearch(vector)
            .distanceType("cosine")
            .limit(limit);
        const gbrainResults = await gbrainSearch.toArray();
        const gbrainFormatted = gbrainResults.map((row) => ({
            id: row.id,
            text: row.text,
            category: row.category,
            importance: row.importance,
            _distance: row._distance,
        }));
        // Search ClawMem
        const clawmemSearch = clawmemTable.vectorSearch(vector)
            .distanceType("cosine")
            .limit(limit);
        const clawmemResults = await clawmemSearch.toArray();
        const clawmemFormatted = clawmemResults.map((row) => ({
            id: row.id,
            text: row.text,
            ast_type: row.ast_type,
            symbol_name: row.symbol_name,
            language: row.language,
            importance: row.importance,
            _distance: row._distance,
        }));
        return {
            content: [{
                    type: "text",
                    text: JSON.stringify({
                        query,
                        gbrain: {
                            results: gbrainFormatted,
                            total: gbrainFormatted.length
                        },
                        clawmem: {
                            results: clawmemFormatted,
                            total: clawmemFormatted.length
                        },
                        total: gbrainFormatted.length + clawmemFormatted.length
                    }, null, 2)
                }],
        };
    });
    // ── Facade Layer (防腐层) ───────────────────────────────────
    // memo_search - 统一搜索接口
    server.tool("memo_search", "Unified search interface for all memories (GBrain + ClawMem). Supports hybrid vector + entity search.", {
        query: z.string().describe("Natural language search query"),
        limit: z.number().optional().default(10).describe("Max total results"),
        entities: z.array(z.string()).optional().default([]).describe("Entity names to filter (for precise matching)"),
    }, async ({ query, limit, entities }) => {
        const vector = await getEmbedding(query);
        const queryEntities = entities.length > 0 ? entities : [];
        // 并行搜索 GBrain 和 ClawMem
        const [gbrainResults, clawmemResults] = await Promise.all([
            gbrainTable.vectorSearch(vector)
                .distanceType("cosine")
                .limit(limit)
                .toArray(),
            clawmemTable.vectorSearch(vector)
                .distanceType("cosine")
                .limit(limit)
                .toArray(),
        ]);
        // 格式化结果
        const formatResult = (row, track) => ({
            id: row.id,
            text: row.text,
            track,
            ...(track === "gbrain" ? {
                category: row.category,
            } : {
                ast_type: row.ast_type,
                symbol_name: row.symbol_name,
                language: row.language,
            }),
            importance: row.importance,
            entities: row.entities ?? [],
            hash: row.hash ?? "",
            timestamp: row.timestamp,
            _distance: row._distance,
        });
        // 混合评分和排序
        const allResults = [
            ...gbrainResults.map((r) => formatResult(r, "gbrain")),
            ...clawmemResults.map((r) => formatResult(r, "clawmem")),
        ];
        // 如果有实体过滤，应用实体匹配
        if (queryEntities.length > 0) {
            const scored = allResults.map((result) => {
                const recordEntities = result.entities || [];
                const matches = queryEntities.filter((qe) => recordEntities.some((re) => re.toLowerCase().includes(qe.toLowerCase()) ||
                    qe.toLowerCase().includes(re.toLowerCase())));
                const vectorScore = 1 - result._distance;
                const entityBonus = matches.length > 0 ? 0.3 : 0;
                const finalScore = vectorScore * 0.7 + entityBonus * 0.3;
                return { ...result, finalScore };
            });
            scored.sort((a, b) => b.finalScore - a.finalScore);
            return {
                content: [{
                        type: "text",
                        text: JSON.stringify({
                            query,
                            query_entities: queryEntities,
                            results: scored.slice(0, limit),
                            total: scored.slice(0, limit).length,
                            search_mode: "hybrid",
                        }, null, 2)
                    }],
            };
        }
        else {
            // 纯向量搜索，按距离排序
            allResults.sort((a, b) => a._distance - b._distance);
            return {
                content: [{
                        type: "text",
                        text: JSON.stringify({
                            query,
                            results: allResults.slice(0, limit),
                            total: allResults.slice(0, limit).length,
                            search_mode: "vector",
                        }, null, 2)
                    }],
            };
        }
    });
    // memo_add - 统一添加接口
    server.tool("memo_add", "Unified add interface for all memories. Auto-routes to GBrain or ClawMem based on content type.", {
        text: z.string().describe("Content to add (text or code)"),
        type: z.enum(["knowledge", "code"]).default("knowledge").describe("Type: 'knowledge' for GBrain, 'code' for ClawMem"),
        category: z.string().optional().default("other").describe("Category (for knowledge only)"),
        importance: z.number().optional().default(0.5).describe("Importance score (0-1)"),
        tags: z.array(z.string()).optional().default([]).describe("Tags for categorization"),
        language: z.string().optional().default("typescript").describe("Programming language (for code only)"),
        ast_type: z.string().optional().default("unknown").describe("AST type (for code only)"),
        symbol_name: z.string().optional().default("").describe("Symbol name (for code only)"),
        file_path: z.string().optional().default("").describe("File path (for code only)"),
    }, async ({ text, type, category, importance, tags, language, ast_type, symbol_name, file_path }) => {
        if (type === "knowledge") {
            // 添加到 GBrain
            const vector = await getEmbedding(text);
            const id = `gbrain-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
            const hash = text; // 简化：使用文本作为 hash（实际应该用 SHA-256）
            await gbrainTable.add([{
                    id,
                    text,
                    vector,
                    category,
                    scope: "global",
                    importance,
                    timestamp: new Date().toISOString(),
                    tags,
                    source: "memohub-facade",
                    access_count: 0,
                    last_accessed: null,
                    entities: [], // GBrain 实体暂时为空
                    hash,
                }]);
            return {
                content: [{
                        type: "text",
                        text: JSON.stringify({
                            track: "gbrain",
                            success: true,
                            id,
                            type: "knowledge",
                        })
                    }],
            };
        }
        else {
            // 添加到 ClawMem
            const vector = await getEmbedding(text);
            const id = `clawmem-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
            const hash = text; // 简化：使用文本作为 hash
            // TODO: 集成 Tree-sitter 提取实体
            const entities = [];
            await clawmemTable.add([{
                    id,
                    text,
                    vector,
                    ast_type,
                    symbol_name,
                    parent_symbol: null,
                    file_path,
                    language,
                    importance,
                    timestamp: new Date().toISOString(),
                    tags,
                    source: "memohub-facade",
                    access_count: 0,
                    last_accessed: null,
                    entities,
                    hash,
                }]);
            return {
                content: [{
                        type: "text",
                        text: JSON.stringify({
                            track: "clawmem",
                            success: true,
                            id,
                            type: "code",
                        })
                    }],
            };
        }
    });
    const transport = new StdioServerTransport();
    await server.connect(transport);
    // 日志输出到 stderr，避免干扰 MCP 协议通信
    console.error(`[MemoHub MCP] GBrain: ${gbrainRecords} records, ClawMem: ${clawmemRecords} records`);
}
main().catch((err) => {
    console.error("[MemoHub MCP] Fatal:", err);
    process.exit(1);
});
//# sourceMappingURL=index.js.map