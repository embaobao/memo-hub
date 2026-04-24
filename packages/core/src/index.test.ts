import { describe, it, expect } from 'bun:test';
import { MemoryKernel } from './kernel.js';
import type { ITrackProvider, IKernel, KernelEvent } from './types.js';
import type { Text2MemInstruction, Text2MemResult } from '@memohub/protocol';
import { MemoOp } from '@memohub/protocol';
import type { IEmbedder } from '@memohub/ai-provider';
import type { ContentAddressableStorage } from '@memohub/storage-flesh';
import type { VectorStorage, VectorStorageConfig } from '@memohub/storage-soul';

const mockEmbedder: IEmbedder = {
  embed: async () => [0.1, 0.2, 0.3],
  batchEmbed: async (texts) => texts.map(() => [0.1, 0.2, 0.3]),
};

const mockCAS = {
  write: async (c: string) => 'hash-' + c.length,
  read: async (h: string) => 'content',
  has: async (h: string) => true,
  delete: async () => {},
  computeHash: (c: string) => 'hash-' + c.length,
} as unknown as ContentAddressableStorage;

const mockVectorStorage = {
  add: async () => {},
  search: async () => [],
  delete: async () => {},
  list: async () => [],
  update: async () => {},
  initialize: async () => {},
} as unknown as VectorStorage;

function createKernel(): MemoryKernel {
  return new MemoryKernel({
    config: { test: true },
    embedder: mockEmbedder,
    cas: mockCAS,
    vectorStorage: mockVectorStorage,
  });
}

const mockTrack: ITrackProvider = {
  id: 'track-test',
  name: 'Test Track',
  initialize: async () => {},
  execute: async (inst: Text2MemInstruction): Promise<Text2MemResult> => {
    return { success: true, data: { op: inst.op } };
  },
};

describe('MemoryKernel', () => {
  it('registers a track', async () => {
    const kernel = createKernel();
    await kernel.registerTrack(mockTrack);
    expect(kernel.listTracks()).toContain('track-test');
  });

  it('rejects duplicate track registration', async () => {
    const kernel = createKernel();
    await kernel.registerTrack(mockTrack);
    expect(kernel.registerTrack(mockTrack)).rejects.toThrow('already registered');
  });

  it('unregisters a track', async () => {
    const kernel = createKernel();
    await kernel.registerTrack(mockTrack);
    kernel.unregisterTrack('track-test');
    expect(kernel.listTracks()).not.toContain('track-test');
  });

  it('dispatches instruction to registered track', async () => {
    const kernel = createKernel();
    await kernel.registerTrack(mockTrack);
    const result = await kernel.dispatch({
      op: MemoOp.ADD,
      trackId: 'track-test',
      payload: { text: 'hello' },
    });
    expect(result.success).toBe(true);
    expect(result.data?.op).toBe('ADD');
  });

  it('returns error for unregistered track', async () => {
    const kernel = createKernel();
    const result = await kernel.dispatch({
      op: MemoOp.ADD,
      trackId: 'unknown',
      payload: {},
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain('not found');
  });

  it('returns error for invalid instruction', async () => {
    const kernel = createKernel();
    const result = await kernel.dispatch({
      op: 'INVALID' as any,
      trackId: '',
      payload: {},
    });
    expect(result.success).toBe(false);
  });

  it('emits pre and post dispatch events', async () => {
    const kernel = createKernel();
    await kernel.registerTrack(mockTrack);
    const events: KernelEvent[] = [];
    kernel.onEvent((e) => events.push(e));

    await kernel.dispatch({ op: MemoOp.LIST, trackId: 'track-test', payload: {} });

    expect(events).toHaveLength(2);
    expect(events[0].type).toBe('pre-dispatch');
    expect(events[1].type).toBe('post-dispatch');
  });

  it('exposes kernel capabilities to tracks', async () => {
    let capturedKernel: IKernel | null = null;
    const track: ITrackProvider = {
      id: 'track-probe',
      name: 'Probe',
      initialize: async (k) => { capturedKernel = k; },
      execute: async () => ({ success: true }),
    };

    const kernel = createKernel();
    await kernel.registerTrack(track);

    expect(capturedKernel).not.toBeNull();
    expect(capturedKernel!.getEmbedder()).toBe(mockEmbedder);
    expect(capturedKernel!.getCAS()).toBe(mockCAS);
    expect(capturedKernel!.getConfig()).toEqual({ test: true });
  });
});
