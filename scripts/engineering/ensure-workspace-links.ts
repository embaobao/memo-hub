#!/usr/bin/env bun
import { existsSync, mkdirSync, rmSync, symlinkSync } from "node:fs";
import { dirname, relative } from "node:path";
import { loadWorkspacePackages } from "./workspace";

const root = process.cwd();
const scopeDir = `${root}/node_modules/@memohub`;
mkdirSync(scopeDir, { recursive: true });

for (const pkg of loadWorkspacePackages(root)) {
  if (!pkg.name.startsWith("@memohub/")) continue;

  const linkName = `${scopeDir}/${pkg.name.slice("@memohub/".length)}`;
  if (existsSync(linkName)) rmSync(linkName, { recursive: true, force: true });

  const target = relative(dirname(linkName), pkg.dir);
  symlinkSync(target, linkName, "dir");
}

console.log("Workspace links ensured under node_modules/@memohub.");
