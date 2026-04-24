import type { Text2MemInstruction, Text2MemResult, IKernel, ITrackProvider, KernelEvent, KernelEventHandler } from './types-internal.js';
import { validateInstruction } from '@memohub/protocol';

export class MemoryKernel implements IKernel {
  private config: Record<string, any>;
  private embedder: import('@memohub/protocol').IEmbedder;
  private completer: import('@memohub/protocol').ICompleter | null;
  private cas: import('@memohub/protocol').ICAS;
  private vectorStorage: import('@memohub/protocol').IVectorStorage;
  private tracks = new Map<string, ITrackProvider>();
  private eventHandlers: KernelEventHandler[] = [];

  constructor(options: {
    config: Record<string, any>;
    embedder: import('@memohub/protocol').IEmbedder;
    completer?: import('@memohub/protocol').ICompleter;
    cas: import('@memohub/protocol').ICAS;
    vectorStorage: import('@memohub/protocol').IVectorStorage;
  }) {
    this.config = options.config;
    this.embedder = options.embedder;
    this.completer = options.completer ?? null;
    this.cas = options.cas;
    this.vectorStorage = options.vectorStorage;
  }

  getEmbedder(): import('@memohub/protocol').IEmbedder {
    return this.embedder;
  }

  getCompleter(): import('@memohub/protocol').ICompleter | null {
    return this.completer;
  }

  getCAS(): import('@memohub/protocol').ICAS {
    return this.cas;
  }

  getVectorStorage(): import('@memohub/protocol').IVectorStorage {
    return this.vectorStorage;
  }

  getConfig(): Record<string, any> {
    return this.config;
  }

  onEvent(handler: KernelEventHandler): void {
    this.eventHandlers.push(handler);
  }

  async registerTrack(provider: ITrackProvider): Promise<void> {
    if (this.tracks.has(provider.id)) {
      throw new Error(`Track '${provider.id}' is already registered`);
    }
    await provider.initialize(this);
    this.tracks.set(provider.id, provider);
  }

  unregisterTrack(trackId: string): void {
    this.tracks.delete(trackId);
  }

  getTrack(trackId: string): ITrackProvider | undefined {
    return this.tracks.get(trackId);
  }

  listTracks(): string[] {
    return Array.from(this.tracks.keys());
  }

  async dispatch(instruction: Text2MemInstruction): Promise<Text2MemResult> {
    const validation = validateInstruction(instruction);
    if (!validation.success) {
      return { success: false, error: validation.error };
    }

    this.emit({ type: 'pre-dispatch', instruction });

    const track = this.tracks.get(instruction.trackId);
    if (!track) {
      const result: Text2MemResult = {
        success: false,
        error: `Track '${instruction.trackId}' not found. Available: ${this.listTracks().join(', ')}`,
      };
      this.emit({ type: 'post-dispatch', instruction, result });
      return result;
    }

    try {
      const result = await track.execute(instruction);
      this.emit({ type: 'post-dispatch', instruction, result });
      return result;
    } catch (error) {
      const result: Text2MemResult = {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
      this.emit({ type: 'post-dispatch', instruction, result });
      return result;
    }
  }

  private emit(event: KernelEvent): void {
    for (const handler of this.eventHandlers) {
      try {
        handler(event);
      } catch {
        // handler errors don't block dispatch
      }
    }
  }
}
