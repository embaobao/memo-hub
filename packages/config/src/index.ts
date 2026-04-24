import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { parse, stringify } from 'comment-json';
import { MemoHubConfig, MemoHubConfigSchema } from './schema.js';
import { applyEnvOverrides, resolvePath, maskSecrets } from './utils.js';

export * from './schema.js';
export * from './utils.js';

export class ConfigLoader {
  private config: MemoHubConfig;
  private configPath: string;

  constructor(customPath?: string) {
    this.configPath = customPath || process.env.MEMOHUB_CONFIG || '~/.memohub/memohub.json';
    this.config = this.load();
  }

  /**
   * Load and validate configuration.
   */
  public load(): MemoHubConfig {
    const expandedPath = resolvePath(this.configPath);
    let rawConfig: any = {};

    if (fs.existsSync(expandedPath)) {
      try {
        const content = fs.readFileSync(expandedPath, 'utf-8');
        rawConfig = parse(content);
      } catch (error) {
        console.error(`Error parsing JSONC at ${expandedPath}:`, error);
      }
    }

    // Overlay environment variables
    const withEnv = applyEnvOverrides(rawConfig);

    // Validate against schema
    const result = MemoHubConfigSchema.safeParse(withEnv);
    
    if (!result.success) {
      console.error('Configuration validation failed:');
      console.error(result.error.format());
      // Return defaults if validation fails but could potentially throw
      return MemoHubConfigSchema.parse({});
    }

    this.config = result.data;
    return this.config;
  }

  /**
   * Get the current configuration.
   */
  public getConfig(): MemoHubConfig {
    return this.config;
  }

  /**
   * Get a masked version of the config for safe display.
   */
  public getMaskedConfig(): Record<string, any> {
    return maskSecrets(this.config);
  }

  /**
   * Save the current config back to disk as JSONC.
   */
  public save(): void {
    const expandedPath = resolvePath(this.configPath);
    const dir = path.dirname(expandedPath);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const content = stringify(this.config, null, 2);
    fs.writeFileSync(expandedPath, content, 'utf-8');
  }

  /**
   * Initialize a default configuration file.
   */
  public static initDefault(targetPath: string = '~/.memohub/memohub.json'): void {
    const expandedPath = resolvePath(targetPath);
    if (fs.existsSync(expandedPath)) {
      throw new Error(`Configuration file already exists at ${expandedPath}`);
    }

    const loader = new ConfigLoader(targetPath);
    loader.save();
    console.log(`Initialized default configuration at ${expandedPath}`);
  }
}
