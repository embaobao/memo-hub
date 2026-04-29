#!/usr/bin/env node
// @ts-nocheck
import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";

import { ConfigLoader } from "@memohub/config";
import { EventSource, EventConfidence } from "@memohub/protocol";

import { ContentAddressableStorage } from "@memohub/storage-flesh";
import { VectorStorage } from "@memohub/storage-soul";
import { OllamaAdapter } from "@memohub/ai-provider";
import { runMcpServer } from "./mcp.js";
import {
  ingestMemory,
  queryMemoryView,
  runAgentOperation,
} from "./memory-interface.js";
import { CLI_COMMANDS, CLI_METADATA } from "./interface-metadata.js";
import { UnifiedMemoryRuntime } from "./unified-memory-runtime.js";
import { createMcpAccessCatalog, createMcpClientConfig } from "./mcp/catalog.js";
import { McpLogger } from "./mcp/logger.js";
import { loadRuntimeConfig } from "./runtime-config.js";
import {
  ensureGlobalConfig,
  getConfigValue,
  resetGlobalConfig,
  runMcpDoctor,
  uninstallGlobalConfig,
  writeConfigValue,
} from "./config-commands.js";
import { resolveLang, t, type CliLang } from "./i18n.js";

const cliCommand = (name: string) => {
  const command = CLI_COMMANDS.find((item) => item.name === name);
  if (!command) throw new Error(`Missing CLI metadata for ${name}`);
  return command;
};

function currentLang(input?: string): CliLang {
  try {
    const configured = new ConfigLoader().getConfig().system?.lang;
    return resolveLang(input, configured);
  } catch {
    return resolveLang(input);
  }
}

function ensureConfigBeforeCommand(commandName?: string): void {
  if (!["config-init", "config-uninstall"].includes(commandName ?? "")) {
    ensureGlobalConfig();
  }
}

function printJsonOrText(value: unknown, asJson?: boolean): void {
  if (asJson) console.log(JSON.stringify(value, null, 2));
}

function printRuntimeConfigSummary(config = loadRuntimeConfig(), lang: CliLang): void {
  console.log(chalk.bold.cyan(t(lang, "configTitle")));
  console.log(`${t(lang, "configVersion")}: ${config.configVersion}`);
  console.log(`${t(lang, "root")}: ${config.root}`);
  console.log(`${t(lang, "vectorDb")}: ${config.storage.vectorDbPath}`);
  console.log(`${t(lang, "table")}: ${config.storage.vectorTable}`);
  console.log(`${t(lang, "blob")}: ${config.storage.blobPath}`);
  console.log(`${t(lang, "embedder")}: ${config.ai.embeddingModel} (${config.ai.dimensions})`);
  console.log(`${t(lang, "mcpLog")}: ${config.mcp.logPath}`);
  console.log(`${t(lang, "views")}: ${config.memory.views.join(", ")}`);
  console.log(`${t(lang, "operations")}: ${config.memory.operations.join(", ")}`);
}

function printMcpToolsSummary(catalog: ReturnType<typeof createMcpAccessCatalog>, lang: CliLang): void {
  console.log(chalk.bold.cyan(t(lang, "mcpCatalogTitle")));
  console.log(`${t(lang, "command")}: ${catalog.command} ${catalog.args.join(" ")}`);
  console.log(`${t(lang, "tools")}: ${catalog.tools.map((tool) => tool.name).join(", ")}`);
  console.log(`${t(lang, "resources")}: ${catalog.resources.map((resource) => resource.uri).join(", ")}`);
  console.log(`${t(lang, "views")}: ${catalog.views.join(", ")}`);
  console.log(`${t(lang, "mcpLog")}: ${catalog.storage.logPath}`);
  console.log(t(lang, "agentHint"));
}

function printDoctorSummary(result: Awaited<ReturnType<typeof runMcpDoctor>>, lang: CliLang): void {
  console.log(chalk.bold.cyan(t(lang, "mcpDoctorTitle")));
  for (const check of result.checks) {
    const mark = check.ok ? chalk.green(t(lang, "passed")) : chalk.red(t(lang, "failed"));
    console.log(`${mark} ${check.name}`);
  }
  console.log(`${t(lang, "status")}: ${result.ok ? chalk.green(t(lang, "accessible")) : chalk.red(t(lang, "inaccessible"))}`);
}

/**
 * 组装新架构运行时。
 *
 * 边界约束：
 * - CLI/MCP 只依赖统一记忆运行时，不注册 track provider。
 * - 写入链路是 event -> MemoryObject -> storage projection。
 * - 查询链路是 view -> self/project/global recall -> ContextView。
 */
