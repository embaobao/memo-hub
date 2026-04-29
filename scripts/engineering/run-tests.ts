#!/usr/bin/env bun
import { existsSync, readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const scope = process.argv[2];
const root = process.cwd();

if (!["unit", "integration", "benchmarks"].includes(scope ?? "")) {
  console.error("Usage: bun run scripts/engineering/run-tests.ts <unit|integration|benchmarks>");
  process.exit(1);
}

const files = collectTestFiles(root).filter((file) => {
  if (scope === "unit") return file.includes("/test/unit/");
  if (scope === "integration") return file.includes("/test/integration/") || file.includes("/test/e2e/");
  return file.includes("/test/benchmarks/");
});

if (files.length === 0) {
  console.log(`No ${scope} tests found.`);
  process.exit(0);
}

const result = spawnSync("bun", ["test", ...files], {
  cwd: root,
  stdio: "inherit",
});

process.exit(result.status ?? 1);

function collectTestFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const files: string[] = [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", "dist", ".git", "openspec"].includes(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...collectTestFiles(path));
    if (entry.isFile() && /\.(test|spec)\.ts$/.test(entry.name)) files.push(path);
  }

  return files;
}
