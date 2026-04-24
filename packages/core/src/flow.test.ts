import { describe, it, expect, beforeAll } from 'bun:test';
import { MemoryKernel } from './kernel.js';
import { ConfigLoader } from '@memohub/config';
import { MemoOp } from '@memohub/protocol';
import * as fs from 'node:fs';
import * as path from 'node:path';

describe('Flow Engine Integration', () => {
  let kernel: MemoryKernel;

  beforeAll(async () => {
    // Setup a clean config environment
    const configDir = './test-env';
    if (fs.existsSync(configDir)) fs.rmSync(configDir, { recursive: true });
    fs.mkdirSync(configDir, { recursive: true });
    
    // Create a minimal config for testing
    const configPath = path.join(configDir, 'memohub.json');
    const loader = new ConfigLoader(configPath);
    const config = loader.getConfig();
    
    // Inject mock provider
    config.ai.providers = [{ id: 'mock', type: 'mock' }];
    config.ai.agents = {
      embedder: { provider: 'mock', model: 'mock-model', dimensions: 768 },
      ranker: { provider: 'mock', model: 'mock-model' }
    };

    kernel = new MemoryKernel(config);
    await kernel.initialize();
  });

  it('should execute track-insight flow successfully', async () => {
    const result = await kernel.dispatch({
      op: MemoOp.ADD,
      trackId: 'track-insight',
      payload: { 
        id: 'test-1',
        text: 'Hello, this is a test for the flow engine.',
        category: 'test'
      },
    });

    expect(result.success).toBe(true);
    expect(result.meta?.trackId).toBe('track-insight');
    expect(result.success).toBe(true);
    });

    it('should retrieve from track-insight flow successfully', async () => {
    const result = await kernel.dispatch({
      op: MemoOp.RETRIEVE,
      trackId: 'track-insight',
      payload: { 
        query: 'test query',
        limit: 2
      },
    });

    if (!result.success) console.error('RETRIEVE Error:', result.error);
    expect(result.success).toBe(true);
    expect(result.data.results).toBeDefined();
    expect(Array.isArray(result.data.results)).toBe(true);
  });

  it('should execute track-source flow successfully', async () => {
    const result = await kernel.dispatch({
      op: MemoOp.ADD,
      trackId: 'track-source',
      payload: { 
        id: 'code-1',
        content: 'console.log("hello world");',
        language: 'typescript',
        file_path: 'test.ts'
      },
    });

    expect(result.success).toBe(true);
    expect(result.meta?.trackId).toBe('track-source');
  });

  it('should handle missing tracks gracefully', async () => {
    const result = await kernel.dispatch({
      op: MemoOp.ADD,
      trackId: 'non-existent',
      payload: { text: 'fail' },
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Track not found');
  });
});
