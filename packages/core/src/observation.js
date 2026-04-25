import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { resolvePath } from '@memohub/config';
export class ObservationKernel {
    logPath;
    constructor(root) {
        this.logPath = path.join(resolvePath(root), 'logs', 'trace.ndjson');
        const dir = path.dirname(this.logPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }
    createTraceId() {
        return randomUUID();
    }
    createSpanId() {
        return randomUUID().split('-')[0];
    }
    log(entry) {
        const json = JSON.stringify(entry);
        if (!json)
            return;
        const line = json + '\n';
        fs.appendFileSync(this.logPath, line, 'utf-8');
    }
    /**
     * Wrap execution in a safe runner with tracking.
     */
    async safeRun(fn, context) {
        const start = Date.now();
        try {
            const output = await fn();
            this.log({
                ...context,
                output,
                latencyMs: Date.now() - start,
                timestamp: new Date().toISOString(),
            });
            return output;
        }
        catch (error) {
            this.log({
                ...context,
                error: error.message || String(error),
                latencyMs: Date.now() - start,
                timestamp: new Date().toISOString(),
            });
            throw error;
        }
    }
}
//# sourceMappingURL=observation.js.map