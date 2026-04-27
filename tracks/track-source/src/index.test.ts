import { describe, it, expect, beforeEach } from 'vitest';
import { SourceTrack } from './index.ts';
import { MemoOp, IKernel, ITool } from '@memohub/protocol';
import { MockCAS, MockVectorStorage, MockEmbedder } from '../../../packages/core/src/mocks.ts';
import { CasTool, VectorTool, EmbedderTool, RetrieverTool, CodeAnalyzerTool } from '../../../packages/builtin-tools/src/index.ts';

class MockKernel implements IKernel {
  cas = new MockCAS();
  vector = new MockVectorStorage();
  embedder = new MockEmbedder();
  tools = new Map<string, ITool>();

  constructor() {
    const casTool = new CasTool();
    const vectorTool = new VectorTool();
    const embedderTool = new EmbedderTool();
    const retrieverTool = new RetrieverTool();
    const codeAnalyzerTool = new CodeAnalyzerTool();

    this.registerTool(casTool);
    this.registerTool(vectorTool);
    this.registerTool(embedderTool);
    this.registerTool(retrieverTool);
    this.registerTool(codeAnalyzerTool);
  }

  registerTool(tool: ITool) {
    this.tools.set(tool.manifest.id, tool);
  }

  getCAS() { return this.cas; }
  getVectorStorage() { return this.vector; }
  getEmbedder() { return this.embedder; }
  getCompleter() { return null; }
  getConfig() { return { system: { root: '/tmp' }, ai: { agents: {} } }; }
  
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

describe('SourceTrack', () => {
  let track: SourceTrack;
  let kernel: MockKernel;

  beforeEach(async () => {
    kernel = new MockKernel();
    track = new SourceTrack();
    await track.initialize(kernel);
  });

  it('should ADD code snippet and return multiple symbols', async () => {
    const code = `export function testFunction() { return 42; }`;
    const result = await track.execute({
      op: MemoOp.ADD,
      trackId: track.id,
      payload: { code, language: 'typescript', file_path: 'src/test.ts' }
    });

    if (!result.success) console.error(result.error);
    expect(result.success).toBe(true);
    expect(result.data.length).toBe(1);
    expect(result.data[0]).toHaveProperty('hash');
  });

  it('should RETRIEVE source with hydration', async () => {
    const code = `const a = 1;`;
    await track.execute({
      op: MemoOp.ADD,
      trackId: track.id,
      payload: { code }
    });

    const result = await track.execute({
      op: MemoOp.RETRIEVE,
      trackId: track.id,
      payload: { query: 'variable', limit: 1 }
    });

    if (!result.success) console.error(result.error);
    expect(result.success).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data[0]).toHaveProperty('text', code); // The file block
  });
});
