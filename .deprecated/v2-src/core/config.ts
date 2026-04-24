// 配置管理器

import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import * as yaml from "yaml";
import type { MemoryConfig, RoutingRuleConfig } from "../types/index.js";

export class ConfigManager {
  private config: MemoryConfig;
  private configPath: string;

  constructor(configPath?: string) {
    // 默认配置路径
    const defaultConfigPath = path.join(
      process.cwd(),
      "config",
      "config.yaml"
    );

    this.configPath = configPath || defaultConfigPath;
    this.config = this.loadConfig();
  }

  /**
   * 加载配置文件
   */
  private loadConfig(): MemoryConfig {
    try {
      // 展开路径中的 ~
      const expandedPath = this.configPath.replace(/^~/, os.homedir());

      if (fs.existsSync(expandedPath)) {
        const fileContent = fs.readFileSync(expandedPath, "utf-8");
        const parsed = yaml.parse(fileContent);
        return this.normalizeConfig(parsed);
      } else {
        console.warn(`Config file not found at ${expandedPath}, using defaults`);
        return this.getDefaultConfig();
      }
    } catch (error) {
      console.error(`Error loading config file:`, error);
      return this.getDefaultConfig();
    }
  }

  private normalizeConfig(input: unknown): MemoryConfig {
    const defaults = this.getDefaultConfig();

    const raw = isPlainObject(input) ? (input as Partial<MemoryConfig>) : {};

    const embeddingRaw = isPlainObject(raw.embedding)
      ? (raw.embedding as Partial<MemoryConfig["embedding"]>)
      : {};
    const gbrainRaw = isPlainObject(raw.gbrain)
      ? (raw.gbrain as Partial<MemoryConfig["gbrain"]>)
      : {};
    const clawmemRaw = isPlainObject(raw.clawmem)
      ? (raw.clawmem as Partial<MemoryConfig["clawmem"]>)
      : {};
    const searchRaw = isPlainObject(raw.search)
      ? (raw.search as Partial<MemoryConfig["search"]>)
      : {};
    const syncRaw = isPlainObject(raw.sync)
      ? (raw.sync as Partial<MemoryConfig["sync"]>)
      : {};
    const syncCloudRaw =
      isPlainObject(syncRaw.cloud) ? (syncRaw.cloud as Partial<MemoryConfig["sync"]["cloud"]>) : {};
    const loggingRaw = isPlainObject(raw.logging)
      ? (raw.logging as Partial<MemoryConfig["logging"]>)
      : {};
    const mcpServerRaw = isPlainObject(raw.mcp_server)
      ? (raw.mcp_server as Partial<MemoryConfig["mcp_server"]>)
      : {};

    const routingRaw = isPlainObject(raw.routing)
      ? (raw.routing as Partial<NonNullable<MemoryConfig["routing"]>>)
      : {};

    const normalizedRoutingCodeSuffixes = Array.isArray(routingRaw.code_suffixes)
      ? routingRaw.code_suffixes
          .filter((s): s is string => typeof s === "string")
          .map((s) => s.trim())
          .filter(Boolean)
      : defaults.routing?.code_suffixes ?? [];

    const normalizedRoutingRules = normalizeRoutingRules(routingRaw.rules);

    const defaultCasRootPath = defaults.cas?.root_path ?? "~/.hermes/data/memohub-cas";
    const casRaw = isPlainObject(raw.cas)
      ? (raw.cas as Partial<NonNullable<MemoryConfig["cas"]>>)
      : undefined;
    const normalizedCas = casRaw
      ? {
          root_path:
            typeof casRaw.root_path === "string" && String(casRaw.root_path ?? "").trim() !== ""
              ? casRaw.root_path
              : defaultCasRootPath,
        }
      : undefined;

    const normalizedSearchSources = Array.isArray(searchRaw.default_sources)
      ? searchRaw.default_sources.filter((s): s is string => typeof s === "string")
      : defaults.search.default_sources;

    const normalizedEditorMemoryPaths = Array.isArray(syncRaw.editor_memory_paths)
      ? syncRaw.editor_memory_paths.filter((s): s is string => typeof s === "string")
      : defaults.sync.editor_memory_paths;

    return {
      embedding: { ...defaults.embedding, ...embeddingRaw },
      cas: normalizedCas,
      gbrain: { ...defaults.gbrain, ...gbrainRaw },
      clawmem: { ...defaults.clawmem, ...clawmemRaw },
      search: {
        ...defaults.search,
        ...searchRaw,
        default_sources: normalizedSearchSources,
      },
      routing: {
        ...(defaults.routing ?? {
          enabled: true,
          default_track: "gbrain",
          code_suffixes: [],
        }),
        ...(routingRaw ?? {}),
        enabled:
          typeof routingRaw.enabled === "boolean"
            ? routingRaw.enabled
            : defaults.routing?.enabled ?? true,
        default_track:
          typeof routingRaw.default_track === "string" && String(routingRaw.default_track ?? "").trim() !== ""
            ? routingRaw.default_track
            : defaults.routing?.default_track ?? "gbrain",
        code_suffixes: normalizedRoutingCodeSuffixes,
        ...(normalizedRoutingRules ? { rules: normalizedRoutingRules } : {}),
      },
      sync: {
        ...defaults.sync,
        ...syncRaw,
        editor_memory_paths: normalizedEditorMemoryPaths,
        cloud: { ...defaults.sync.cloud, ...syncCloudRaw },
      },
      logging: { ...defaults.logging, ...loggingRaw },
      mcp_server: { ...defaults.mcp_server, ...mcpServerRaw },
    };
  }

