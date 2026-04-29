#!/usr/bin/env bun
import { spawnSync } from "node:child_process";
import { loadWorkspacePackages } from "./workspace";

const command = process.argv[2];

if (!command) {
  console.error("Usage: bun run scripts/engineering/workspace-run.ts <script>");
  process.exit(1);
}

const packages = loadWorkspacePackages();
let failed = false;

spawnSync("bun", ["run", "scripts/engineering/ensure-workspace-links.ts"], {
  cwd: process.cwd(),
  stdio: "inherit",
});

for (const pkg of packages) {
  if (!pkg.packageJson.scripts?.[command]) continue;

  console.log(`\n[workspace:${command}] ${pkg.name}`);
  const result = spawnSync("bun", ["run", command], {
    cwd: pkg.dir,
    stdio: "inherit",
  });

  if (result.status !== 0) {
    failed = true;
    break;
  }
}

process.exit(failed ? 1 : 0);
