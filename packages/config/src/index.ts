import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { parse, stringify } from "comment-json";
import { MemoHubConfig, MemoHubConfigSchema } from "./schema.js";
import {
  applyEnvOverrides,
  resolvePath,
  maskSecrets,
  resolveSecrets,
} from "./utils.js";

export * from "./schema.js";
export * from "./utils.js";
export * from "./performance.js";

import pkg from "lodash";
const { mergeWith, isArray, unionBy } = pkg;

export interface EnhancedConfig extends MemoHubConfig {
  _sources?: string[];
}

export class ConfigLoader {
  private config: EnhancedConfig;
  private configPath: string;

  constructor(customPath?: string) {
    this.configPath =
      customPath || process.env.MEMOHUB_CONFIG || "~/.memohub/memohub.json";
    this.config = this.load();
  }

  private mergeStrategy(objValue: any, srcValue: any): any {
    if (isArray(objValue)) {
      if (
        srcValue.length > 0 &&
        srcValue[0] &&
        typeof srcValue[0] === "object" &&
        "id" in srcValue[0]
      ) {
        return unionBy(objValue, srcValue, "id");
      }
      return objValue.concat(srcValue);
    }
  }

  public load(): EnhancedConfig {
    const expandedPath = resolvePath(this.configPath);
    let mainConfig: any = {};
    const sources: string[] = [];

    if (fs.existsSync(expandedPath)) {
      try {
        sources.push(expandedPath);
        const content = fs.readFileSync(expandedPath, "utf-8");
        mainConfig = parse(content);
      } catch (error) {
        console.error(`Error parsing JSONC at ${expandedPath}:`, error);
      }
    }

    const rootDir = path.dirname(expandedPath);
    const subDirs = ["tools", "agents", "ai/providers", "ai/agents"];

    for (const subDir of subDirs) {
      const targetDir = path.join(rootDir, subDir);
      if (fs.existsSync(targetDir)) {
        const files = this.scanDir(targetDir);
        for (const file of files) {
          try {
            sources.push(file);
            const content = fs.readFileSync(file, "utf-8");
            const fragment = parse(content) as any;

            if (subDir === "tools") {
              mainConfig.tools = unionBy(
                mainConfig.tools || [],
                isArray(fragment) ? fragment : [fragment],
                "id",
              );
            } else if (subDir === "agents" || subDir === "ai/agents") {
              mainConfig.ai = mainConfig.ai || {};
              mainConfig.ai.agents = mergeWith(
                mainConfig.ai.agents || {},
                fragment,
                this.mergeStrategy,
              );
            } else if (subDir === "ai/providers") {
              mainConfig.ai = mainConfig.ai || {};
              mainConfig.ai.providers = unionBy(
                mainConfig.ai.providers || [],
                isArray(fragment) ? fragment : [fragment],
                "id",
              );
            }
          } catch (error) {
            console.error(`Error parsing modular config at ${file}:`, error);
          }
        }
      }
    }

    const withEnv = applyEnvOverrides(mainConfig);
    const withSecrets = resolveSecrets(withEnv);
    const result = MemoHubConfigSchema.safeParse(withSecrets);

    if (!result.success) {
      console.error("Configuration validation failed:");
      console.error(result.error.format());
      return { ...MemoHubConfigSchema.parse({}), _sources: sources };
    }

    this.config = { ...result.data, _sources: sources };
    return this.config;
  }

  private scanDir(dir: string): string[] {
    let results: string[] = [];
    if (!fs.existsSync(dir)) return [];
    const list = fs.readdirSync(dir);
    for (const file of list) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat && stat.isDirectory()) {
        results = results.concat(this.scanDir(fullPath));
      } else if (file.endsWith(".json") || file.endsWith(".jsonc")) {
        results.push(fullPath);
      }
    }
    return results;
  }

  public getConfig(): EnhancedConfig {
    return this.config;
  }

  public getMaskedConfig(): Record<string, any> {
    return maskSecrets(this.config);
  }

  public save(): void {
    const expandedPath = resolvePath(this.configPath);
    const dir = path.dirname(expandedPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    // Remove metadata before saving
    const { _sources, ...cleanConfig } = this.config;
    const content = stringify(cleanConfig, null, 2);
    fs.writeFileSync(expandedPath, content, "utf-8");
  }

  public static initDefault(
    targetPath: string = "~/.memohub/memohub.json",
  ): void {
    const expandedPath = resolvePath(targetPath);
    if (fs.existsSync(expandedPath))
      throw new Error(`Configuration file already exists at ${expandedPath}`);

    const rootDir = path.dirname(expandedPath);
    const subDirs = ["tools", "agents", "ai/providers", "ai/agents"];
    for (const subDir of subDirs) {
      const targetDir = path.join(rootDir, subDir);
      if (!fs.existsSync(targetDir))
        fs.mkdirSync(targetDir, { recursive: true });
    }

    const loader = new ConfigLoader(targetPath);
    loader.save();
  }
}
