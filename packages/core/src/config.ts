import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
// @ts-ignore
import * as yaml from "yaml";

export interface RoutingRule {
  type: "file_suffix" | "default";
  name?: string;
  track: string;
  suffixes?: string[];
}

export interface MemoHubConfig {
  embedding: {
    url: string;
    model: string;
    dimensions: number;
    timeout: number;
  };
  storage: { dbPath: string; casPath: string; tableName: string };
  routing: {
    enabled: boolean;
    defaultTrack: string;
    codeSuffixes: string[];
    rules?: RoutingRule[];
  };
  logging: { level: string; console: boolean };
  mcpServer: {
    enabled: boolean;
    port: number;
    transport: string;
    timeout: number;
  };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeRoutingRules(value: unknown): RoutingRule[] | undefined {
  if (!Array.isArray(value)) return undefined;

  const normalized: RoutingRule[] = [];
  for (const item of value) {
    if (!isPlainObject(item)) continue;

    const type = item["type"];
    if (type === "file_suffix") {
      const track = String(item["track"] ?? "").trim();
      const suffixes = Array.isArray(item["suffixes"])
        ? (item["suffixes"] as unknown[])
            .map((s) => String(s ?? "").trim())
            .filter(Boolean)
        : [];
      if (!track || suffixes.length === 0) continue;
      const name =
        typeof item["name"] === "string"
          ? String(item["name"]).trim()
          : undefined;
      normalized.push({
        type: "file_suffix",
        ...(name ? { name } : {}),
        track,
        suffixes,
      });
    } else if (type === "default") {
      const track = String(item["track"] ?? "").trim();
      if (!track) continue;
      const name =
        typeof item["name"] === "string"
          ? String(item["name"]).trim()
          : undefined;
      normalized.push({
        type: "default",
        ...(name ? { name } : {}),
        track,
      });
    }
  }

  return normalized.length > 0 ? normalized : undefined;
}

export class ConfigManager {
  private config: MemoHubConfig;
  private configPath: string;

  constructor(configPath?: string) {
    const defaultConfigPath = path.join(process.cwd(), "config", "config.yaml");
    this.configPath = configPath || defaultConfigPath;
    this.config = this.loadConfig();
  }

  private loadConfig(): MemoHubConfig {
    try {
      const expandedPath = this.configPath.replace(/^~/, os.homedir());

      if (fs.existsSync(expandedPath)) {
        const fileContent = fs.readFileSync(expandedPath, "utf-8");
        const parsed = yaml.parse(fileContent);
        return this.normalizeConfig(parsed);
      } else {
        console.warn(
          `Config file not found at ${expandedPath}, using defaults`,
        );
        return this.getDefaultConfig();
      }
    } catch (error) {
      console.error("Error loading config file:", error);
      return this.getDefaultConfig();
    }
  }

