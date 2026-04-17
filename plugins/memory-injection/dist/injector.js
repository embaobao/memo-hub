/**
 * Memory injector for Hermes sessions
 *
 * Injects relevant memories from GBrain and ClawMem into new sessions
 * to provide context-aware assistance.
 */
export class MemoryInjector {
    config;
    constructor(config) {
        this.config = config;
    }
    /**
     * Inject memories into a session
     */
    async inject(context) {
        const startTime = Date.now();
        // Step 1: Analyze context to determine search queries
        const searchQueries = this.generateSearchQueries(context);
        // Step 2: Search memories for each query
        const memories = [];
        for (const query of searchQueries) {
            const results = await this.searchMemories(query);
            for (const result of results) {
                // Check if already injected (deduplication)
                if (!memories.some(m => m.content === result.content)) {
                    memories.push({
                        content: result.content,
                        source: result.source,
                        relevance: result.relevance,
                        type: result.type,
                        tags: result.tags,
                    });
                }
            }
        }
        // Step 3: Rank and filter memories
        const rankedMemories = this.rankMemories(memories, context);
        // Step 4: Select top memories based on limits
        const selectedMemories = this.selectMemories(rankedMemories);
        // Step 5: Format and inject memories
        await this.injectIntoSession(selectedMemories, context);
        return {
            injected: selectedMemories.length,
            breakdown: {
                gbrain: selectedMemories.filter(m => m.source === 'gbrain').length,
                clawmem: selectedMemories.filter(m => m.source === 'clawmem').length,
            },
            strategy: this.config.strategy,
            processingTime: Date.now() - startTime,
        };
    }
    /**
     * Generate search queries from context
     */
    generateSearchQueries(context) {
        const queries = [];
        // Extract keywords from user message
        const keywords = this.extractKeywords(context.userMessage);
        queries.push(...keywords);
        // Extract technical terms
        const technicalTerms = this.extractTechnicalTerms(context.userMessage);
        queries.push(...technicalTerms);
        // Add project-specific queries
        if (context.projectContext) {
            queries.push(context.projectContext.name);
            queries.push(context.projectContext.path);
            if (context.projectContext.language) {
                queries.push(`${context.projectContext.language} development`);
            }
        }
        // Add working directory
        if (context.workingDirectory) {
            queries.push(context.workingDirectory);
        }
        // Add tool-based queries
        for (const tool of context.tools) {
            queries.push(tool);
        }
        // Deduplicate
        return Array.from(new Set(queries));
    }
    /**
     * Extract keywords from text
     */
    extractKeywords(text) {
        const keywords = [];
        // Extract nouns and important terms
        const words = text.split(/\s+/).filter(w => w.length > 3);
        for (const word of words) {
            // Filter out common stop words
            if (!this.isStopWord(word)) {
                keywords.push(word);
            }
        }
        return keywords;
    }
    /**
     * Extract technical terms from text
     */
    extractTechnicalTerms(text) {
        const terms = [];
        // Look for code patterns
        const codePatterns = [
            /([a-z_][a-z0-9_]*)\(/gi, // function calls
            /([A-Z][a-zA-Z0-9]*)\./g, // class.method
            /([a-z_][a-z0-9_]*) = /gi, // assignments
        ];
        for (const pattern of codePatterns) {
            const matches = text.match(pattern);
            if (matches) {
                terms.push(...matches.map(m => m.replace(/[().=]/g, '')));
            }
        }
        return Array.from(new Set(terms));
    }
    /**
     * Search memories for a query
     */
    async searchMemories(query) {
        const memories = [];
        // Search GBrain
        try {
            const gbrainResults = await this.searchGBrain(query);
            for (const result of gbrainResults) {
                memories.push({
                    content: result.text,
                    source: 'gbrain',
                    relevance: result.similarity,
                    type: result.category,
                    tags: result.tags || [],
                });
            }
        }
        catch (error) {
            console.error(`Error searching GBrain: ${error}`);
        }
        // Search ClawMem
        try {
            const clawmemResults = await this.searchClawMem(query);
            for (const result of clawmemResults) {
                memories.push({
                    content: result.text,
                    source: 'clawmem',
                    relevance: result.similarity,
                    type: result.astType,
                    tags: result.tags || [],
                });
            }
        }
        catch (error) {
            console.error(`Error searching ClawMem: ${error}`);
        }
        return memories;
    }
    /**
     * Search GBrain
     */
    async searchGBrain(query) {
        const command = ['search-knowledge', query, '-l', this.config.maxResults.toString()];
        return await this.runCommand(command);
    }
    /**
     * Search ClawMem
     */
    async searchClawMem(query) {
        const command = ['search-code', query, '-l', this.config.maxResults.toString()];
        return await this.runCommand(command);
    }
    /**
     * Run CLI command
     */
    async runCommand(args) {
        const { spawn } = await import('child_process');
        return new Promise((resolve, reject) => {
            const child = spawn('bun', ['run', 'dist/cli/index.js', ...args], {
                cwd: this.config.cliPath,
                stdio: ['ignore', 'pipe', 'pipe'],
            });
            let output = '';
            child.stdout.on('data', (data) => {
                output += data.toString();
            });
            child.on('close', (code) => {
                try {
                    const result = JSON.parse(output);
                    resolve(result.results || []);
                }
                catch {
                    resolve([]);
                }
            });
            child.on('error', reject);
        });
    }
    /**
     * Rank memories by relevance
     */
    rankMemories(memories, context) {
        const scored = memories.map(memory => {
            let score = memory.relevance;
            // Boost score based on context
            if (context.projectContext) {
                if (memory.content.includes(context.projectContext.name)) {
                    score += 0.1;
                }
                if (context.projectContext.language && memory.tags.includes(context.projectContext.language)) {
                    score += 0.1;
                }
            }
            if (context.workingDirectory && memory.content.includes(context.workingDirectory)) {
                score += 0.1;
            }
            // Penalize very long memories (they consume too much context)
            if (memory.content.length > 1000) {
                score -= 0.1;
            }
            return {
                ...memory,
                relevance: Math.min(Math.max(score, 0), 1),
            };
        });
        // Sort by relevance (descending)
        return scored.sort((a, b) => b.relevance - a.relevance);
    }
    /**
     * Select top memories based on limits
     */
    selectMemories(memories) {
        const selected = [];
        let gbrainCount = 0;
        let clawmemCount = 0;
        for (const memory of memories) {
            if (memory.source === 'gbrain') {
                if (gbrainCount < this.config.maxGBrainMemories) {
                    selected.push(memory);
                    gbrainCount++;
                }
            }
            else if (memory.source === 'clawmem') {
                if (clawmemCount < this.config.maxClawMemMemories) {
                    selected.push(memory);
                    clawmemCount++;
                }
            }
            // Stop if we've hit total limit
            if (selected.length >= this.config.maxTotalMemories) {
                break;
            }
        }
        return selected;
    }
    /**
     * Inject memories into session
     */
    async injectIntoSession(memories, context) {
        // Format memories as context
        const formattedMemories = this.formatMemories(memories);
        // Inject into system prompt or memory
        const memoryBlock = this.buildMemoryBlock(formattedMemories, context);
        // Save to memory file for session
        await this.saveMemoryBlock(memoryBlock, context);
        console.log(`✅ Injected ${memories.length} memories into session`);
    }
    /**
     * Format memories for display
     */
    formatMemories(memories) {
        const sections = [];
        // Group by source
        const gbrainMemories = memories.filter(m => m.source === 'gbrain');
        const clawmemMemories = memories.filter(m => m.source === 'clawmem');
        if (gbrainMemories.length > 0) {
            sections.push('📚 General Knowledge:');
            for (const memory of gbrainMemories) {
                sections.push(`  - ${memory.content.substring(0, 200)}... (${Math.round(memory.relevance * 100)}%)`);
            }
        }
        if (clawmemMemories.length > 0) {
            sections.push('\n💾 Code Memory:');
            for (const memory of clawmemMemories) {
                sections.push(`  - ${memory.content.substring(0, 200)}... (${Math.round(memory.relevance * 100)}%)`);
            }
        }
        return sections.join('\n');
    }
    /**
     * Build memory block for system prompt
     */
    buildMemoryBlock(formattedMemories, context) {
        return `══════════════════════════════════════════════
MEMORY INJECTED FROM KNOWLEDGE BASE
══════════════════════════════════════════════

${formattedMemories}

══════════════════════════════════════════════
`;
    }
    /**
     * Save memory block to session
     */
    async saveMemoryBlock(memoryBlock, context) {
        // Save to temporary file for session pickup
        const { writeFileSync } = await import('fs');
        const sessionId = Date.now().toString();
        const memoryPath = `/Users/embaobao/.hermes/sessions/${sessionId}-memory.txt`;
        writeFileSync(memoryPath, memoryBlock);
    }
    /**
     * Check if word is a stop word
     */
    isStopWord(word) {
        const stopWords = [
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to',
            'for', 'of', 'with', 'by', 'from', 'as', 'is', 'are', 'was',
            'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does',
            'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must',
            'can', 'this', 'that', 'these', 'those', 'it', 'they', 'them', 'their',
            'what', 'which', 'who', 'whom', 'where', 'when', 'why', 'how',
        ];
        return stopWords.includes(word.toLowerCase());
    }
}
//# sourceMappingURL=injector.js.map