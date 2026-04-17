// 配置管理器

import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import * as yaml from "yaml";
import type { MemoryConfig } from "../types/index.js";

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
        return parsed as MemoryConfig;
      } else {
        console.warn(`Config file not found at ${expandedPath}, using defaults`);
        return this.getDefaultConfig();
      }
    } catch (error) {
      console.error(`Error loading config file:`, error);
      return this.getDefaultConfig();
    }
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
    if (process.env.MEMORY_LOG_LEVEL) {
      this.config.logging.level = process.env.MEMORY_LOG_LEVEL;
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

    // 验证数据库路径
    if (!this.config.gbrain.db_path) {
      errors.push("gbrain.db_path is required");
    }
    if (!this.config.clawmem.db_path) {
      errors.push("clawmem.db_path is required");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