  private normalizeConfig(input: unknown): MemoHubConfig {
    const defaults = this.getDefaultConfig();
    const raw = isPlainObject(input) ? (input as Record<string, unknown>) : {};

    const embeddingRaw = isPlainObject(raw.embedding)
      ? (raw.embedding as Partial<MemoHubConfig["embedding"]>)
      : {};
    const storageRaw = isPlainObject(raw.storage)
      ? (raw.storage as Partial<MemoHubConfig["storage"]>)
      : {};
    const routingRaw = isPlainObject(raw.routing)
      ? (raw.routing as Record<string, unknown>)
      : {};
    const loggingRaw = isPlainObject(raw.logging)
      ? (raw.logging as Partial<MemoHubConfig["logging"]>)
      : {};
    const mcpServerRaw = isPlainObject(raw.mcpServer)
      ? (raw.mcpServer as Partial<MemoHubConfig["mcpServer"]>)
      : isPlainObject(raw.mcp_server)
        ? (raw.mcp_server as Partial<MemoHubConfig["mcpServer"]>)
        : {};

    const normalizedCodeSuffixes = Array.isArray(routingRaw.codeSuffixes)
      ? (routingRaw.codeSuffixes as unknown[])
          .filter((s): s is string => typeof s === "string")
          .map((s) => s.trim())
          .filter(Boolean)
      : Array.isArray(routingRaw.code_suffixes)
        ? (routingRaw.code_suffixes as unknown[])
            .filter((s): s is string => typeof s === "string")
            .map((s) => s.trim())
            .filter(Boolean)
        : defaults.routing.codeSuffixes;

    const normalizedRules = normalizeRoutingRules(
      routingRaw.rules ?? routingRaw.rules,
    );

    return {
      embedding: { ...defaults.embedding, ...embeddingRaw },
      storage: {
        dbPath:
          typeof (storageRaw as any).dbPath === "string"
            ? (storageRaw as any).dbPath
            : typeof (storageRaw as any).db_path === "string"
              ? (storageRaw as any).db_path
              : defaults.storage.dbPath,
        casPath:
          typeof (storageRaw as any).casPath === "string"
            ? (storageRaw as any).casPath
            : typeof (storageRaw as any).cas_path === "string"
              ? (storageRaw as any).cas_path
              : defaults.storage.casPath,
        tableName:
          typeof (storageRaw as any).tableName === "string"
            ? (storageRaw as any).tableName
            : typeof (storageRaw as any).table_name === "string"
              ? (storageRaw as any).table_name
              : defaults.storage.tableName,
      },
      routing: {
        enabled:
          typeof routingRaw.enabled === "boolean"
            ? routingRaw.enabled
            : defaults.routing.enabled,
        defaultTrack:
          typeof routingRaw.defaultTrack === "string" &&
          String(routingRaw.defaultTrack ?? "").trim() !== ""
            ? routingRaw.defaultTrack
            : typeof routingRaw.default_track === "string" &&
                String(routingRaw.default_track ?? "").trim() !== ""
              ? routingRaw.default_track
              : defaults.routing.defaultTrack,
        codeSuffixes: normalizedCodeSuffixes,
        ...(normalizedRules ? { rules: normalizedRules } : {}),
      },
      logging: { ...defaults.logging, ...loggingRaw },
      mcpServer: { ...defaults.mcpServer, ...mcpServerRaw },
    };
  }

  getDefaultConfig(): MemoHubConfig {
    return {
      embedding: {
        url: "http://localhost:11434/v1",
        model: "nomic-embed-text-v2-moe",
        dimensions: 768,
        timeout: 30,
      },
      storage: {
        dbPath: "~/.memohub/data/memohub.lancedb",
        casPath: "~/.memohub/blobs",
        tableName: "memohub",
      },
      routing: {
        enabled: true,
        defaultTrack: "track-insight",
        codeSuffixes: [
          ".ts",
          ".tsx",
          ".js",
          ".jsx",
          ".py",
          ".go",
          ".rs",
          ".java",
        ],
      },
      logging: {
        level: "info",
        console: true,
      },
      mcpServer: {
        enabled: true,
        port: 3000,
        transport: "stdio",
        timeout: 30,
      },
    };
  }

  getConfig(): MemoHubConfig {
    return this.config;
  }

  getEmbeddingConfig() {
    return this.config.embedding;
  }

  getStorageConfig() {
    return this.config.storage;
  }

  getRoutingConfig() {
    return this.config.routing;
  }

