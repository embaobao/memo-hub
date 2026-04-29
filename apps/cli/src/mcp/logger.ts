import { appendFileSync, mkdirSync, readFileSync } from "node:fs";
import * as path from "node:path";
import { getMcpLogPath } from "./catalog.js";

export type McpLogLevel = "debug" | "info" | "warn" | "error";

export interface McpLogEntry {
  timestamp?: string;
  level: McpLogLevel;
  event: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export class McpLogger {
  constructor(private readonly logPath = getMcpLogPath()) {
    mkdirSync(path.dirname(this.logPath), { recursive: true });
  }

  get path(): string {
    return this.logPath;
  }

  write(entry: McpLogEntry): void {
    const payload = {
      timestamp: entry.timestamp ?? new Date().toISOString(),
      ...entry,
    };
    appendFileSync(this.logPath, `${JSON.stringify(payload)}\n`, "utf8");
  }

  readTail(lines = 50): string {
    try {
      const content = readFileSync(this.logPath, "utf8");
      return content.split("\n").filter(Boolean).slice(-lines).join("\n");
    } catch {
      return "";
    }
  }
}
