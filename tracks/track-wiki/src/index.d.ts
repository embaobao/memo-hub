import type { Text2MemInstruction, Text2MemResult, IKernel, ITrackProvider } from '@memohub/protocol';
/**
 * 真理库轨道 (Wiki Track)
 * 职责: 存储经过 Librarian 整理且通过“澄清环节”确认的权威知识。
 */
export declare class WikiTrack implements ITrackProvider {
    id: string;
    name: string;
    private kernel;
    initialize(kernel: IKernel): Promise<void>;
    execute(instruction: Text2MemInstruction): Promise<Text2MemResult>;
    private handleAdd;
    private handleRetrieve;
    private handleUpdate;
    private handleDelete;
    private handleList;
    private handleExport;
    private handleAnchor;
}
//# sourceMappingURL=index.d.ts.map