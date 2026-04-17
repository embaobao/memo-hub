import { ExtractorConfig } from './config.js';
/**
 * Memory extraction result with visibility into changes
 */
export interface ExtractionResult {
    /** Number of records added to GBrain */
    gbrainAdded: number;
    /** Number of records added to ClawMem */
    clawmemAdded: number;
    /** Number of records updated (existing) */
    updated: number;
    /** Number of records skipped (low importance/duplicate) */
    skipped: number;
    /** Detailed change log for visibility */
    changes: ChangeLog[];
    /** Processing time in milliseconds */
    processingTime: number;
}
/**
 * Individual change record for visibility
 */
export interface ChangeLog {
    /** Target database: 'gbrain' or 'clawmem' */
    target: 'gbrain' | 'clawmem';
    /** Action: 'added' | 'updated' | 'skipped' */
    action: 'added' | 'updated' | 'skipped';
    /** Record identifier or preview text */
    identifier: string;
    /** Reason for the action */
    reason: string;
    /** Importance score (0-1) */
    importance?: number;
    /** Category (for GBrain) or AST type (for ClawMem) */
    category?: string;
}
/**
 * Extracted memory item from session analysis
 */
export interface ExtractedMemory {
    /** Text content to store */
    text: string;
    /** Importance score (0-1) */
    importance: number;
    /** Tags for organization */
    tags: string[];
    /** Target database: 'gbrain' or 'clawmem' */
    target: 'gbrain' | 'clawmem';
    /** GBrain category (optional) */
    category?: string;
    /** ClawMem symbol name (optional) */
    symbolName?: string;
    /** ClawMem file path (optional) */
    filePath?: string;
    /** ClawMem AST type (optional) */
    astType?: string;
    /** Reason for extraction */
    reason: string;
}
/**
 * Session data structure
 */
export interface SessionData {
    /** Session ID */
    sessionId: string;
    /** Session timestamp */
    timestamp: string;
    /** Messages in the session */
    messages: SessionMessage[];
    /** Tool usage summary */
    toolUsage: ToolUsageSummary;
    /** Total tokens used */
    totalTokens: number;
}
/**
 * Single message in session
 */
export interface SessionMessage {
    /** Role: 'user' | 'assistant' | 'system' | 'tool' */
    role: string;
    /** Message content */
    content: string;
    /** Timestamp */
    timestamp: string;
    /** Tool call (if applicable) */
    toolCall?: ToolCall;
}
/**
 * Tool call details
 */
export interface ToolCall {
    /** Tool name */
    name: string;
    /** Arguments */
    arguments: Record<string, any>;
    /** Result (if available) */
    result?: string;
}
/**
 * Tool usage summary
 */
export interface ToolUsageSummary {
    /** Number of tool calls */
    totalCalls: number;
    /** Most used tools */
    topTools: {
        name: string;
        count: number;
    }[];
    /** Files accessed */
    filesAccessed: string[];
}
/**
 * Automatic memory extractor for Hermes sessions
 *
 * Analyzes session transcripts and extracts important information
 * into GBrain (general knowledge) and ClawMem (code memory).
 *
 * Based on Claude Code's compaction mechanisms with adaptations for
 * persistent memory storage.
 */
export declare class AutoMemoryExtractor {
    private config;
    constructor(config: ExtractorConfig);
    /**
     * Extract memories from a session
     */
    extract(sessionData: SessionData): Promise<ExtractionResult>;
    /**
     * Extract code-related memories (ClawMem)
     */
    private extractCodeMemories;
    /**
     * Extract knowledge memories (GBrain)
     */
    private extractKnowledgeMemories;
    /**
     * Process and store a single memory
     */
    private processMemory;
    /**
     * Check if memory is duplicate using semantic search
     */
    private checkDuplicate;
    /**
     * Search for similar existing memories
     */
    private searchExistingMemory;
    /**
     * Add memory to ClawMem
     */
    private addToClawMem;
    /**
     * Add memory to GBrain
     */
    private addToGBrain;
    /**
     * Run CLI command
     */
    private runCommand;
    /**
     * Calculate session importance
     */
    private calculateSessionImportance;
    /**
     * Analyze file operations from session
     */
    private analyzeFileOperations;
    /**
     * Analyze code snippets from session
     */
    private analyzeCodeSnippets;
    /**
     * Analyze user preferences
     */
    private analyzeUserPreferences;
    /**
     * Analyze environment facts
     */
    private analyzeEnvironmentFacts;
    /**
     * Analyze procedures
     */
    private analyzeProcedures;
    /**
     * Calculate file operation importance
     */
    private calculateFileOpImportance;
    /**
     * Calculate code snippet importance
     */
    private calculateCodeSnippetImportance;
    /**
     * Format file operation for storage
     */
    private formatFileOperation;
    /**
     * Extract symbol name from file path
     */
    private extractSymbolName;
    /**
     * Infer AST type from tool
     */
    private inferASTType;
    /**
     * Infer AST type from code
     */
    private inferASTTypeFromCode;
    /**
     * Extract code blocks from content
     */
    private extractCodeBlocks;
    /**
     * Synthesize procedure from session
     */
    private synthesizeProcedure;
}
//# sourceMappingURL=extractor.d.ts.map