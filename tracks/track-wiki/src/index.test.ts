import { describe, it, expect, beforeEach } from 'vitest';
import { WikiTrack } from './index.ts';
import { MemoOp, IKernel, ITool } from '@memohub/protocol';
import { MockCAS, MockVectorStorage, MockEmbedder } from '../../../packages/core/src/mocks.ts';

class MockKernel implements IKernel {
  cas = new MockCAS();
  vector = new MockVectorStorage();
  embedder = new MockEmbedder();
  tools = new Map<string, ITool>();

  getCAS() { return this.cas; }
  getVectorStorage() { return this.vector; }
  getEmbedder() { return this.embedder; }
  getCompleter() { return null; }
  getConfig() { return { system: { root: '/tmp' }, ai: { agents: {} } }; }
  
  getTool(id: string): ITool {
    throw new Error(`Method not implemented.`);
  }
  listTools() { return []; }
  async dispatch() { return { success: true } as any; }
}

describe('WikiTrack', () => {
  let track: WikiTrack;
  let kernel: MockKernel;

  beforeEach(async () => {
    kernel = new MockKernel();
    track = new WikiTrack();
    await track.initialize(kernel);
  });

  it('should ADD a wiki entry', async () => {
    const title = 'Core Concepts';
    const content = 'MemoHub is great.';
    const result = await track.execute({
      op: MemoOp.ADD,
      trackId: track.id,
      payload: { title, content }
    });

    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty('id');
    expect(result.data).toHaveProperty('hash');
    expect(result.data.hash).toBe(`hash-${content.length}`);
  });

  it('should fail ADD if missing title or content', async () => {
    const result = await track.execute({
      op: MemoOp.ADD,
      trackId: track.id,
      payload: { title: 'Missing content' }
    });

    expect(result.success).toBe(false);
    expect(result.error).toHaveProperty('code');
  });

  it('should RETRIEVE wiki entry with hydration', async () => {
    const title = 'Retrieval Test';
    const content = 'Test content';
    await track.execute({
      op: MemoOp.ADD,
      trackId: track.id,
      payload: { title, content }
    });

    const result = await track.execute({
      op: MemoOp.RETRIEVE,
      trackId: track.id,
      payload: { query: 'test' }
    });

    expect(result.success).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data[0]).toHaveProperty('text', content);
  });
});
