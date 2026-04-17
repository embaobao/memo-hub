import { InjectorConfig } from './config.js';
/**
 * Injection result
 */
export interface InjectionResult {
    /** Number of memories injected */
    injected: number;
    /** Memory breakdown by database */
    breakdown: {
        gbrain: number;
        clawmem: number;
    };
    /** Injection strategy used */
    strategy: 'semantic' | 'keyword' | 'hybrid';
    /** Processing time in milliseconds */
    processingTime: number;
}
/**
 * Injected memory with relevance score
 */
export interface InjectedMemory {
    /** Memory content */
    content: string;
    /** Source: 'gbrain' or 'clawmem' */
    source: 'gbrain' | 'clawmem';
    /** Relevance score (0-1) */
    relevance: number;
    /** Type/category */
    type?: string;
    /** Tags */
    tags: string[];
}
/**
 * Injection context
 */
export interface InjectionContext {
    /** User's initial message */
    userMessage: string;
    /** Available tools */
    tools: string[];
    /** Working directory */
    workingDirectory?: string;
    /** Project context */
    projectContext?: {
        name: string;
        path: string;
        language?: string;
    };
}
/**
 * Memory injector for Hermes sessions
 *
 * Injects relevant memories from GBrain and ClawMem into new sessions
 * to provide context-aware assistance.
 */
export declare class MemoryInjector {
    private config;
    constructor(config: InjectorConfig);
    /**
     * Inject memories into a session
     */
    inject(context: InjectionContext): Promise<InjectionResult>;
    /**
     * Generate search queries from context
     */
    private generateSearchQueries;
    /**
     * Extract keywords from text
     */
    private extractKeywords;
    /**
     * Extract technical terms from text
     */
    private extractTechnicalTerms;
    /**
     * Search memories for a query
     */
    private searchMemories;
    /**
     * Search GBrain
     */
    private searchGBrain;
    /**
     * Search ClawMem
     */
    private searchClawMem;
    /**
     * Run CLI command
     */
    private runCommand;
    /**
     * Rank memories by relevance
     */
    private rankMemories;
    /**
     * Select top memories based on limits
     */
    private selectMemories;
    /**
     * Inject memories into session
     */
    private injectIntoSession;
    /**
     * Format memories for display
     */
    private formatMemories;
    /**
     * Build memory block for system prompt
     */
    private buildMemoryBlock;
    /**
     * Save memory block to session
     */
    private saveMemoryBlock;
    /**
     * Check if word is a stop word
     */
    private isStopWord;
}
//# sourceMappingURL=injector.d.ts.map