import { LRUCache } from 'lru-cache';
export class SessionCacheLayer {
    cache;
    constructor(maxSize = 100) {
        this.cache = new LRUCache({
            max: maxSize,
            // Default TTL 30 minutes
            ttl: 1000 * 60 * 30,
        });
    }
    get(id) {
        return this.cache.get(id);
    }
    set(id, record) {
        this.cache.set(id, record);
    }
    delete(id) {
        this.cache.delete(id);
    }
    clear() {
        this.cache.clear();
    }
}
//# sourceMappingURL=session-cache.js.map