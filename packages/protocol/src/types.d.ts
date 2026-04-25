export declare enum MemoOp {
    ADD = "ADD",
    RETRIEVE = "RETRIEVE",
    UPDATE = "UPDATE",
    DELETE = "DELETE",
    MERGE = "MERGE",
    CLARIFY = "CLARIFY",
    LIST = "LIST",
    EXPORT = "EXPORT",
    DISTILL = "DISTILL",
    ANCHOR = "ANCHOR",
    DIFF = "DIFF",
    SYNC = "SYNC"
}
export interface Text2MemInstruction {
    op: MemoOp;
    trackId: string;
    payload: any;
    context?: Record<string, any>;
    meta?: Record<string, any>;
}
export interface Text2MemResult {
    success: boolean;
    data?: any;
    error?: string;
    meta?: Record<string, any>;
}
export interface IKernel {
    getEmbedder(): IEmbedder;
    getCompleter(): ICompleter | null;
    getCAS(): ICAS;
    getVectorStorage(): IVectorStorage;
    getConfig(): Record<string, any>;
    dispatch(instruction: Text2MemInstruction): Promise<Text2MemResult>;
}
export interface ITrackProvider {
    id: string;
    name: string;
    initialize(kernel: IKernel): Promise<void>;
    execute(instruction: Text2MemInstruction): Promise<Text2MemResult>;
}
export interface IEmbedder {
    embed(text: string): Promise<number[]>;
    batchEmbed(texts: string[]): Promise<number[][]>;
}
export interface ICompleter {
    chat(messages: Array<{
        role: string;
        content: string;
    }>): Promise<string>;
    summarize(text: string): Promise<string>;
}
export interface ICAS {
    write(content: string): Promise<string>;
    read(hash: string): Promise<string>;
    has(hash: string): Promise<boolean>;
    delete(hash: string): Promise<void>;
    computeHash(content: string): string;
}
export interface IVectorStorage {
    add(records: any | any[]): Promise<void>;
    search(vector: number[], options?: {
        limit?: number;
        filter?: string;
    }): Promise<any[]>;
    delete(filter: string): Promise<void>;
    list(filter?: string, limit?: number): Promise<any[]>;
    update(id: string, changes: any): Promise<void>;
    initialize(): Promise<void>;
}
//# sourceMappingURL=types.d.ts.map