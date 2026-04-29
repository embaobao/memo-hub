#!/usr/bin/env bun
import { chmodSync, existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const packageDir = process.cwd();
const packageJsonPath = join(packageDir, "package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
const binPath = packageJson.bin?.memohub;

if (binPath !== "dist/index.js") {
  fail(`Expected bin.memohub to be "dist/index.js", got "${binPath}".`);
}

const entryPath = join(packageDir, binPath);
if (!existsSync(entryPath)) {
  fail(`CLI entry is missing: ${entryPath}`);
}

const entry = readFileSync(entryPath, "utf8");
if (!entry.startsWith("#!/usr/bin/env node")) {
  fail(`CLI entry must keep the node shebang: ${entryPath}`);
}

const invalidImports = findJsFiles(join(packageDir, "dist"))
  .flatMap((file) => {
    const content = readFileSync(file, "utf8");
    return /(?:from|import)\s*\(?["'][^"']+\.ts["']/.test(content) ? [relative(packageDir, file)] : [];
  });

if (invalidImports.length > 0) {
  fail(`Compiled CLI output still imports .ts files: ${invalidImports.join(", ")}`);
}

// CLI 包自己负责 bin 可执行性，根目录只负责聚合触发。
chmodSync(entryPath, 0o755);
console.log(`CLI bin ready: ${relative(packageDir, entryPath)}`);

function findJsFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) results.push(...findJsFiles(fullPath));
    else if (entry.endsWith(".js")) results.push(fullPath);
  }
  return results;
}

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}
