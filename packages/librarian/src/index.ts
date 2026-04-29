import type {
  Text2MemInstruction,
  Text2MemResult,
  IKernel,
  ITrackProvider,
  IVectorStorage,
} from "@memohub/protocol";
import { MemoOp, MemoErrorCode } from "@memohub/protocol";

export {
  PreProcessor,
  ExecProcessor,
  PostProcessor,
  RetrievalPipeline,
  type QueryIntent,
  type QueryEntities,
  type TokenizedQuery,
  type PreResult,
  type ExecResult,
  type PostResult,
  type RetrievedRecord,
  type RankingFactor,
  type RetrievalPipelineOptions,
  type PipelineResult,
} from "./retrieval-pipeline.js";

/**
 * @internal
 */
export interface ConflictReport {
  recordA: any;
  recordB: any;
  similarity: number;
  trackId: string;
}

/**
 * @internal
 */
export class Librarian implements ITrackProvider {
  id = "track-librarian";
  name = "Librarian";

  private kernel!: IKernel;
  private timers: ReturnType<typeof setInterval>[] = [];

  async initialize(kernel: IKernel): Promise<void> {
    this.kernel = kernel;
  }

  async execute(instruction: Text2MemInstruction): Promise<Text2MemResult> {
    switch (instruction.op) {
      case MemoOp.DISTILL:
        return this.handleDistill(instruction);
      case MemoOp.LIST:
        return this.handleDedup(instruction);
      default:
        return {
          success: false,
          error: {
            code: MemoErrorCode.ERR_TOOL_NOT_FOUND,
            message: `Operation ${instruction.op} not supported by librarian`,
          },
        };
    }
  }

  async scanDedup(
    trackId: string,
    threshold: number = 0.95,
  ): Promise<ConflictReport[]> {
    const storage = this.kernel.getVectorStorage();
    const cas = this.kernel.getCAS();
    const conflicts: ConflictReport[] = [];

    const records = await storage.list(`track_id = '${trackId}'`);
    if (records.length < 2) return conflicts;

    for (let i = 0; i < records.length; i++) {
      for (let j = i + 1; j < records.length; j++) {
        const a = records[i];
        const b = records[j];

        if (a.hash === b.hash) continue;

        const similarity = this.cosineSimilarity(a.vector, b.vector);
        if (similarity >= threshold) {
          conflicts.push({ recordA: a, recordB: b, similarity, trackId });
        }
      }
    }

    return conflicts;
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0,
      normA = 0,
      normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  async dispatchClarify(conflict: ConflictReport): Promise<Text2MemResult> {
    return this.kernel.dispatch({
      op: MemoOp.CLARIFY,
      trackId: conflict.trackId,
      payload: {
        recordA: { id: conflict.recordA.id, hash: conflict.recordA.hash },
        recordB: { id: conflict.recordB.id, hash: conflict.recordB.hash },
        similarity: conflict.similarity,
        resolutionOptions: ["keep-first", "keep-second", "merge", "skip"],
      },
    });
  }

  private async handleDedup(
    inst: Text2MemInstruction,
  ): Promise<Text2MemResult> {
    try {
      const { trackId, threshold = 0.95 } = inst.payload ?? {};
      if (!trackId)
        return {
          success: false,
          error: {
            code: MemoErrorCode.ERR_CONFIG_INVALID,
            message: "payload.trackId is required",
          },
        };

      const conflicts = await this.scanDedup(trackId, threshold);
      return {
        success: true,
        data: { conflictCount: conflicts.length, conflicts },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: MemoErrorCode.ERR_KERNEL_OFFLINE,
          message: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  private async handleDistill(
    inst: Text2MemInstruction,
  ): Promise<Text2MemResult> {
    try {
      const { trackId } = inst.payload ?? {};
      if (!trackId)
        return {
          success: false,
          error: {
            code: MemoErrorCode.ERR_CONFIG_INVALID,
            message: "payload.trackId is required",
          },
        };

      const completer = this.kernel.getCompleter();
      if (!completer)
        return {
          success: false,
          error: {
            code: MemoErrorCode.ERR_CONFIG_INVALID,
            message: "No completer (LLM) configured for distill",
          },
        };

      const conflicts = await this.scanDedup(trackId);
      const distilled = [];

      for (const conflict of conflicts) {
        const cas = this.kernel.getCAS();
        const textA = await cas.read(conflict.recordA.hash).catch(() => "");
        const textB = await cas.read(conflict.recordB.hash).catch(() => "");

        const summary = await completer.summarize(
          `Merge and refine these two similar entries into one concise entry:\n\n1: ${textA}\n\n2: ${textB}`,
        );
        distilled.push({
          originalIds: [conflict.recordA.id, conflict.recordB.id],
          distilled: summary,
          similarity: conflict.similarity,
        });
      }

      return {
        success: true,
        data: { totalConflicts: conflicts.length, distilled },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: MemoErrorCode.ERR_KERNEL_OFFLINE,
          message: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  startScheduled(intervalMs: number, trackId: string): void {
    const timer = setInterval(async () => {
      try {
        const conflicts = await this.scanDedup(trackId);
        for (const conflict of conflicts) {
          await this.dispatchClarify(conflict);
        }
      } catch {
        // scheduled tasks don't throw
      }
    }, intervalMs);
    this.timers.push(timer);
  }

  stopScheduled(): void {
    for (const timer of this.timers) {
      clearInterval(timer);
    }
    this.timers = [];
  }
}
