import { randomUUID } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { resolvePath } from "@memohub/config";

export interface TraceLog {
  traceId: string;
  spanId: string;
  step?: string;
  tool?: string;
  input?: any;
  output?: any;
  error?: string;
  latencyMs: number;
  timestamp: string;
}

export class ObservationKernel {
  private logPath: string;

  constructor(root: string) {
    this.logPath = path.join(resolvePath(root), "logs", "trace.ndjson");
    const dir = path.dirname(this.logPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  public createTraceId(): string {
    return randomUUID();
  }

  public createSpanId(): string {
    return randomUUID().split("-")[0];
  }

  public log(entry: TraceLog): void {
    const json = JSON.stringify(entry);
    if (!json) return;
    const line = json + "\n";
    fs.appendFileSync(this.logPath, line, "utf-8");
  }

  /**
   * Wrap execution in a safe runner with tracking.
   */
  public async safeRun<T>(
    fn: () => Promise<T>,
    context: {
      traceId: string;
      spanId: string;
      step: string;
      tool: string;
      input: any;
    },
  ): Promise<T> {
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
    } catch (error: any) {
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
