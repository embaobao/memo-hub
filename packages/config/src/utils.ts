import pkg from 'lodash';
const { set } = pkg;
import * as os from 'node:os';
import * as path from 'node:path';

/**
 * Apply environment variable overrides using MEMOHUB_ prefix and __ separator.
 * Example: MEMOHUB_AI__AGENTS__EMBEDDER__MODEL=llama3 -> config.ai.agents.embedder.model = "llama3"
 */
export function applyEnvOverrides(config: Record<string, any>): Record<string, any> {
  const result = { ...config };
  const prefix = 'MEMOHUB_';

  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith(prefix) && value !== undefined) {
      const configPath = key
        .slice(prefix.length)
        .toLowerCase()
        .split('__')
        .map(part => {
          // Convert parts back to camelCase or keep as is if it matches expected schema structure
          // This is a simple implementation; ideally, we'd map this perfectly to the schema.
          return part;
        })
        .join('.');

      // Simple type inference for booleans and numbers
      let parsedValue: any = value;
      if (value.toLowerCase() === 'true') parsedValue = true;
      else if (value.toLowerCase() === 'false') parsedValue = false;
      else if (!isNaN(Number(value))) parsedValue = Number(value);

      set(result, configPath, parsedValue);
    }
  }

  return result;
}

/**
 * Resolve XDG paths and home directory tildes.
 */
export function resolvePath(inputPath: string): string {
  if (!inputPath) return inputPath;
  
  if (inputPath.startsWith('~/')) {
    return path.join(os.homedir(), inputPath.slice(2));
  }
  
  return path.resolve(inputPath);
}

/**
 * Mask sensitive fields in the configuration for safe reflection/logging.
 */
export function maskSecrets(config: Record<string, any>): Record<string, any> {
  const masked = JSON.parse(JSON.stringify(config)); // Deep copy
  const secretKeys = ['apikey', 'secret', 'token', 'password'];

  function traverseAndMask(obj: any) {
    if (!obj || typeof obj !== 'object') return;
    
    for (const key of Object.keys(obj)) {
      const lowerKey = key.toLowerCase();
      if (secretKeys.some(sk => lowerKey.includes(sk)) && typeof obj[key] === 'string') {
        obj[key] = '***';
      } else if (typeof obj[key] === 'object') {
        traverseAndMask(obj[key]);
      }
    }
  }

  traverseAndMask(masked);
  return masked;
}

/**
 * Resolve dynamic secrets (env:// prefix) in the configuration.
 */
export function resolveSecrets(config: Record<string, any>): Record<string, any> {
  const result = JSON.parse(JSON.stringify(config));

  function traverseAndResolve(obj: any) {
    if (!obj || typeof obj !== 'object') return;

    for (const key of Object.keys(obj)) {
      if (typeof obj[key] === 'string' && obj[key].startsWith('env://')) {
        const envKey = obj[key].slice(6);
        result[key] = process.env[envKey] || obj[key]; // Fallback to original if env var missing
      } else if (typeof obj[key] === 'object') {
        traverseAndResolve(obj[key]);
      }
    }
  }

  traverseAndResolve(result);
  return result;
}
