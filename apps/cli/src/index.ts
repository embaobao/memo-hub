#!/usr/bin/env node
// @ts-nocheck
import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import * as path from "node:path";
import * as os from "node:os";

import { MemoryKernel } from "../../../packages/core/src/kernel.ts";
import { MemoOp, MemoErrorCode, InstructionState } from "../../../packages/protocol/src/types.ts";
import { ConfigLoader } from "../../../packages/config/src/index.ts";

// --- 核心资源实现 (用于 DI) ---
import { ContentAddressableStorage } from "../../../packages/storage-flesh/src/index.ts";
import { VectorStorage } from "../../../packages/storage-soul/src/index.ts";
import { OllamaAdapter } from "../../../packages/ai-provider/src/ollama-adapter.ts";

// --- 原子工具 ---
import {
  CasTool,
  VectorTool,
  EmbedderTool,
  RetrieverTool,
  CodeAnalyzerTool,
  GraphStoreTool
} from "../../../packages/builtin-tools/src/index.ts";

// --- 业务轨道 ---
import { InsightTrack } from "../../../tracks/track-insight/src/index.ts";
import { SourceTrack } from "../../../tracks/track-source/src/index.ts";

/**
 * 组装 Memory OS 内核 (Manual Dependency Injection)
 */
export async function createKernel(): Promise<MemoryKernel> {
  const loader = new ConfigLoader();
  const config = loader.getConfig();
  const root = path.resolve(os.homedir(), ".memohub");

  // 1. 创建底层资源
  const cas = new ContentAddressableStorage(path.join(root, "blobs"));
  const vector = new VectorStorage({
    dbPath: path.join(root, "data/memohub.lancedb"),
    tableName: "memohub",
    dimensions: config.ai.agents.embedder?.dimensions || 768,
  });
  const ollama = new OllamaAdapter({
    url: config.ai.providers.find(p => p.type === 'ollama')?.url || "http://localhost:11434/v1",
    embeddingModel: config.ai.agents.embedder?.model || "nomic-embed-text",
    chatModel: config.ai.agents.summarizer?.model || "qwen2.5:7b"
  });

  // 2. 初始化内核并注入资源 (DI)
  const kernel = new MemoryKernel(config);
  kernel.setComponents({
    cas,
    vector,
    embedder: ollama,
    completer: ollama
  });
  await kernel.initialize();

  // 3. 注册原子工具到池中
  const tr = kernel.getToolRegistry();
  tr.register(new CasTool());
  tr.register(new VectorTool());
  tr.register(new EmbedderTool());
  tr.register(new RetrieverTool());
  tr.register(new CodeAnalyzerTool());
  tr.register(new GraphStoreTool(root));

  // 4. 挂载业务轨道
  await kernel.registerTrack(new InsightTrack());
  await kernel.registerTrack(new SourceTrack());

  return kernel;
}

const program = new Command();

program
  .name("memohub")
  .description("MemoHub v1.1 - Memory OS with State Machine and Manual DI")
  .version("1.1.0");

// --- CLI 指令集 ---

program
  .command("inspect")
  .description("Inspect current Memory OS registry and AI resources")
  .action(async () => {
    const kernel = await createKernel();
    const config = kernel.getConfig();
    const tools = kernel.listTools();
    const tracks = await kernel.listTracks();

    console.log(chalk.bold.cyan("\n--- 🧠 MemoHub Memory OS Service Map ---\n"));

    console.log(chalk.bold("1. System Engine:"));
    console.log(` - Root: ${chalk.gray(config.system.root)}`);
    console.log(` - Status: ${chalk.green("Ready")}`);

    console.log(chalk.bold("\n2. Active Tracks (Decoupled Units):"));
    tracks.forEach((t) => console.log(` - [${chalk.green(t.id)}] ${t.name}`));

    console.log(chalk.bold("\n3. Functional Pool (Atomic Tools):"));
    tools.forEach((t) => console.log(` - [${chalk.magenta(t.id)}] ${t.description || "Core Logic"}`));

    console.log(chalk.bold("\n4. AI Compute Resource (Ollama):"));
    console.log(` - Embedder: ${chalk.blue(config.ai.agents.embedder?.model)}`);
    console.log("");
  });

program
  .command("add")
  .description("Inject a new memory into a specific track")
  .argument("<text>", "Text content")
  .option("-t, --track <trackId>", "Target track ID", "track-insight")
  .action(async (text, options) => {
    const spinner = ora("Infecting memory...").start();
    const kernel = await createKernel();
    
    // 监听状态机流转
    kernel.on("dispatch", (ev) => {
       spinner.text = `Executing: ${chalk.yellow(ev.state)}`;
       if (ev.state === InstructionState.FAILED) {
         spinner.fail(chalk.red(`Failed at ${ev.state}: ${ev.error}`));
       }
    });

    const result = await kernel.dispatch({
      op: MemoOp.ADD,
      trackId: options.track,
      payload: { text },
    });

    if (result.success) {
      spinner.succeed(chalk.green(`Memory committed! [Latency: ${result.meta.latencyMs}ms]`));
    }
  });

program
  .command("search")
  .description("Semantic retrieval across memories")
  .argument("<query>", "Natural language query")
  .option("-t, --track <trackId>", "Target track", "track-insight")
  .action(async (query, options) => {
    const spinner = ora("Retrieving...").start();
    const kernel = await createKernel();
    
    const result = await kernel.dispatch({
      op: MemoOp.RETRIEVE,
      trackId: options.track,
      payload: { query, limit: 5 },
    });

    if (result.success) {
      spinner.stop();
      console.log(chalk.blue(`\nFound ${result.data.length} records for: "${query}"\n`));
      result.data.forEach((item, i) => {
        console.log(`${chalk.white(i+1 + '.')} ${chalk.green(item.text)} ${chalk.gray('(' + item.track_id + ')')}`);
      });
    } else {
      spinner.fail(chalk.red(`Error: ${result.error.message}`));
    }
  });

program.parse();
