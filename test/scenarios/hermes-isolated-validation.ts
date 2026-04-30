import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

type JsonResult = Record<string, unknown>;

const workspaceRoot = process.cwd();
const cliEntry = resolve(workspaceRoot, "apps/cli/dist/index.js");

if (!existsSync(cliEntry)) {
  throw new Error("CLI dist is missing. Run `bun run build:cli` before `bun run test:hermes-isolated`.");
}

const sandboxRoot = mkdtempSync(join(tmpdir(), "memohub-hermes-"));
const storageRoot = join(sandboxRoot, "store");
const configPath = join(sandboxRoot, "memohub.json");

mkdirSync(storageRoot, { recursive: true });

const config = {
  configVersion: "unified-memory-1",
  system: {
    root: storageRoot,
    trace_enabled: true,
    log_level: "info",
    lang: "zh",
  },
  storage: {
    root: storageRoot,
    blobPath: join(storageRoot, "blobs"),
    vectorDbPath: join(storageRoot, "data", "memohub.lancedb"),
    vectorTable: "memohub",
    dimensions: 768,
  },
  ai: {
    providers: [
      { id: "local", type: "ollama", url: "http://localhost:11434/v1" },
    ],
    agents: {
      embedder: {
        provider: "local",
        model: "nomic-embed-text-v2-moe",
        dimensions: 768,
      },
      summarizer: {
        provider: "local",
        model: "qwen2.5:7b",
      },
    },
  },
  mcp: {
    enabled: true,
    transport: "stdio",
    logPath: join(storageRoot, "logs", "mcp.ndjson"),
    toolsResourceUri: "memohub://tools",
    statsResourceUri: "memohub://stats",
    exposeToolCatalog: true,
    exposeStatus: true,
  },
  memory: {
    queryLayers: ["self", "project", "global"],
    views: ["agent_profile", "recent_activity", "project_context", "coding_context"],
    operations: ["ingest_event", "query", "summarize", "clarify", "resolve_clarification"],
  },
  tools: [],
  tracks: [],
};

writeFileSync(configPath, JSON.stringify(config, null, 2), "utf8");

const sharedEnv = {
  ...process.env,
  MEMOHUB_CONFIG: configPath,
  MEMOHUB_LANG: "zh",
};

function runMemohub(args: string[], expectJson = false): string | JsonResult {
  const output = execFileSync(process.execPath, [cliEntry, ...args], {
    cwd: workspaceRoot,
    env: sharedEnv,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();

  if (!expectJson) return output;
  return JSON.parse(output) as JsonResult;
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

try {
  const primaryChannel = "hermes:primary:memo-hub";
  const testChannel = "hermes:test:memo-hub:isolated-validation";
  const primaryText = "Hermes isolated primary memory for MemoHub validation";
  const testText = "Hermes isolated test memory for governance listing";

  runMemohub(["config", "show"]);
  runMemohub(["mcp", "tools"]);

  const openedPrimary = runMemohub([
    "channel", "open",
    "--actor", "hermes",
    "--source", "hermes",
    "--project", "memo-hub",
    "--purpose", "primary",
    "--channel", primaryChannel,
    "--json",
  ], true);
  assert(openedPrimary.success === true, "Primary channel open failed.");

  const openedTest = runMemohub([
    "channel", "open",
    "--actor", "hermes",
    "--source", "hermes",
    "--project", "memo-hub",
    "--purpose", "test",
    "--channel", testChannel,
    "--json",
  ], true);
  assert(openedTest.success === true, "Test channel open failed.");

  runMemohub([
    "add",
    primaryText,
    "--project", "memo-hub",
    "--source", "hermes",
    "--channel", primaryChannel,
    "--category", "habit-convention",
  ]);

  runMemohub([
    "add",
    testText,
    "--project", "memo-hub",
    "--source", "hermes",
    "--channel", testChannel,
    "--category", "project-knowledge",
  ]);

  const actorList = runMemohub([
    "list",
    "--perspective", "actor",
    "--actor", "hermes",
    "--limit", "20",
    "--json",
  ], true);
  const actorMemories = Array.isArray(actorList.memories) ? actorList.memories as Array<Record<string, unknown>> : [];
  assert(actorMemories.length >= 2, "Actor perspective should list at least two memories.");
  assert(actorMemories.some((memory) => JSON.stringify(memory).includes(primaryText)), "Primary memory missing from actor list.");
  assert(actorMemories.some((memory) => JSON.stringify(memory).includes(testText)), "Test memory missing from actor list.");

  const projectList = runMemohub([
    "ls",
    "--perspective", "project",
    "--project", "memo-hub",
    "--limit", "20",
    "--json",
  ], true);
  const projectMemories = Array.isArray(projectList.memories) ? projectList.memories as Array<Record<string, unknown>> : [];
  assert(projectMemories.some((memory) => JSON.stringify(memory).includes(testText)), "Project perspective should contain test memory.");

  const queryResult = runMemohub([
    "query",
    testText,
    "--view", "project_context",
    "--actor", "hermes",
    "--project", "memo-hub",
    "--json",
  ], true);
  assert(JSON.stringify(queryResult).includes(testText), "Query should return the isolated test memory.");

  const cleanupPreview = runMemohub([
    "data",
    "clean",
    "--actor", "hermes",
    "--purpose", "test",
    "--dry-run",
    "--json",
  ], true);
  assert(cleanupPreview.success === true, "Test cleanup dry-run failed.");
  assert(Number(cleanupPreview.matchedChannels ?? 0) >= 1, "Test cleanup dry-run should match at least one channel.");
  assert(Number(cleanupPreview.matchedRecords ?? 0) >= 1, "Test cleanup dry-run should match at least one record.");

  console.log(JSON.stringify({
    success: true,
    sandboxRoot,
    configPath,
    storageRoot,
    primaryChannel,
    testChannel,
    actorMemories: actorMemories.length,
    projectMemories: projectMemories.length,
    dryRunMatchedChannels: cleanupPreview.matchedChannels,
    dryRunMatchedRecords: cleanupPreview.matchedRecords,
  }, null, 2));
} finally {
  rmSync(sandboxRoot, { recursive: true, force: true });
}
