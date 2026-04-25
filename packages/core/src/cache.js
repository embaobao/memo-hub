import { createHash } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { resolvePath } from '@memohub/config';
export class CacheManager {
    cacheDir;
    constructor(root) {
        this.cacheDir = path.join(resolvePath(root), 'cache');
        if (!fs.existsSync(this.cacheDir)) {
            fs.mkdirSync(this.cacheDir, { recursive: true });
        }
    }
    /**
     * Generate a cache key based on tool id and inputs.
     */
    generateKey(toolId, input, agentContext = {}) {
        const data = JSON.stringify({ toolId, input, agentContext }) || '';
        return createHash('sha256').update(data).digest('hex');
    }
    /**
     * Get cached result.
     */
    get(key) {
        const filePath = path.join(this.cacheDir, key + '.json');
        if (fs.existsSync(filePath)) {
            try {
                const content = fs.readFileSync(filePath, 'utf-8');
                return JSON.parse(content);
            }
            catch {
                return null;
            }
        }
        return null;
    }
    /**
     * Set cached result.
     */
    set(key, value) {
        const json = JSON.stringify(value);
        if (!json)
            return;
        const filePath = path.join(this.cacheDir, key + '.json');
        fs.writeFileSync(filePath, json, 'utf-8');
    }
    /**
     * Clear all cache.
     */
    clear() {
        if (!fs.existsSync(this.cacheDir))
            return;
        const files = fs.readdirSync(this.cacheDir);
        for (const file of files) {
            fs.unlinkSync(path.join(this.cacheDir, file));
        }
    }
}
//# sourceMappingURL=cache.js.map