export async function createRuntime(): Promise<UnifiedMemoryRuntime> {
  const loader = new ConfigLoader();
  const runtimeConfig = loadRuntimeConfig(loader);

  // 第一步：创建统一记忆运行时使用的共享存储。
  const cas = new ContentAddressableStorage(runtimeConfig.storage.blobPath);
  const vector = new VectorStorage({
    dbPath: runtimeConfig.storage.vectorDbPath,
    tableName: runtimeConfig.storage.vectorTable,
    dimensions: runtimeConfig.storage.dimensions,
  });
  const ollama = new OllamaAdapter({
    url: runtimeConfig.ai.providerUrl,
    embeddingModel: runtimeConfig.ai.embeddingModel,
    chatModel: runtimeConfig.ai.chatModel
  });

  // 第二步：初始化统一运行时，CLI/MCP 后续只通过标准入口访问它。
  const runtime = new UnifiedMemoryRuntime({ cas, vector, embedder: ollama, runtimeConfig });
  await runtime.initialize();
  return runtime;
}

const program = new Command();

program
  .name(CLI_METADATA.name)
  .description(CLI_METADATA.description)
  .version(CLI_METADATA.version);

program.option("--lang <lang>", "Output language: zh or en");
program.hook("preAction", (thisCommand, actionCommand) => {
  ensureConfigBeforeCommand(actionCommand.name());
});

// --- CLI 指令集 ---

program
  .command(cliCommand("inspect").name)
  .description(cliCommand("inspect").description)
  .option("--json", "Output raw JSON")
  .action(async (options) => {
    const lang = currentLang(program.opts().lang);
    const runtime = await createRuntime();
    const serviceMap = await runtime.inspect();

    if (options.json) {
      console.log(JSON.stringify(serviceMap, null, 2));
      return;
    }
    console.log(chalk.bold.cyan(t(lang, "runtimeTitle")));
    console.log(`${t(lang, "runtime")}: ${serviceMap.runtime}`);
    console.log(`${t(lang, "model")}: ${serviceMap.model}`);
    console.log(`${t(lang, "stores")}: ${serviceMap.stores.join(", ")}`);
    console.log(`${t(lang, "layers")}: ${serviceMap.queryLayers.join(" -> ")}`);
    console.log(`${t(lang, "views")}: ${serviceMap.views.join(", ")}`);
    console.log(`${t(lang, "operations")}: ${serviceMap.agentOperations.join(", ")}`);
  });

program
  .command(cliCommand("add").name)
  .description(cliCommand("add").description)
  .argument("<text>", "Text content")
  .option("--project <projectId>", "Current project", "default")
  .option("--source <source>", "Source descriptor id", "cli")
  .option("--category <category>", "Memory category/domain hint")
  .option("--file <filePath>", "Related source file path")
  .action(async (text, options) => {
    const lang = currentLang(program.opts().lang);
    const spinner = ora(lang === "zh" ? "正在写入记忆..." : "Processing memory...").start();
    const runtime = await createRuntime();

    const result = await ingestMemory(runtime, {
      text,
      source: EventSource.CLI,
      channel: options.source,
      projectId: options.project,
      confidence: EventConfidence.REPORTED,
      filePath: options.file,
      category: options.category,
      metadata: {
        sourceId: options.source,
        timestamp: new Date().toISOString()
      }
    });

    if (result.success) {
      spinner.succeed(chalk.green(`${t(lang, "memoryCommitted")}: ${result.eventId}, Hash: ${result.contentHash?.slice(0, 8)}...`));
    } else {
      spinner.fail(chalk.red(`${t(lang, "failedPrefix")}: ${result.error}`));
    }
  });

program
  .command(cliCommand("query").name)
  .description(cliCommand("query").description)
  .argument("<query>", "Natural language query")
  .option("--view <view>", "Named context view", "project_context")
  .option("--actor <actorId>", "Requesting agent or actor")
  .option("--project <projectId>", "Current project", "default")
  .option("--limit <limit>", "Per-layer result limit", "5")
  .action(async (query, options) => {
    const lang = currentLang(program.opts().lang);
    const spinner = ora(lang === "zh" ? "正在分层检索..." : "Planning layered recall...").start();
    const runtime = await createRuntime();
    const view = await queryMemoryView(runtime, {
      view: options.view,
      query,
      actorId: options.actor,
      projectId: options.project,
      limit: Number(options.limit),
      source: EventSource.CLI,
    });

    spinner.stop();
    console.log(JSON.stringify(view, null, 2));
  });

