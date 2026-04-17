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
//# sourceMappingURL=types.d.ts.map