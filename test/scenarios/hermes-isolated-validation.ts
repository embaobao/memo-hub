import { execFile } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:http";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { promisify } from "node:util";

type JsonResult = Record<string, unknown>;
const execFileAsync = promisify(execFile);

const workspaceRoot = process.cwd();
const cliEntry = resolve(workspaceRoot, "apps/cli/dist/index.js");

if (!existsSync(cliEntry)) {
  throw new Error("CLI dist is missing. Run `bun run build:cli` before `bun run test:hermes-isolated`.");
}

async function runMemohub(args: string[], expectJson = false): Promise<string | JsonResult> {
  const { stdout } = await execFileAsync(process.execPath, [cliEntry, ...args], {
    cwd: workspaceRoot,
    env: currentEnv,
    encoding: "utf8",
  });
  const output = stdout.trim();

  if (!expectJson) return output;
  return JSON.parse(output) as JsonResult;
}

function resolveHermesPythonCommand(): string[] {
  const hermesExecutable = process.env.HERMES_BIN ?? "hermes";
  const scriptPath = hermesExecutable.includes("/")
    ? hermesExecutable
    : Bun.which(hermesExecutable);
  assert(scriptPath, "Hermes executable is not available on PATH.");

  const firstLine = readFileSync(scriptPath, "utf8").split(/\r?\n/u, 1)[0]?.trim();
  assert(firstLine?.startsWith("#!"), "Hermes executable does not expose a Python shebang.");

  return firstLine.slice(2).trim().split(/\s+/u).filter(Boolean);
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function createDeterministicEmbedding(text: string, dimensions: number): number[] {
  const seed = Array.from(text).reduce((value, char, index) => value + char.charCodeAt(0) * (index + 1), 17);
  return Array.from({ length: dimensions }, (_, index) => Number((((seed + index * 13) % 997) / 997).toFixed(6)));
}

const aiServer = createServer(async (request, response) => {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.from(chunk));
  const body = chunks.length > 0 ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {};

  if (request.url === "/v1/embeddings") {
    const input = typeof body.input === "string" ? body.input : JSON.stringify(body.input ?? "");
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(JSON.stringify({
      data: [{ embedding: createDeterministicEmbedding(input, 768) }],
    }));
    return;
  }

  if (request.url === "/v1/chat/completions") {
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(JSON.stringify({
      choices: [{ message: { content: "mock summary" } }],
    }));
    return;
  }

  response.writeHead(404, { "Content-Type": "application/json" });
  response.end(JSON.stringify({ error: "not_found" }));
});

let currentEnv: NodeJS.ProcessEnv = process.env;

