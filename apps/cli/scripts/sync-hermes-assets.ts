#!/usr/bin/env bun
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

const cliRoot = process.cwd();
const workspaceRoot = resolve(cliRoot, "../..");
const sourceRoot = join(workspaceRoot, "connectors", "hermes", "plugins", "memory", "memohub");
const targetRoot = join(cliRoot, "assets", "hermes", "plugins", "memory", "memohub");

if (!existsSync(sourceRoot)) {
  fail(`Hermes plugin source is missing: ${sourceRoot}`);
}

rmSync(targetRoot, { recursive: true, force: true });
mkdirSync(dirname(targetRoot), { recursive: true });

// CLI 发布包携带一份 Hermes 官方插件模板，安装时先写到 ~/.memohub 再由 Hermes 软链接消费。
cpSync(sourceRoot, targetRoot, {
  recursive: true,
  filter: (path) => {
    const normalized = path.replaceAll("\\", "/");
    return !normalized.includes("__pycache__") && !normalized.endsWith(".pyc");
  },
});

console.log(`Hermes assets ready: ${relative(cliRoot, targetRoot)}`);

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}
