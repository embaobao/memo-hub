export interface TraceLog {
    traceId: string;
    spanId: string;
    step?: string;
    tool?: string;
    input?: any;
    output?: any;
    error?: string;
    latencyMs: number;
    timestamp: string;
}
export declare class ObservationKernel {
    private logPath;
    constructor(root: string);
    createTraceId(): string;
    createSpanId(): string;
    log(entry: TraceLog): void;
    /**
     * Wrap execution in a safe runner with tracking.
     */
    safeRun<T>(fn: () => Promise<T>, context: {
        traceId: string;
        spanId: string;
        step: string;
        tool: string;
        input: any;
    }): Promise<T>;
}
//# sourceMappingURL=observation.d.ts.map