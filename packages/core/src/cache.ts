import { createHash } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { resolvePath } from '@memohub/config';

export class CacheManager {
  private cacheDir: string;

  constructor(root: string) {
    this.cacheDir = path.join(resolvePath(root), 'cache');
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  /**
   * Generate a cache key based on tool id and inputs.
   */
  public generateKey(toolId: string, input: any, agentContext: any = {}): string {
    const data = JSON.stringify({ toolId, input, agentContext });
    return createHash('sha256').update(data).digest('hex');
  }

  /**
   * Get cached result.
   */
  public get<T>(key: string): T | null {
    const filePath = path.join(this.cacheDir, key + '.json');
    if (fs.existsSync(filePath)) {
      try {
        return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      } catch {
        return null;
      }
    }
    return null;
  }

  /**
   * Set cached result.
   */
  public set(key: string, value: any): void {
    const filePath = path.join(this.cacheDir, key + '.json');
    fs.writeFileSync(filePath, JSON.stringify(value), 'utf-8');
  }

  /**
   * Clear all cache.
   */
  public clear(): void {
    const files = fs.readdirSync(this.cacheDir);
    for (const file of files) {
      fs.unlinkSync(path.join(this.cacheDir, file));
    }
  }
}
