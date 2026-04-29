#!/usr/bin/env bun
import { readdirSync, statSync } from "node:fs";
import { relative, sep } from "node:path";

const root = process.cwd();
const scanRoots = ["apps", "packages", "tracks", "test", "scripts"];
const testFilePattern = /\.(test|spec)\.ts$/;
const errors: string[] = [];

function walk(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", "dist", ".git"].includes(entry.name)) continue;
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) files.push(...walk(path));
    if (entry.isFile() && testFilePattern.test(entry.name)) files.push(path);
  }
  return files;
}

function isAllowedTestPath(path: string): boolean {
  const parts = path.split(sep);
  if (parts[0] === "test") return true;
  if (["apps", "packages", "tracks"].includes(parts[0]) && parts[2] === "test") return true;
  return false;
}

for (const scanRoot of scanRoots) {
  const absoluteRoot = `${root}/${scanRoot}`;
  try {
    statSync(absoluteRoot);
  } catch {
    continue;
  }

  for (const file of walk(absoluteRoot)) {
  const rel = relative(root, file);
  const parts = rel.split(sep);

  if (parts.includes("src")) {
    errors.push(`test file under src is not allowed: ${rel}`);
  }

  if (!isAllowedTestPath(rel)) {
    errors.push(`test file outside approved test layout: ${rel}`);
  }

  if (["apps", "packages", "tracks"].includes(parts[0]) && parts[2] === "test") {
    const subtype = parts[3];
    if (!["unit", "integration", "e2e", "benchmarks", "fixtures", "utils"].includes(subtype)) {
      errors.push(`package test must be grouped by type: ${rel}`);
    }
  }
  }
}

if (errors.length > 0) {
  console.error("Test layout validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Test layout validation passed.");