  /**
   * 获取默认配置
   */
  private getDefaultConfig(): MemoryConfig {
    return {
      embedding: {
        url: "http://localhost:11434/v1",
        model: "nomic-embed-text-v2-moe",
        dimensions: 768,
        timeout: 30,
      },
      cas: {
        root_path: "~/.hermes/data/memohub-cas",
      },
      routing: {
        enabled: true,
        default_track: "gbrain",
        /**
         * 默认“代码后缀”列表：
         * - 用于路由阶段将带 filePath 的写入推断为代码轨（clawmem）
         * - 这里刻意覆盖常见工程文件类型（包含配置/脚本/文档），便于把“项目相关语料”写入代码轨
         */
        code_suffixes: [
          ".ts",
          ".tsx",
          ".js",
          ".jsx",
          ".mjs",
          ".cjs",
          ".json",
          ".md",
          ".py",
          ".go",
          ".rs",
          ".java",
          ".kt",
          ".swift",
          ".c",
          ".cc",
          ".cpp",
          ".h",
          ".hpp",
          ".cs",
          ".php",
          ".rb",
          ".lua",
          ".sql",
          ".sh",
          ".zsh",
          ".yml",
          ".yaml",
          ".toml",
        ],
      },
      gbrain: {
        db_path: "~/.hermes/data/gbrain.lancedb",
        table_name: "gbrain",
        default_category: "other",
        default_importance: 0.5,
      },
      clawmem: {
        db_path: "~/.hermes/data/clawmem.lancedb",
        table_name: "clawmem",
        default_language: "typescript",
        default_importance: 0.5,
      },
      search: {
        default_sources: ["gbrain", "clawmem"],
        default_limit: 5,
        parallel: true,
        cache_enabled: true,
        cache_path: "~/.hermes/cache/memory-search",
      },
      sync: {
        editor_memory_paths: [
          "~/.claude-code/memory",
          "~/.opencode/memory",
          "~/.trae/memory",
        ],
        interval: 3600,
        cloud: {
          enabled: false,
          provider: "github",
          repo: "your-username/memory-backup",
          branch: "main",
        },
      },
      logging: {
        level: "info",
        file: "~/.hermes/logs/memory-cli.log",
        console: true,
      },
      mcp_server: {
        enabled: true,
        port: 3000,
        transport: "stdio",
        timeout: 30,
      },
    };
  }

  /**
   * 获取配置
   */
  getConfig(): MemoryConfig {
    return this.config;
  }

  /**
   * 获取嵌入模型配置
   */
  getEmbeddingConfig() {
    return this.config.embedding;
  }

