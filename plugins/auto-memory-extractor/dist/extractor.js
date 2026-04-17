import { spawn } from 'child_process';
/**
 * Automatic memory extractor for Hermes sessions
 *
 * Analyzes session transcripts and extracts important information
 * into GBrain (general knowledge) and ClawMem (code memory).
 *
 * Based on Claude Code's compaction mechanisms with adaptations for
 * persistent memory storage.
 */
export class AutoMemoryExtractor {
    config;
    constructor(config) {
        this.config = config;
    }
    /**
     * Extract memories from a session
     */
    async extract(sessionData) {
        const startTime = Date.now();
        const changes = [];
        // Step 1: Analyze session for importance
        const importance = this.calculateSessionImportance(sessionData);
        if (importance < this.config.importanceThreshold) {
            return {
                gbrainAdded: 0,
                clawmemAdded: 0,
                updated: 0,
                skipped: 0,
                changes,
                processingTime: Date.now() - startTime,
            };
        }
        // Step 2: Extract code-related memories
        const codeMemories = await this.extractCodeMemories(sessionData);
        // Step 3: Extract knowledge memories
        const knowledgeMemories = await this.extractKnowledgeMemories(sessionData);
        // Step 4: Process and store memories
        for (const memory of [...codeMemories, ...knowledgeMemories]) {
            const result = await this.processMemory(memory);
            changes.push(result);
        }
        // Step 5: Generate summary
        return {
            gbrainAdded: changes.filter(c => c.target === 'gbrain' && c.action === 'added').length,
            clawmemAdded: changes.filter(c => c.target === 'clawmem' && c.action === 'added').length,
            updated: changes.filter(c => c.action === 'updated').length,
            skipped: changes.filter(c => c.action === 'skipped').length,
            changes,
            processingTime: Date.now() - startTime,
        };
    }
    /**
     * Extract code-related memories (ClawMem)
     */
    async extractCodeMemories(sessionData) {
        const memories = [];
        // Extract file operations
        const fileOperations = this.analyzeFileOperations(sessionData);
        for (const op of fileOperations) {
            if (op.importance >= this.config.importanceThreshold) {
                memories.push({
                    text: op.text,
                    importance: op.importance,
                    tags: ['file-operation', op.type, ...op.tags],
                    target: 'clawmem',
                    filePath: op.filePath,
                    symbolName: op.symbolName,
                    astType: op.astType,
                    reason: `File operation: ${op.type} on ${op.filePath}`,
                });
            }
        }
        // Extract code snippets
        const codeSnippets = this.analyzeCodeSnippets(sessionData);
        for (const snippet of codeSnippets) {
            if (snippet.importance >= this.config.importanceThreshold) {
                memories.push({
                    text: snippet.text,
                    importance: snippet.importance,
                    tags: ['code-snippet', snippet.language, ...snippet.tags],
                    target: 'clawmem',
                    filePath: snippet.filePath,
                    symbolName: snippet.symbolName,
                    astType: snippet.astType,
                    reason: `Code snippet: ${snippet.reason}`,
                });
            }
        }
        return memories;
    }
    /**
     * Extract knowledge memories (GBrain)
     */
    async extractKnowledgeMemories(sessionData) {
        const memories = [];
        // Extract user preferences
        const preferences = this.analyzeUserPreferences(sessionData);
        for (const pref of preferences) {
            if (pref.importance >= this.config.importanceThreshold) {
                memories.push({
                    text: pref.text,
                    importance: pref.importance,
                    tags: ['user-preference', ...pref.tags],
                    target: 'gbrain',
                    category: 'user',
                    reason: `User preference: ${pref.key}`,
                });
            }
        }
        // Extract environment facts
        const environments = this.analyzeEnvironmentFacts(sessionData);
        for (const env of environments) {
            if (env.importance >= this.config.importanceThreshold) {
                memories.push({
                    text: env.text,
                    importance: env.importance,
                    tags: ['environment', ...env.tags],
                    target: 'gbrain',
                    category: 'memory',
                    reason: `Environment fact: ${env.key}`,
                });
            }
        }
        // Extract procedural knowledge
        const procedures = this.analyzeProcedures(sessionData);
        for (const proc of procedures) {
            if (proc.importance >= this.config.importanceThreshold) {
                memories.push({
                    text: proc.text,
                    importance: proc.importance,
                    tags: ['procedure', ...proc.tags],
                    target: 'gbrain',
                    category: 'memory',
                    reason: `Procedure: ${proc.name}`,
                });
            }
        }
        return memories;
    }
    /**
     * Process and store a single memory
     */
    async processMemory(memory) {
        try {
            // Check for duplicates using semantic search
            const isDuplicate = await this.checkDuplicate(memory);
            if (isDuplicate) {
                return {
                    target: memory.target,
                    action: 'skipped',
                    identifier: memory.text.substring(0, 50) + '...',
                    reason: 'Duplicate or similar content exists',
                    importance: memory.importance,
                    category: memory.category || memory.astType,
                };
            }
            // Store in appropriate database
            if (memory.target === 'clawmem') {
                await this.addToClawMem(memory);
                return {
                    target: 'clawmem',
                    action: 'added',
                    identifier: memory.text.substring(0, 50) + '...',
                    reason: memory.reason,
                    importance: memory.importance,
                    category: memory.astType,
                };
            }
            else {
                await this.addToGBrain(memory);
                return {
                    target: 'gbrain',
                    action: 'added',
                    identifier: memory.text.substring(0, 50) + '...',
                    reason: memory.reason,
                    importance: memory.importance,
                    category: memory.category,
                };
            }
        }
        catch (error) {
            console.error(`Error processing memory: ${error}`);
            return {
                target: memory.target,
                action: 'skipped',
                identifier: memory.text.substring(0, 50) + '...',
                reason: `Error: ${error}`,
                importance: memory.importance,
            };
        }
    }
    /**
     * Check if memory is duplicate using semantic search
     */
    async checkDuplicate(memory) {
        // Use semantic search with high threshold to find duplicates
        const searchResult = await this.searchExistingMemory(memory);
        // If similarity > 0.95, consider it a duplicate
        for (const match of searchResult) {
            if (match.similarity > this.config.duplicateThreshold) {
                return true;
            }
        }
        return false;
    }
    /**
     * Search for similar existing memories
     */
    async searchExistingMemory(memory) {
        // Call CLI search command
        const command = memory.target === 'gbrain'
            ? ['search-knowledge', memory.text, '-l', '5']
            : ['search-code', memory.text, '-l', '5'];
        return new Promise((resolve, reject) => {
            const child = spawn('bun', ['run', 'dist/cli/index.js', ...command], {
                cwd: this.config.cliPath,
                stdio: ['ignore', 'pipe', 'pipe'],
            });
            let output = '';
            let error = '';
            child.stdout.on('data', (data) => {
                output += data.toString();
            });
            child.stderr.on('data', (data) => {
                error += data.toString();
            });
            child.on('close', (code) => {
                if (code === 0) {
                    try {
                        // Parse similarity scores from output
                        const lines = output.split('\n');
                        const results = [];
                        for (const line of lines) {
                            const match = line.match(/相似度: ([\d.]+)/);
                            if (match) {
                                results.push({ similarity: parseFloat(match[1]) });
                            }
                        }
                        resolve(results);
                    }
                    catch (e) {
                        resolve([]);
                    }
                }
                else {
                    reject(new Error(error || `Command failed with code ${code}`));
                }
            });
        });
    }
    /**
     * Add memory to ClawMem
     */
    async addToClawMem(memory) {
        const args = [
            'add-code',
            memory.text,
            '-i', memory.importance.toString(),
        ];
        if (memory.filePath)
            args.push('-f', memory.filePath);
        if (memory.symbolName)
            args.push('-s', memory.symbolName);
        if (memory.astType)
            args.push('-a', memory.astType);
        if (memory.tags.length > 0)
            args.push('-t', memory.tags.join(','));
        await this.runCommand(args);
    }
    /**
     * Add memory to GBrain
     */
    async addToGBrain(memory) {
        const args = [
            'add-knowledge',
            memory.text,
            '-i', memory.importance.toString(),
        ];
        if (memory.category)
            args.push('-c', memory.category);
        if (memory.tags.length > 0)
            args.push('-t', memory.tags.join(','));
        await this.runCommand(args);
    }
    /**
     * Run CLI command
     */
    async runCommand(args) {
        return new Promise((resolve, reject) => {
            const child = spawn('bun', ['run', 'dist/cli/index.js', ...args], {
                cwd: this.config.cliPath,
                stdio: ['ignore', 'pipe', 'pipe'],
            });
            let error = '';
            child.stderr.on('data', (data) => {
                error += data.toString();
            });
            child.on('close', (code) => {
                if (code === 0) {
                    resolve();
                }
                else {
                    reject(new Error(error || `Command failed with code ${code}`));
                }
            });
        });
    }
    /**
     * Calculate session importance
     */
    calculateSessionImportance(sessionData) {
        let score = 0;
        // Token usage: more tokens = more activity
        score += Math.min(sessionData.totalTokens / 10000, 0.3);
        // Tool usage: more tools = more complex task
        score += Math.min(sessionData.toolUsage.totalCalls / 50, 0.3);
        // File access: more files = more technical work
        score += Math.min(sessionData.toolUsage.filesAccessed.length / 20, 0.2);
        // Message count: more messages = more discussion
        score += Math.min(sessionData.messages.length / 100, 0.2);
        return Math.min(score, 1.0);
    }
    /**
     * Analyze file operations from session
     */
    analyzeFileOperations(sessionData) {
        const operations = [];
        for (const message of sessionData.messages) {
            if (message.toolCall) {
                const tool = message.toolCall.name;
                const args = message.toolCall.arguments;
                if (['read_file', 'write_file', 'patch', 'search_files'].includes(tool)) {
                    const filePath = args.path || '';
                    const importance = this.calculateFileOpImportance(tool, filePath);
                    operations.push({
                        text: this.formatFileOperation(tool, args),
                        importance,
                        tags: [tool],
                        filePath,
                        type: tool,
                        symbolName: this.extractSymbolName(filePath),
                        astType: this.inferASTType(tool),
                    });
                }
            }
        }
        return operations;
    }
    /**
     * Analyze code snippets from session
     */
    analyzeCodeSnippets(sessionData) {
        const snippets = [];
        for (const message of sessionData.messages) {
            if (message.role === 'assistant' && message.content) {
                // Extract code blocks from content
                const codeBlocks = this.extractCodeBlocks(message.content);
                for (const block of codeBlocks) {
                    const importance = this.calculateCodeSnippetImportance(block);
                    snippets.push({
                        text: block.code,
                        importance,
                        tags: [block.language],
                        filePath: block.filePath,
                        symbolName: block.symbolName,
                        astType: this.inferASTTypeFromCode(block.code),
                        language: block.language,
                        reason: block.reason,
                    });
                }
            }
        }
        return snippets;
    }
    /**
     * Analyze user preferences
     */
    analyzeUserPreferences(sessionData) {
        const preferences = [];
        // Look for patterns like "I prefer", "I like", "I don't like"
        for (const message of sessionData.messages) {
            if (message.role === 'user') {
                const patterns = [
                    /i (prefer|like|don't like|dislike|want) (.+?)(?:\.|$)/gi,
                    /please (?:always|never) (.+?)(?:\.|$)/gi,
                    /remember (?:that|to) (.+?)(?:\.|$)/gi,
                ];
                for (const pattern of patterns) {
                    const matches = message.content.match(pattern);
                    if (matches) {
                        for (const match of matches) {
                            preferences.push({
                                text: match,
                                importance: 0.8,
                                tags: ['preference'],
                                key: match.substring(0, 50),
                            });
                        }
                    }
                }
            }
        }
        return preferences;
    }
    /**
     * Analyze environment facts
     */
    analyzeEnvironmentFacts(sessionData) {
        const facts = [];
        // Look for OS, tools, paths mentioned
        for (const message of sessionData.messages) {
            const osPatterns = [
                /macos|windows|linux|darwin/gi,
                /node\.js|python|bun|deno/gi,
                /docker|kubernetes|podman/gi,
            ];
            for (const pattern of osPatterns) {
                const matches = message.content.match(pattern);
                if (matches) {
                    for (const match of matches) {
                        facts.push({
                            text: `Environment: ${match}`,
                            importance: 0.7,
                            tags: ['environment', match.toLowerCase()],
                            key: match.toLowerCase(),
                        });
                    }
                }
            }
            // Look for paths
            const pathPattern = /[\/~]([a-zA-Z0-9_\-]+\/)+[a-zA-Z0-9_\-\.\-]+/g;
            const paths = message.content.match(pathPattern);
            if (paths) {
                for (const path of Array.from(new Set(paths))) {
                    facts.push({
                        text: `Workspace path: ${path}`,
                        importance: 0.6,
                        tags: ['workspace-path'],
                        key: path,
                    });
                }
            }
        }
        return facts;
    }
    /**
     * Analyze procedures
     */
    analyzeProcedures(sessionData) {
        const procedures = [];
        // Look for multi-step problem solving
        const codeChanges = sessionData.messages.filter(m => m.toolCall && ['write_file', 'patch', 'terminal'].includes(m.toolCall.name));
        if (codeChanges.length >= 3) {
            const procedure = this.synthesizeProcedure(sessionData);
            if (procedure) {
                procedures.push({
                    text: procedure.description,
                    importance: 0.75,
                    tags: ['procedure', procedure.type, ...procedure.tags],
                    name: procedure.name,
                });
            }
        }
        return procedures;
    }
    /**
     * Calculate file operation importance
     */
    calculateFileOpImportance(tool, filePath) {
        let score = 0.5;
        // Different tools have different importance
        const toolScores = {
            read_file: 0.3,
            write_file: 0.6,
            patch: 0.7,
            search_files: 0.4,
        };
        score = toolScores[tool] || 0.5;
        // Project files are more important than config files
        if (filePath.includes('src/') || filePath.includes('lib/')) {
            score += 0.2;
        }
        return Math.min(score, 1.0);
    }
    /**
     * Calculate code snippet importance
     */
    calculateCodeSnippetImportance(block) {
        let score = 0.5;
        // Longer snippets are more important
        score += Math.min(block.code.length / 500, 0.3);
        // Code with function definitions is important
        if (block.code.includes('function ') || block.code.includes('const ') || block.code.includes('class ')) {
            score += 0.2;
        }
        return Math.min(score, 1.0);
    }
    /**
     * Format file operation for storage
     */
    formatFileOperation(tool, args) {
        const parts = [tool.toUpperCase()];
        if (args.path)
            parts.push(`file: ${args.path}`);
        if (args.pattern)
            parts.push(`pattern: ${args.pattern}`);
        return parts.join(' - ');
    }
    /**
     * Extract symbol name from file path
     */
    extractSymbolName(filePath) {
        const parts = filePath.split('/');
        const filename = parts[parts.length - 1];
        return filename.replace(/\.[^.]+$/, '');
    }
    /**
     * Infer AST type from tool
     */
    inferASTType(tool) {
        const types = {
            read_file: 'unknown',
            write_file: 'unknown',
            patch: 'unknown',
            search_files: 'unknown',
        };
        return types[tool] || 'unknown';
    }
    /**
     * Infer AST type from code
     */
    inferASTTypeFromCode(code) {
        if (code.includes('function ') || code.includes('=>'))
            return 'function';
        if (code.includes('class '))
            return 'class';
        if (code.includes('interface '))
            return 'interface';
        if (code.includes('type '))
            return 'type';
        if (code.includes('const ') || code.includes('let ') || code.includes('var '))
            return 'variable';
        return 'unknown';
    }
    /**
     * Extract code blocks from content
     */
    extractCodeBlocks(content) {
        const blocks = [];
        const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
        let match;
        while ((match = codeBlockRegex.exec(content)) !== null) {
            blocks.push({
                language: match[1] || 'unknown',
                code: match[2].trim(),
                filePath: '',
                symbolName: '',
                reason: 'Code block in assistant response',
            });
        }
        return blocks;
    }
    /**
     * Synthesize procedure from session
     */
    synthesizeProcedure(sessionData) {
        // Find patterns like:
        // - Error -> Fix -> Success
        // - User request -> Research -> Implementation
        const userMessages = sessionData.messages.filter(m => m.role === 'user');
        const toolMessages = sessionData.messages.filter(m => m.toolCall);
        if (userMessages.length === 0)
            return null;
        return {
            name: `Procedure from ${userMessages[0].content.substring(0, 30)}...`,
            description: `Multi-step task involving ${toolMessages.length} tool calls`,
            type: 'multi-step-task',
            tags: ['workflow'],
        };
    }
}
//# sourceMappingURL=extractor.js.map