#!/usr/bin/env bun
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const errors: string[] = [];
const importPattern = /(?:import|export)\s+(?:[^'"]+\s+from\s+)?["']([^"']+)["']|require\(["']([^"']+)["']\)/g;

function walk(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", "dist"].includes(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(path));
    if (entry.isFile() && entry.name.endsWith(".ts")) files.push(path);
  }
  return files;
}

function readImports(file: string): string[] {
  const source = readFileSync(file, "utf8");
  const imports: string[] = [];
  for (const match of source.matchAll(importPattern)) {
    imports.push(match[1] || match[2]);
  }
  return imports;
}

for (const file of walk(join(root, "packages"))) {
  const rel = relative(root, file);
  for (const specifier of readImports(file)) {
    if (specifier.startsWith("../../apps/") || specifier.startsWith("@memohub/cli")) {
      errors.push(`${rel} imports app code via ${specifier}`);
    }
  }
}

for (const file of walk(join(root, "packages/core/src"))) {
  const rel = relative(root, file);
  for (const specifier of readImports(file)) {
    if (specifier.startsWith("@memohub/builtin-tools") || specifier.includes("packages/builtin-tools")) {
      errors.push(`${rel} imports concrete built-in tools via ${specifier}`);
    }
  }
}

const protocolPackage = JSON.parse(readFileSync(join(root, "packages/protocol/package.json"), "utf8"));
const protocolDeps = Object.keys(protocolPackage.dependencies ?? {});
const approvedProtocolDeps = new Set(["zod"]);
for (const dep of protocolDeps) {
  if (!approvedProtocolDeps.has(dep)) {
    errors.push(`packages/protocol has unapproved dependency: ${dep}`);
  }
}

if (errors.length > 0) {
  console.error("Dependency boundary validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Dependency boundary validation passed.");
