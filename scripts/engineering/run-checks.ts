#!/usr/bin/env bun
import { spawnSync } from "node:child_process";

const mode = process.argv[2] ?? "local";

const localChecks: [string, string[]][] = [
  ["test layout", ["bun", "run", "scripts/engineering/validate-test-layout.ts"]],
  ["dependency boundaries", ["bun", "run", "scripts/engineering/validate-deps.ts"]],
  ["build", ["bun", "run", "scripts/engineering/workspace-run.ts", "build"]],
  ["typecheck", ["bun", "run", "scripts/engineering/typecheck.ts"]],
  ["unit tests", ["bun", "run", "scripts/engineering/run-tests.ts", "unit"]],
  ["docs check", ["bun", "run", "scripts/engineering/check-docs.ts"]],
];

const releaseChecks: [string, string[]][] = [
  ...localChecks,
  ["integration tests", ["bun", "run", "scripts/engineering/run-tests.ts", "integration"]],
  ["api docs", ["bun", "run", "typedoc"]],
  ["generated docs", ["bun", "run", "scripts/engineering/generate-docs.ts"]],
  ["benchmarks", ["bun", "run", "scripts/engineering/run-tests.ts", "benchmarks"]],
];

const checks = mode === "release" ? releaseChecks : localChecks;
const results: { name: string; status: number | null }[] = [];

for (const [name, command] of checks) {
  console.log(`\n[check] ${name}`);
  const result = spawnSync(command[0], command.slice(1), {
    cwd: process.cwd(),
    stdio: "inherit",
  });
  results.push({ name, status: result.status });
}

console.log("\nVerification summary:");
for (const result of results) {
  const mark = result.status === 0 ? "PASS" : "FAIL";
  console.log(`- ${mark} ${result.name}`);
}

process.exit(results.some((result) => result.status !== 0) ? 1 : 0);
