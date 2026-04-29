#!/usr/bin/env bun
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const docsDir = join(root, "docs");
const generatedDir = join(root, "docs/generated");
const requiredGeneratedFiles = [
  "README.md",
  "cli-reference.md",
  "mcp-reference.md",
  "package-index.md",
  "openspec-index.md",
];
const errors: string[] = [];

for (const file of requiredGeneratedFiles) {
  if (!existsSync(join(generatedDir, file))) {
    errors.push(`missing generated doc: docs/generated/${file}`);
  }
}

const temp = mkdtempSync(join(tmpdir(), "memohub-docs-"));
const result = spawnSync("bun", ["run", "scripts/engineering/generate-docs.ts"], {
  cwd: root,
  env: { ...process.env },
  stdio: "pipe",
});
rmSync(temp, { recursive: true, force: true });

if (result.status !== 0) {
  errors.push("docs generation failed");
}

for (const file of listMarkdownFiles(docsDir)) validateMarkdownLinks(file);

if (errors.length > 0) {
  console.error("Documentation validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Documentation validation passed.");

function validateMarkdownLinks(file: string): void {
  const content = readFileSync(file, "utf8");
  const linkPattern = /\[[^\]]+\]\(([^)]+)\)/g;

  for (const match of content.matchAll(linkPattern)) {
    const target = match[1];
    if (/^(https?:|mailto:|#|memohub:)/.test(target)) continue;
    const cleanTarget = target.split("#")[0];
    if (!cleanTarget) continue;
    const absoluteTarget = resolve(dirname(file), cleanTarget);
    if (!isWithinDocs(absoluteTarget)) {
      errors.push(`${file.replace(`${root}/`, "")} links outside published docs: ${target}`);
      continue;
    }
    if (!existsSync(absoluteTarget)) {
      errors.push(`${file.replace(`${root}/`, "")} has broken link: ${target}`);
    }
  }
}

function listMarkdownFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listMarkdownFiles(path));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".md")) files.push(path);
  }
  return files;
}

function isWithinDocs(path: string): boolean {
  const relativePath = relative(docsDir, path);
  return relativePath === "" || (!relativePath.startsWith("..") && !relativePath.startsWith("/"));
}
