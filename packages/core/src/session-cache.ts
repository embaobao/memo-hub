import { LRUCache } from "lru-cache";
import { VectorRecord } from "@memohub/storage-soul";

export class SessionCacheLayer {
  private cache: LRUCache<string, VectorRecord>;

  constructor(maxSize: number = 100) {
    this.cache = new LRUCache({
      max: maxSize,
      // Default TTL 30 minutes
      ttl: 1000 * 60 * 30,
    });
  }

  public get(id: string): VectorRecord | undefined {
    return this.cache.get(id);
  }

  public set(id: string, record: VectorRecord): void {
    this.cache.set(id, record);
  }

  public delete(id: string): void {
    this.cache.delete(id);
  }

  public clear(): void {
    this.cache.clear();
  }
}
