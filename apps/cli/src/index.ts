#!/usr/bin/env node
// @ts-nocheck
import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { MemoryKernel } from "../../../packages/core/src/kernel.ts";
import { MemoOp } from "../../../packages/protocol/src/types.ts";
import { ConfigLoader } from "../../../packages/config/src/index.ts";
import {
  CasTool,
  VectorTool,
  EmbedderTool,
  RetrieverTool,
  RerankerTool,
  AggregatorTool,
  EntityLinkerTool,
  GraphStoreTool,
  CodeAnalyzerTool,
} from "../../../packages/builtin-tools/src/index.ts";
import { DeduplicatorTool } from "../../../packages/librarian/src/tools.ts";

import { InsightTrack } from "../../../tracks/track-insight/src/index.ts";
import { SourceTrack } from "../../../tracks/track-source/src/index.ts";
import { StreamTrack } from "../../../tracks/track-stream/src/index.ts";
import { WikiTrack } from "../../../tracks/track-wiki/src/index.ts";

export async function createKernel(): Promise<MemoryKernel> {
  const loader = new ConfigLoader();
  const config = loader.getConfig();

  const kernel = new MemoryKernel(config);
  await kernel.initialize();

  // 注册原子工具
  const tr = kernel.getToolRegistry();
  tr.register(new CasTool());
  tr.register(new VectorTool());
  tr.register(new EmbedderTool());
  tr.register(new RetrieverTool());
  tr.register(new RerankerTool());
  tr.register(new AggregatorTool());
  tr.register(new EntityLinkerTool());
  tr.register(new CodeAnalyzerTool());
  tr.register(new GraphStoreTool(config.system.root));
  tr.register(new DeduplicatorTool() as any);

  // 编程式注册内置轨道
  await kernel.registerTrack(new InsightTrack());
  await kernel.registerTrack(new SourceTrack());
  await kernel.registerTrack(new StreamTrack());
  await kernel.registerTrack(new WikiTrack());

  return kernel;
}

const program = new Command();

program
  .name("memohub")
  .description("MemoHub v1 - Personal Agent Memory System")
  .version("1.0.0");

// 1. UI 指令
program
  .command("ui")
  .description("Start MemoHub Web Console")
  .action(async () => {
    const { startApiServer } = await import("./api.ts");
    const kernel = await createKernel();
    await startApiServer(kernel);
  });

// 2. Add 指令 (添加记忆)
program
  .command("add")
  .description("Add a new memory record")
  .argument("<text>", "Text content to remember")
  .option("-t, --track <trackId>", "Target track ID", "track-insight")
  .action(async (text, options) => {
    const spinner = ora("Injecting memory...").start();
    try {
      const kernel = await createKernel();
      const result = await kernel.dispatch({
        op: "ADD" as any,
        trackId: options.track,
        payload: { text },
      });
      if (result.success) {
        spinner.succeed(
          chalk.green(`Memory injected! [Trace: ${result.meta?.traceId}]`),
        );
        console.log(chalk.gray(`Hash: ${result.data?.hash || "N/A"}`));
      } else {
        spinner.fail(chalk.red(`Failed: ${result.error}`));
      }
    } catch (e: any) {
      spinner.fail(chalk.red(`Error: ${e.message}`));
    }
  });

// 3. Retrieve 指令 (检索记忆)
program
  .command("retrieve")
  .alias("search")
  .description("Search memories by semantic query")
  .argument("<query>", "Natural language query")
  .option("-t, --track <trackId>", "Target track ID", "track-insight")
  .option("-l, --limit <number>", "Max results", "5")
  .action(async (query, options) => {
    const spinner = ora("Searching...").start();
    try {
      const kernel = await createKernel();
      const result = await kernel.dispatch({
        op: "RETRIEVE" as any,
        trackId: options.track,
        payload: { query, limit: parseInt(options.limit) },
      });
      if (result.success) {
        spinner.stop();
        const items = Array.isArray(result.data)
          ? result.data
          : result.data?.results || [];
        console.log(
          chalk.blue(`\nFound ${items.length} memories for: "${query}"\n`),
        );
        items.forEach((item: any, i: number) => {
          const text = item.text || "[No Content]";
          const entities = Array.isArray(item.entities) ? item.entities : [];
          console.log(chalk.white(`${i + 1}. `) + chalk.green(text));
          if (entities.length > 0)
            console.log(chalk.gray(`   Entities: ${entities.join(", ")}`));
          console.log(
            chalk.gray(`   Source: ${item.track_id || options.track}\n`),
          );
        });
      } else {
        spinner.fail(chalk.red(`Search failed: ${result.error}`));
      }
    } catch (e: any) {
      spinner.fail(chalk.red(`Error: ${e.message}`));
    }
  });

// 4. MCP 指令 (启动 MCP 服务器)
program
  .command("mcp")
  .description("Run as MCP Server for IDEs/Agents")
  .action(async () => {
    console.log(chalk.cyan("Starting MemoHub MCP Server..."));
    const { runMcpServer } = await import("./mcp.ts");
    const kernel = await createKernel();
    await runMcpServer(kernel);
  });

// 5. Inspect 指令 (状态检查)
program
  .command("inspect")
  .description("Inspect current kernel status and configurations")
  .action(async () => {
    const kernel = await createKernel();
    const config = kernel.getConfig();
    const tools = await kernel.listTools();
    const tracks = await kernel.listTracks();

    console.log(chalk.bold.underline("\n--- MemoHub Kernel Status ---\n"));
    console.log(chalk.blue("System Root: ") + config.system.root);
    console.log(
      chalk.blue("AI Provider: ") + Object.keys(config.ai.providers).join(", "),
    );
    console.log(chalk.blue("\nRegistered Tracks:"));
    tracks.forEach((t) =>
      console.log(` - ${chalk.green(t.id)} (${t.name || "Unnamed"})`),
    );
    console.log(chalk.blue("\nAtomic Tools:"));
    tools.forEach((t) =>
      console.log(` - ${chalk.magenta(t.id)}: ${t.description}`),
    );
    console.log("");
  });

program.parse();
