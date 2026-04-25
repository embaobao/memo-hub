import type { Text2MemInstruction, Text2MemResult, IKernel, ITrackProvider } from '@memohub/protocol';
/**
 * 时序流轨道 (Stream Track)
 * 职责: 记录原始对话 Log，管理 TTL。
 */
export declare class StreamTrack implements ITrackProvider {
    id: string;
    name: string;
    private kernel;
    initialize(kernel: IKernel): Promise<void>;
    execute(instruction: Text2MemInstruction): Promise<Text2MemResult>;
    private handleAdd;
    private handleRetrieve;
    private handleDelete;
    private handleList;
}
//# sourceMappingURL=index.d.ts.map