  /**
   * 获取 GBrain 配置
   */
  getGBrainConfig() {
    return this.config.gbrain;
  }

  /**
   * 获取 ClawMem 配置
   */
  getClawMemConfig() {
    return this.config.clawmem;
  }

  /**
   * 获取搜索配置
   */
  getSearchConfig() {
    return this.config.search;
  }

  /**
   * 从环境变量覆盖配置
   */
  applyEnvOverrides(): void {
    if (process.env.EMBEDDING_URL) {
      this.config.embedding.url = process.env.EMBEDDING_URL;
    }
    if (process.env.EMBEDDING_MODEL) {
      this.config.embedding.model = process.env.EMBEDDING_MODEL;
    }
    if (process.env.GBRAIN_DB_PATH) {
      this.config.gbrain.db_path = process.env.GBRAIN_DB_PATH;
    }
    if (process.env.CLAWMEM_DB_PATH) {
      this.config.clawmem.db_path = process.env.CLAWMEM_DB_PATH;
    }
    if (process.env.MEMOHUB_CAS_PATH) {
      this.config.cas = this.config.cas ?? { root_path: "~/.hermes/data/memohub-cas" };
      this.config.cas.root_path = process.env.MEMOHUB_CAS_PATH;
    }
    if (process.env.MEMORY_LOG_LEVEL) {
      this.config.logging.level = process.env.MEMORY_LOG_LEVEL;
    }

    /**
     * 路由配置（环境变量覆盖）
     *
     * 设计目标：
     * - 保持“环境变量 > YAML > 默认值”的优先级
     * - 环境变量主要用于容器/CI/多环境部署时快速切换路由策略
     *
     * 支持的环境变量：
     * - MEMOHUB_ROUTING_ENABLED：true/false（或 1/0）
     * - MEMOHUB_ROUTING_DEFAULT_TRACK：默认轨道（如 gbrain）
     * - MEMOHUB_ROUTING_CODE_SUFFIXES：逗号分隔后缀列表（如 ".ts,.py,.md"）
     * - MEMOHUB_ROUTING_RULES：JSON 数组（完整规则覆盖）
     */
    const ensureRouting = () => {
      this.config.routing =
        this.config.routing ??
        this.getDefaultConfig().routing ?? {
          enabled: true,
          default_track: "gbrain",
          code_suffixes: [],
        };
    };

    if (process.env.MEMOHUB_ROUTING_ENABLED) {
      ensureRouting();
      const raw = String(process.env.MEMOHUB_ROUTING_ENABLED ?? "").trim().toLowerCase();
      const truthy = raw === "1" || raw === "true" || raw === "yes" || raw === "on";
      const falsy = raw === "0" || raw === "false" || raw === "no" || raw === "off";
      if (truthy) {
        this.config.routing!.enabled = true;
      } else if (falsy) {
        this.config.routing!.enabled = false;
      }
    }

    if (process.env.MEMOHUB_ROUTING_DEFAULT_TRACK) {
      ensureRouting();
      const track = String(process.env.MEMOHUB_ROUTING_DEFAULT_TRACK ?? "").trim();
      if (track) {
        this.config.routing!.default_track = track;
      }
    }

    if (process.env.MEMOHUB_ROUTING_CODE_SUFFIXES) {
      ensureRouting();
      const suffixes = String(process.env.MEMOHUB_ROUTING_CODE_SUFFIXES ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (suffixes.length > 0) {
        this.config.routing!.code_suffixes = suffixes;
      }
    }

    if (process.env.MEMOHUB_ROUTING_RULES) {
      ensureRouting();
      try {
        const parsed = JSON.parse(String(process.env.MEMOHUB_ROUTING_RULES ?? ""));
        const normalized = normalizeRoutingRules(parsed);
        if (normalized && normalized.length > 0) {
          this.config.routing!.rules = normalized;
        }
      } catch {
        // 配置错误不阻塞启动：保留已有 routing 配置（兼容性优先）
      }
    }
  }

  /**
   * 保存配置到文件
   */
  saveConfig(): void {
    try {
      const expandedPath = this.configPath.replace(/^~/, os.homedir());
      const dir = path.dirname(expandedPath);

      // 确保目录存在
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const yamlString = yaml.stringify(this.config);
      fs.writeFileSync(expandedPath, yamlString, "utf-8");

      console.log(`Config saved to ${expandedPath}`);
    } catch (error) {
      console.error(`Error saving config file:`, error);
      throw error;
    }
  }

  /**
   * 验证配置
   */
  validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 验证嵌入模型配置
    if (!this.config.embedding.url) {
      errors.push("embedding.url is required");
    }
    if (!this.config.embedding.model) {
      errors.push("embedding.model is required");
    }
    if (this.config.embedding.dimensions <= 0) {
      errors.push("embedding.dimensions must be positive");
    }

    if (this.config.cas && !String(this.config.cas.root_path ?? "").trim()) {
      errors.push("cas.root_path is required when cas is enabled");
    }

    // 验证数据库路径
    if (!this.config.gbrain.db_path) {
      errors.push("gbrain.db_path is required");
    }
    if (!this.config.clawmem.db_path) {
      errors.push("clawmem.db_path is required");
    }

    // 验证路由配置（可选）
    if (this.config.routing) {
      const { enabled, default_track, code_suffixes, rules } = this.config.routing;

      if (enabled && !String(default_track ?? "").trim()) {
        errors.push("routing.default_track is required when routing is enabled");
      }

      if (Array.isArray(code_suffixes)) {
        for (const s of code_suffixes) {
          const suffix = String(s ?? "").trim();
          if (!suffix) {
            errors.push("routing.code_suffixes contains empty suffix");
            continue;
          }
          if (!suffix.startsWith(".")) {
            errors.push(`routing.code_suffixes must start with '.': ${suffix}`);
          }
        }
      }

      if (rules != null) {
        if (!Array.isArray(rules)) {
          errors.push("routing.rules must be an array when provided");
        } else {
          for (const rule of rules) {
            const type = (rule as any)?.type;
            if (type !== "file_suffix" && type !== "default") {
              errors.push(`routing.rules has unsupported type: ${String(type)}`);
              continue;
            }
            const track = String((rule as any)?.track ?? "").trim();
            if (!track) {
              errors.push(`routing.rules.${String(type)}.track is required`);
            }
            if (type === "file_suffix") {
              const suffixes = (rule as any)?.suffixes;
              if (!Array.isArray(suffixes) || suffixes.length === 0) {
                errors.push("routing.rules.file_suffix.suffixes must be a non-empty array");
              } else {
                for (const s of suffixes) {
                  const suffix = String(s ?? "").trim();
                  if (!suffix) {
                    errors.push("routing.rules.file_suffix.suffixes contains empty suffix");
                    continue;
                  }
                  if (!suffix.startsWith(".")) {
                    errors.push(`routing.rules.file_suffix.suffixes must start with '.': ${suffix}`);
                  }
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
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeRoutingRules(value: unknown): RoutingRuleConfig[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const normalized: RoutingRuleConfig[] = [];
  for (const item of value) {
    if (!isPlainObject(item)) {
      continue;
    }

    const type = item["type"];
    if (type === "file_suffix") {
      const track = String(item["track"] ?? "").trim();
      const suffixes = Array.isArray(item["suffixes"])
        ? (item["suffixes"] as unknown[]).map((s) => String(s ?? "").trim()).filter(Boolean)
        : [];

      if (!track || suffixes.length === 0) {
        continue;
      }

      const name = typeof item["name"] === "string" ? String(item["name"]).trim() : undefined;
      normalized.push({
        type: "file_suffix",
        ...(name ? { name } : {}),
        track,
        suffixes,
      });
    } else if (type === "default") {
      const track = String(item["track"] ?? "").trim();
      if (!track) {
        continue;
      }
      const name = typeof item["name"] === "string" ? String(item["name"]).trim() : undefined;
      normalized.push({
        type: "default",
        ...(name ? { name } : {}),
        track,
      });
    }
  }

  return normalized.length > 0 ? normalized : undefined;
}