  applyEnvOverrides(): void {
    if (process.env.EMBEDDING_URL) {
      this.config.embedding.url = process.env.EMBEDDING_URL;
    }
    if (process.env.EMBEDDING_MODEL) {
      this.config.embedding.model = process.env.EMBEDDING_MODEL;
    }
    if (process.env.MEMOHUB_DB_PATH) {
      this.config.storage.dbPath = process.env.MEMOHUB_DB_PATH;
    }
    if (process.env.MEMOHUB_CAS_PATH) {
      this.config.storage.casPath = process.env.MEMOHUB_CAS_PATH;
    }
    if (process.env.MEMOHUB_ROUTING_ENABLED) {
      const raw = String(process.env.MEMOHUB_ROUTING_ENABLED ?? "")
        .trim()
        .toLowerCase();
      const truthy =
        raw === "1" || raw === "true" || raw === "yes" || raw === "on";
      const falsy =
        raw === "0" || raw === "false" || raw === "no" || raw === "off";
      if (truthy) this.config.routing.enabled = true;
      else if (falsy) this.config.routing.enabled = false;
    }
    if (process.env.MEMOHUB_ROUTING_DEFAULT_TRACK) {
      const track = String(
        process.env.MEMOHUB_ROUTING_DEFAULT_TRACK ?? "",
      ).trim();
      if (track) this.config.routing.defaultTrack = track;
    }
    if (process.env.MEMOHUB_ROUTING_CODE_SUFFIXES) {
      const suffixes = String(process.env.MEMOHUB_ROUTING_CODE_SUFFIXES ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (suffixes.length > 0) this.config.routing.codeSuffixes = suffixes;
    }
    if (process.env.MEMORY_LOG_LEVEL) {
      this.config.logging.level = process.env.MEMORY_LOG_LEVEL;
    }
  }

  validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.config.embedding.url) {
      errors.push("embedding.url is required");
    }
    if (!this.config.embedding.model) {
      errors.push("embedding.model is required");
    }
    if (this.config.embedding.dimensions <= 0) {
      errors.push("embedding.dimensions must be positive");
    }

    if (!this.config.storage.dbPath) {
      errors.push("storage.dbPath is required");
    }
    if (!this.config.storage.casPath) {
      errors.push("storage.casPath is required");
    }
    if (!this.config.storage.tableName) {
      errors.push("storage.tableName is required");
    }

    if (this.config.routing.enabled) {
      if (!this.config.routing.defaultTrack) {
        errors.push("routing.defaultTrack is required when routing is enabled");
      }

      for (const s of this.config.routing.codeSuffixes) {
        const suffix = String(s ?? "").trim();
        if (!suffix) {
          errors.push("routing.codeSuffixes contains empty suffix");
          continue;
        }
        if (!suffix.startsWith(".")) {
          errors.push(`routing.codeSuffixes must start with '.': ${suffix}`);
        }
      }
    }

    if (this.config.routing.rules) {
      if (!Array.isArray(this.config.routing.rules)) {
        errors.push("routing.rules must be an array when provided");
      } else {
        for (const rule of this.config.routing.rules) {
          if (rule.type !== "file_suffix" && rule.type !== "default") {
            errors.push(
              `routing.rules has unsupported type: ${String(rule.type)}`,
            );
            continue;
          }
          if (!rule.track) {
            errors.push(`routing.rules.${rule.type}.track is required`);
          }
          if (rule.type === "file_suffix") {
            if (!Array.isArray(rule.suffixes) || rule.suffixes.length === 0) {
              errors.push(
                "routing.rules.file_suffix.suffixes must be a non-empty array",
              );
            } else {
              for (const s of rule.suffixes) {
                const suffix = String(s ?? "").trim();
                if (!suffix) {
                  errors.push(
                    "routing.rules.file_suffix.suffixes contains empty suffix",
                  );
                  continue;
                }
                if (!suffix.startsWith(".")) {
                  errors.push(
                    `routing.rules.file_suffix.suffixes must start with '.': ${suffix}`,
                  );
                }
              }
            }
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  saveConfig(): void {
    try {
      const expandedPath = this.configPath.replace(/^~/, os.homedir());
      const dir = path.dirname(expandedPath);

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const yamlString = yaml.stringify(this.config as any);
      fs.writeFileSync(expandedPath, yamlString, "utf-8");
    } catch (error) {
      console.error("Error saving config file:", error);
      throw error;
    }
  }
}