program
  .command(cliCommand("summarize").name)
  .description(cliCommand("summarize").description)
  .argument("<text>", "Text to summarize")
  .option("--agent <agentId>", "Agent identity", "cli")
  .action(async (text, options) => {
    const result = await runAgentOperation({ type: "summarize", text, sourceAgentId: options.agent });
    console.log(JSON.stringify(result, null, 2));
  });

program
  .command(cliCommand("clarify").name)
  .description(cliCommand("clarify").description)
  .argument("<text>", "Text needing clarification")
  .option("--agent <agentId>", "Agent identity", "cli")
  .action(async (text, options) => {
    const result = await runAgentOperation({ type: "clarify", text, sourceAgentId: options.agent });
    console.log(JSON.stringify(result, null, 2));
  });

program
  .command(cliCommand("resolve-clarification").name)
  .description(cliCommand("resolve-clarification").description)
  .argument("<clarificationId>", "Clarification item id")
  .argument("<answer>", "Clarification answer")
  .option("--agent <agentId>", "Resolving agent identity", "cli")
  .option("--project <projectId>", "Current project", "default")
  .option("--memory <memoryIds...>", "Memory ids resolved by this answer")
  .action(async (clarificationId, answer, options) => {
    const runtime = await createRuntime();
    const result = await runtime.resolveClarification({
      clarificationId,
      answer,
      resolvedBy: options.agent,
      actorId: options.agent,
      projectId: options.project,
      source: "cli",
      memoryIds: options.memory,
    });
    console.log(JSON.stringify(result, null, 2));
  });

program
  .command(cliCommand("mcp-config").name)
  .description(cliCommand("mcp-config").description)
  .option("--target <target>", "Config target: generic or hermes", "generic")
  .option("--json", "Output raw JSON")
  .action((options) => {
    const lang = currentLang(program.opts().lang);
    const runtimeConfig = loadRuntimeConfig();
    const config = createMcpClientConfig(options.target, process.cwd(), runtimeConfig);
    if (options.json) {
      console.log(JSON.stringify(config, null, 2));
      return;
    }
    console.log(chalk.bold.cyan(t(lang, "mcpConfigTitle")));
    const server = (config as any).mcpServers?.memohub ?? (config as any).mcp_servers?.memohub;
    console.log(`${t(lang, "command")}: ${server.command} ${server.args.join(" ")}`);
    console.log(`${t(lang, "cwd")}: ${server.cwd}`);
    console.log(t(lang, "agentHint"));
  });

program
  .command(cliCommand("config").name)
  .description(cliCommand("config").description)
  .option("--json", "Output raw JSON")
  .action((options) => {
    const lang = currentLang(program.opts().lang);
    const config = loadRuntimeConfig();
    if (options.json) {
      console.log(JSON.stringify(config, null, 2));
      return;
    }
    printRuntimeConfigSummary(config, lang);
  });

program
  .command(cliCommand("config-init").name)
  .description(cliCommand("config-init").description)
  .option("--json", "Output raw JSON")
  .action((options) => {
    const lang = currentLang(program.opts().lang);
    const result = resetGlobalConfig();
    if (options.json) {
      console.log(JSON.stringify({ success: true, ...result }, null, 2));
      return;
    }
    console.log(chalk.green(t(lang, "configInitialized")));
    console.log(`${t(lang, "configFile")}: ${result.configPath}`);
    console.log(`${t(lang, "removedStale")}: ${(result.removed as string[]).join(", ")}`);
  });

program
  .command(cliCommand("config-check").name)
  .description(cliCommand("config-check").description)
  .option("--json", "Output raw JSON")
  .action((options) => {
    const lang = currentLang(program.opts().lang);
    const result = ensureGlobalConfig();
    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }
    console.log(result.created
      ? chalk.green(lang === "zh" ? "配置不存在，已初始化。" : "Config was missing and has been initialized.")
      : chalk.green(lang === "zh" ? "配置已存在。" : "Config exists."));
    console.log(`${t(lang, "configFile")}: ${result.configPath}`);
  });

program
  .command(cliCommand("config-uninstall").name)
  .description(cliCommand("config-uninstall").description)
  .option("--json", "Output raw JSON")
  .action((options) => {
    const lang = currentLang(program.opts().lang);
    const result = uninstallGlobalConfig();
    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }
    console.log(chalk.green(lang === "zh" ? "全局配置已删除。" : "Global configuration removed."));
    console.log(`${t(lang, "removedStale")}: ${(result.removed as string[]).join(", ")}`);
  });

