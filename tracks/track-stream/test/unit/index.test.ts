import { describe, it, expect, beforeEach } from 'vitest';
import { StreamTrack } from '../../src/index.ts';
import { MemoOp, IKernel, ITool } from '@memohub/protocol';
import { MockCAS, MockVectorStorage, MockEmbedder } from '../../../../packages/core/src/mocks.ts';
import { CasTool, VectorTool, EmbedderTool } from '../../../../packages/builtin-tools/src/index.ts';

class MockKernel implements IKernel {
  cas = new MockCAS();
  vector = new MockVectorStorage();
  embedder = new MockEmbedder();
  tools = new Map<string, ITool>();

  constructor() {
    this.registerTool(new CasTool());
    this.registerTool(new VectorTool());
    this.registerTool(new EmbedderTool());
  }

  registerTool(tool: ITool) {
    this.tools.set(tool.manifest.id, tool);
  }

  getCAS() { return this.cas; }
  getVectorStorage() { return this.vector; }
  getEmbedder() { return this.embedder; }
  getCompleter() { return null; }
  getConfig() { return { system: { root: '/tmp' }, ai: { agents: {} } }; }
  getResources() {
    return {
      kernel: this,
      flesh: this.cas,
      soul: this.vector,
      ai: { getEmbedder: () => this.embedder, getCompleter: () => null },
      logger: { log: () => {} }
    };
  }
  
  getTool(id: string): ITool {
    const t = this.tools.get(id);
    if (!t) throw new Error(`Tool not found: ${id}`);
    
    const originalExecute = t.execute.bind(t);
    return {
      manifest: t.manifest,
      execute: async (input, resources, context) => {
        const mockResources = {
          kernel: this as any,
          flesh: this.cas as any,
          soul: this.vector as any,
          ai: { getEmbedder: () => this.embedder, getCompleter: () => null } as any,
          logger: { log: () => {} } as any
        };
        return originalExecute(input, mockResources, context);
      }
    };
  }
  
  listTools() { return Array.from(this.tools.values()).map(t => t.manifest); }
  async dispatch() { return { success: true } as any; }
}

describe('StreamTrack', () => {
  let track: StreamTrack;
  let kernel: MockKernel;

  beforeEach(async () => {
    kernel = new MockKernel();
    track = new StreamTrack();
    await track.initialize(kernel);
  });

  it('should ADD stream entry and return hash', async () => {
    const text = 'User asks a question';
    const result = await track.execute({
      op: MemoOp.ADD,
      trackId: track.id,
      payload: { text, role: 'user', session_id: 's-123' }
    });

    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty('hash');
    expect(result.data.hash).toBe(`hash-${text.length}`);
  });

  it('should not support RETRIEVE directly in MVP', async () => {
    const result = await track.execute({
      op: MemoOp.RETRIEVE,
      trackId: track.id,
      payload: { query: 'test' }
    });

    expect(result.success).toBe(false);
    expect(result.error).toHaveProperty('code');
  });
});
