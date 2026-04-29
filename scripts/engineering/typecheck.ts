#!/usr/bin/env bun
import { existsSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { loadWorkspacePackages } from "./workspace";

let failed = false;

spawnSync("bun", ["run", "scripts/engineering/ensure-workspace-links.ts"], {
  cwd: process.cwd(),
  stdio: "inherit",
});

for (const pkg of loadWorkspacePackages()) {
  if (!existsSync(join(pkg.dir, "tsconfig.json"))) continue;

  console.log(`\n[typecheck] ${pkg.name}`);
  const result = spawnSync("bunx", ["tsc", "-p", "tsconfig.json", "--noEmit", "--pretty", "false"], {
    cwd: pkg.dir,
    stdio: "inherit",
  });

  if (result.status !== 0) {
    failed = true;
    break;
  }
}

process.exit(failed ? 1 : 0);