program
  .command(cliCommand("config-get").name)
  .description(cliCommand("config-get").description)
  .argument("<path>", "Dotted config path")
  .option("--json", "Output raw JSON")
  .action((configPath, options) => {
    const loader = new ConfigLoader();
    const value = getConfigValue(loader.getMaskedConfig(), configPath);
    if (options.json) console.log(JSON.stringify({ path: configPath, value }, null, 2));
    else console.log(`${configPath}: ${typeof value === "object" ? JSON.stringify(value) : value}`);
  });

program
  .command(cliCommand("config-set").name)
  .description(cliCommand("config-set").description)
  .argument("<path>", "Dotted config path")
  .argument("<value>", "JSON or string value")
  .option("--json", "Output raw JSON")
  .action((configPath, value, options) => {
    const lang = currentLang(program.opts().lang);
    const result = writeConfigValue(configPath, value);
    if (options.json) console.log(JSON.stringify({ success: true, ...result }, null, 2));
    else console.log(chalk.green(`${t(lang, "configUpdated")}: ${result.path} = ${typeof result.value === "object" ? JSON.stringify(result.value) : result.value}`));
  });

program
  .command(cliCommand("mcp-tools").name)
  .description(cliCommand("mcp-tools").description)
  .option("--json", "Output raw JSON")
  .action((options) => {
    const lang = currentLang(program.opts().lang);
    const runtimeConfig = loadRuntimeConfig();
    const catalog = createMcpAccessCatalog(process.cwd(), runtimeConfig);
    if (options.json) console.log(JSON.stringify(catalog, null, 2));
    else printMcpToolsSummary(catalog, lang);
  });

program
  .command(cliCommand("mcp-status").name)
  .description(cliCommand("mcp-status").description)
  .option("--json", "Output raw JSON")
  .action(async (options) => {
    const lang = currentLang(program.opts().lang);
    const runtimeConfig = loadRuntimeConfig();
    const logger = new McpLogger(runtimeConfig.mcp.logPath);
    const runtime = await createRuntime();
    const stats = await runtime.inspect();
    const status = {
      status: "ready",
      ...stats,
      catalog: createMcpAccessCatalog(process.cwd(), runtimeConfig),
      latestLogs: logger.readTail(5),
    };
    if (options.json) {
      console.log(JSON.stringify(status, null, 2));
      return;
    }
    console.log(chalk.bold.cyan(t(lang, "mcpStatusTitle")));
    console.log(`${t(lang, "status")}: ${t(lang, "ready")}`);
    console.log(`${t(lang, "runtime")}: ${stats.runtime}`);
    console.log(`${t(lang, "toolCount")}: ${status.catalog.tools.length}`);
    console.log(`${t(lang, "resources")}: ${status.catalog.resources.map((resource) => resource.uri).join(", ")}`);
    console.log(`${t(lang, "mcpLog")}: ${runtimeConfig.mcp.logPath}`);
  });

program
  .command(cliCommand("mcp-doctor").name)
  .description(cliCommand("mcp-doctor").description)
  .option("--json", "Output raw JSON")
  .action(async (options) => {
    const lang = currentLang(program.opts().lang);
    const runtime = await createRuntime();
    const result = await runMcpDoctor(runtime);
    if (options.json) console.log(JSON.stringify(result, null, 2));
    else printDoctorSummary(result, lang);
    if (!result.ok) process.exitCode = 1;
  });

program
  .command(cliCommand("mcp-logs").name)
  .description(cliCommand("mcp-logs").description)
  .option("--tail <lines>", "Number of log lines", "50")
  .action((options) => {
    const lang = currentLang(program.opts().lang);
    const runtimeConfig = loadRuntimeConfig();
    const logger = new McpLogger(runtimeConfig.mcp.logPath);
    const logs = logger.readTail(Number(options.tail));
    console.log(logs || `${t(lang, "noLogs")}\n${t(lang, "mcpLog")}: ${logger.path}`);
  });

const serveCommand = cliCommand("serve");
program
  .command(serveCommand.name)
  .alias(serveCommand.alias!)
  .description(serveCommand.description)
  .action(async () => {
    const runtimeConfig = loadRuntimeConfig();
    const logger = new McpLogger(runtimeConfig.mcp.logPath);
    try {
      const runtime = await createRuntime();
      // MCP 使用 stdio 协议，启动路径不能向 stdout 输出 spinner 或提示文本。
      logger.write({ level: "info", event: "cli.serve", message: "Starting MCP server from CLI" });
      await runMcpServer(runtime);
    } catch (error) {
      logger.write({
        level: "error",
        event: "cli.serve.error",
        message: error instanceof Error ? error.message : String(error),
      });
      console.error(chalk.red(`Failed to start MCP Server: ${error.message}`));
      process.exit(1);
    }
  });

program.parse();
