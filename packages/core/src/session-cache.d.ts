import { VectorRecord } from '@memohub/storage-soul';
export declare class SessionCacheLayer {
    private cache;
    constructor(maxSize?: number);
    get(id: string): VectorRecord | undefined;
    set(id: string, record: VectorRecord): void;
    delete(id: string): void;
    clear(): void;
}
//# sourceMappingURL=session-cache.d.ts.map