async function main() {
  aiServer.listen(0, "127.0.0.1");
  await once(aiServer, "listening");
  const address = aiServer.address();
  if (!address || typeof address === "string") {
    throw new Error("Failed to start deterministic AI mock server.");
  }

  const sandboxRoot = mkdtempSync(join(tmpdir(), "memohub-hermes-"));
  const storageRoot = join(sandboxRoot, "store");
  const configPath = join(sandboxRoot, "memohub.json");
  const hermesHome = join(sandboxRoot, ".hermes");
  const binRoot = join(sandboxRoot, "bin");
  mkdirSync(storageRoot, { recursive: true });
  mkdirSync(binRoot, { recursive: true });

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
        { id: "local", type: "ollama", url: `http://127.0.0.1:${address.port}/v1` },
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
      operations: ["ingest", "query", "summarize", "clarification_create", "clarification_resolve"],
    },
    tools: [],
    tracks: [],
  };

  writeFileSync(configPath, JSON.stringify(config, null, 2), "utf8");
  const memohubShim = join(binRoot, "memohub");
  writeFileSync(
    memohubShim,
    `#!/bin/sh\nexec "${process.execPath}" "${cliEntry}" "$@"\n`,
    "utf8",
  );
  chmodSync(memohubShim, 0o755);

  currentEnv = {
    ...process.env,
    MEMOHUB_CONFIG: configPath,
    MEMOHUB_LANG: "zh",
    PATH: `${binRoot}:${process.env.PATH ?? ""}`,
  };

  const primaryChannel = "hermes:primary:memo-hub";
  const testChannel = "hermes:test:memo-hub:isolated-validation";
  const primaryText = "Hermes isolated primary memory for MemoHub validation";
  const testText = "Hermes isolated test memory for governance listing";

  try {
    await runMemohub(["config", "show"]);
    await runMemohub(["mcp", "tools"]);

    const hermesInstall = await runMemohub([
      "hermes",
      "install",
      "--hermes-home",
      hermesHome,
      "--project",
      "memo-hub",
      "--json",
    ], true);
    assert(hermesInstall.success === true, "Hermes install should succeed.");

    const hermesDoctor = await runMemohub([
      "hermes",
      "doctor",
      "--hermes-home",
      hermesHome,
      "--json",
    ], true);
    assert(hermesDoctor.success === true, "Hermes doctor should succeed in isolated mode.");

    const hermesPython = resolveHermesPythonCommand();
    const hermesPluginValidation = await execFileAsync(
      hermesPython[0],
      [
        ...hermesPython.slice(1),
        "-c",
        [
          "import json",
          "from plugins.memory import discover_memory_providers, load_memory_provider",
          "providers = [name for name, _, _ in discover_memory_providers()]",
          "provider = load_memory_provider('memohub')",
          "assert provider is not None, 'memohub provider not loaded'",
          "init = provider.initialize('hermes-isolated', project_id='memo-hub', hermes_home=r'" + hermesHome.replaceAll("\\", "\\\\") + "')",
          "prefetch = provider.prefetch('current memory state')",
          "sync = provider.sync_turn('以后都先查自己记忆', '收到，写入长期偏好', {'project_id': 'memo-hub', 'session_id': 'hermes-isolated'})",
          "future = getattr(provider, '_last_sync_future', None)",
          "future.result(timeout=5) if future else None",
          "print(json.dumps({'providers': providers, 'init': init, 'prefetch': prefetch, 'sync': sync}, ensure_ascii=False))",
        ].join("; "),
      ],
      {
        cwd: workspaceRoot,
        env: {
          ...currentEnv,
          HERMES_HOME: hermesHome,
        },
        encoding: "utf8",
      },
    );
    const hermesPluginResult = JSON.parse(hermesPluginValidation.stdout.trim()) as Record<string, unknown>;
    assert(Array.isArray(hermesPluginResult.providers) && hermesPluginResult.providers.includes("memohub"), "Hermes should discover memohub provider.");
    assert(JSON.stringify(hermesPluginResult.prefetch).includes("channelId"), "Hermes provider prefetch should return channel summary.");

    const openedPrimary = await runMemohub([
      "channel", "open",
      "--actor", "hermes",
      "--source", "hermes",
      "--project", "memo-hub",
      "--purpose", "primary",
      "--channel", primaryChannel,
      "--json",
    ], true);
    assert(openedPrimary.success === true, "Primary channel open failed.");

    const openedTest = await runMemohub([
      "channel", "open",
      "--actor", "hermes",
      "--source", "hermes",
      "--project", "memo-hub",
      "--purpose", "test",
      "--channel", testChannel,
      "--json",
    ], true);
    assert(openedTest.success === true, "Test channel open failed.");

    const primaryWrite = await runMemohub([
      "add",
      primaryText,
      "--project", "memo-hub",
      "--source", "hermes",
      "--channel", primaryChannel,
      "--category", "habit-convention",
      "--json",
    ], true);
    assert(primaryWrite.success === true, "Primary memory write failed.");

    const testWrite = await runMemohub([
      "add",
      testText,
      "--project", "memo-hub",
      "--source", "hermes",
      "--channel", testChannel,
      "--category", "project-knowledge",
      "--json",
    ], true);
    assert(testWrite.success === true, "Test memory write failed.");

    const actorList = await runMemohub([
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

    const projectList = await runMemohub([
      "ls",
      "--perspective", "project",
      "--project", "memo-hub",
      "--limit", "20",
      "--json",
    ], true);
    const projectMemories = Array.isArray(projectList.memories) ? projectList.memories as Array<Record<string, unknown>> : [];
    assert(projectMemories.some((memory) => JSON.stringify(memory).includes(testText)), "Project perspective should contain test memory.");

    const queryResult = await runMemohub([
      "query",
      testText,
      "--view", "project_context",
      "--actor", "hermes",
      "--project", "memo-hub",
      "--json",
    ], true);
    assert(JSON.stringify(queryResult).includes(testText), "Query should return the isolated test memory.");

    const logResult = await runMemohub([
      "logs",
      "query",
      "--tail", "50",
      "--project", "memo-hub",
      "--json",
    ], true);
    const logEntries = Array.isArray(logResult.entries) ? logResult.entries as Array<Record<string, unknown>> : [];
    assert(logEntries.some((entry) => entry.event === "cli.add.result"), "Logs should contain CLI write result.");
    assert(logEntries.some((entry) => entry.event === "cli.query.result"), "Logs should contain CLI query result.");
    assert(logEntries.some((entry) => entry.event === "cli.list.result"), "Logs should contain CLI list result.");

    const cleanupPreview = await runMemohub([
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

    const cleanupConfirmed = await runMemohub([
      "data",
      "clean",
      "--actor", "hermes",
      "--purpose", "test",
      "--yes",
      "--confirm", "DELETE_MEMOHUB_DATA",
      "--json",
    ], true);
    assert(cleanupConfirmed.success === true, "Confirmed test cleanup failed.");
    assert(Number(cleanupConfirmed.matchedChannels ?? 0) >= 1, "Confirmed cleanup should still target test channels.");
    assert(Number(cleanupConfirmed.matchedRecords ?? 0) >= 1, "Confirmed cleanup should delete at least one test record.");

    const actorListAfterClean = await runMemohub([
      "list",
      "--perspective", "actor",
      "--actor", "hermes",
      "--limit", "20",
      "--json",
    ], true);
    const actorMemoriesAfterClean = Array.isArray(actorListAfterClean.memories)
      ? actorListAfterClean.memories as Array<Record<string, unknown>>
      : [];
    assert(actorMemoriesAfterClean.some((memory) => JSON.stringify(memory).includes(primaryText)), "Primary memory should remain after confirmed test cleanup.");
    assert(!actorMemoriesAfterClean.some((memory) => JSON.stringify(memory).includes(testText)), "Confirmed test cleanup should remove the test memory.");

    console.log(JSON.stringify({
      success: true,
      sandboxRoot,
      configPath,
      storageRoot,
      hermesHome,
      primaryChannel,
      testChannel,
      actorMemories: actorMemories.length,
      actorMemoriesAfterClean: actorMemoriesAfterClean.length,
      projectMemories: projectMemories.length,
      logEntries: logEntries.length,
      dryRunMatchedChannels: cleanupPreview.matchedChannels,
      dryRunMatchedRecords: cleanupPreview.matchedRecords,
      cleanMatchedChannels: cleanupConfirmed.matchedChannels,
      cleanMatchedRecords: cleanupConfirmed.matchedRecords,
    }, null, 2));
  } finally {
    rmSync(sandboxRoot, { recursive: true, force: true });
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  })
  .finally(async () => {
    aiServer.close();
    await once(aiServer, "close").catch(() => undefined);
  });
