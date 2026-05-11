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
import { ChannelRegistry, CHANNEL_PURPOSES } from "@memohub/channel";
import {
  doctorHermesIntegration,
  installHermesIntegration,
  uninstallHermesIntegration,
} from "./hermes-integration.js";
import {
  cleanManagedData,
  cleanChannelData,
  cleanChannelsBySelector,
  CONFIG_UNINSTALL_CONFIRMATION,
  DATA_CLEAN_CONFIRMATION,
  ensureGlobalConfig,
  getConfigValue,
  resetGlobalConfig,
  runMcpDoctor,
  uninstallGlobalConfigWithConfirmation,
  uninstallGlobalConfig,
  writeConfigValue,
} from "./config-commands.js";
import {
  localizeHelpOutput,
  localizeHelpText,
  resolveLang,
  resolveLangFromArgv,
  t,
  type CliLang,
} from "./i18n.js";

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

function activeHelpLang(): CliLang {
  return currentLang(resolveLangFromArgv());
}

function helpText(text: string): string {
  return localizeHelpText(text, activeHelpLang());
}

function ensureConfigBeforeCommand(commandName?: string): void {
  if (!["config", "uninstall"].includes(commandName ?? "")) {
    ensureGlobalConfig();
  }
}

function printJsonOrText(value: unknown, asJson?: boolean): void {
  if (asJson) console.log(JSON.stringify(value, null, 2));
}

function formatMaybeJson(value: unknown): string {
  return typeof value === "object" ? JSON.stringify(value) : String(value);
}

function writeCliLog(event: string, message: string, metadata: Record<string, unknown> = {}, level: "info" | "warn" | "error" = "info"): void {
  try {
    const runtimeConfig = loadRuntimeConfig();
    const logger = new McpLogger(runtimeConfig.mcp.logPath);
    logger.write({ level, event, message, metadata });
  } catch {
    // 日志写入不应阻断主流程；这里保持静默，避免 CLI 因日志目录异常而失效。
  }
}

function sortTopLevelCommands(command: Command): void {
  const order = [
    "config",
    "hermes",
    "inspect",
    "channel",
    "list",
    "query",
    "add",
    "summarize",
    "clarification",
    "logs",
    "data",
    "mcp",
    "serve",
    "help",
  ];
  const weight = new Map(order.map((name, index) => [name, index]));
  command.commands.sort((left, right) => {
    const leftWeight = weight.get(left.name()) ?? Number.MAX_SAFE_INTEGER;
    const rightWeight = weight.get(right.name()) ?? Number.MAX_SAFE_INTEGER;
    if (leftWeight !== rightWeight) return leftWeight - rightWeight;
    return left.name().localeCompare(right.name());
  });
}

function filterLogEntries(
  entries: ReturnType<McpLogger["readEntries"]>,
  filters: {
    level?: string;
    event?: string;
    channel?: string;
    project?: string;
    session?: string;
    task?: string;
    source?: string;
  },
) {
  return entries.filter((entry) => {
    const metadata = (entry.metadata ?? {}) as Record<string, unknown>;
    return (!filters.level || entry.level === filters.level)
      && (!filters.event || entry.event === filters.event)
      && (!filters.channel || metadata.channel === filters.channel)
      && (!filters.project || metadata.projectId === filters.project)
      && (!filters.session || metadata.sessionId === filters.session)
      && (!filters.task || metadata.taskId === filters.task)
      && (!filters.source || metadata.source === filters.source);
  });
}

function printLogEntries(entries: ReturnType<McpLogger["readEntries"]>, lang: CliLang, asJson?: boolean): void {
  if (asJson) {
    console.log(JSON.stringify({ success: true, entries }, null, 2));
    return;
  }
  if (entries.length === 0) {
    console.log(t(lang, "noMatches"));
    return;
  }
  console.log(chalk.bold.cyan(t(lang, "logQueryTitle")));
  for (const entry of entries) {
    console.log(`- ${entry.timestamp} [${entry.level}] ${entry.event}`);
    console.log(`  ${t(lang, "logMessage")}: ${entry.message}`);
    const metadata = (entry.metadata ?? {}) as Record<string, unknown>;
    if (metadata.source) console.log(`  ${t(lang, "logSource")}: ${metadata.source}`);
    if (metadata.projectId) console.log(`  ${t(lang, "logProject")}: ${metadata.projectId}`);
    if (metadata.channel) console.log(`  ${t(lang, "logChannel")}: ${metadata.channel}`);
    if (metadata.sessionId) console.log(`  ${t(lang, "logSession")}: ${metadata.sessionId}`);
    if (metadata.taskId) console.log(`  ${t(lang, "logTask")}: ${metadata.taskId}`);
  }
}

function printRuntimeConfigSummary(config = loadRuntimeConfig(), lang: CliLang): void {
  console.log(chalk.bold.cyan(t(lang, "configTitle")));
  console.log(`${t(lang, "configVersion")}: ${config.configVersion}`);
  console.log(`${t(lang, "root")}: ${config.root}`);
  console.log(`${t(lang, "vectorDb")}: ${config.storage.vectorDbPath}`);
  console.log(`${t(lang, "table")}: ${config.storage.vectorTable}`);
  console.log(`${t(lang, "blob")}: ${config.storage.blobPath}`);
  console.log(`${t(lang, "embedder")}: ${config.ai.embeddingModel} @ ${config.ai.embedderProviderId} (${config.ai.dimensions})`);
  console.log(`${t(lang, "summarizer")}: ${config.ai.chatModel} @ ${config.ai.summarizerProviderId}`);
  console.log(`${t(lang, "mcpLog")}: ${config.mcp.logPath}`);
  console.log(`${t(lang, "views")}: ${config.memory.views.join(", ")}`);
  console.log(`${t(lang, "operations")}: ${config.memory.operations.join(", ")}`);
  console.log(`${t(lang, "commonCommands")}: memohub config show | memohub mcp tools | memohub logs query --tail 50`);
}

function previewText(value: string, max = 88): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 3)}...`;
}

function printSectionTitle(title: string): void {
  console.log(chalk.bold.cyan(title));
}

function printKeyValue(label: string, value: string): void {
  console.log(`${chalk.gray(label)}: ${value}`);
}

function printListBlock(label: string, values: string[]): void {
  if (values.length === 0) return;
  console.log(chalk.bold(label));
  for (const value of values) console.log(`- ${value}`);
}

function printMemoryOverview(memories: any[], lang: CliLang, limit: number): void {
  const grouped = new Map<string, any[]>();
  for (const memory of memories) {
    const actorId = memory.actor?.id ?? memory.source?.id ?? "unknown";
    const current = grouped.get(actorId) ?? [];
    current.push(memory);
    grouped.set(actorId, current);
  }

  const entries = Array.from(grouped.entries())
    .map(([actorId, items]) => ({
      actorId,
      count: items.length,
      latest: items.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0],
    }))
    .sort((left, right) => right.latest.updatedAt.localeCompare(left.latest.updatedAt))
    .slice(0, limit);

  printSectionTitle(t(lang, "listOverviewTitle"));
  printKeyValue(t(lang, "actorCount"), String(entries.length));
  printKeyValue(t(lang, "memoryCount"), String(memories.length));
  console.log();

  for (const entry of entries) {
    const preview = previewText(entry.latest?.content?.[0]?.text ?? "", 120);
    console.log(chalk.bold(entry.actorId));
    console.log(`  ${t(lang, "resultCount")}: ${entry.count}`);
    if (entry.latest?.subject?.id) console.log(`  ${t(lang, "projectId")}: ${entry.latest.subject.id}`);
    console.log(`  ${t(lang, "updatedAt")}: ${entry.latest.updatedAt}`);
    if (preview) console.log(`  ${t(lang, "recentMemory")}: ${preview}`);
    console.log();
  }

  console.log(chalk.gray(`${t(lang, "filters")}: ${t(lang, "listOverviewHint")}`));
}

function printMcpToolsSummary(catalog: ReturnType<typeof createMcpAccessCatalog>, lang: CliLang): void {
  const coreTools = catalog.tools.filter((tool) =>
    ["memohub_ingest_event", "memohub_query", "memohub_summarize", "memohub_clarification_create", "memohub_clarification_resolve"].includes(tool.name)
  );
  const governanceTools = catalog.tools.filter((tool) => !coreTools.includes(tool));

  printSectionTitle(t(lang, "mcpCatalogTitle"));
  printKeyValue(t(lang, "command"), `${catalog.command} ${catalog.args.join(" ")}`);
  printKeyValue(t(lang, "views"), catalog.views.join(", "));
  printKeyValue(t(lang, "resources"), catalog.resources.map((resource) => resource.uri).join(", "));
  printKeyValue(t(lang, "mcpLog"), catalog.storage.logPath);

  console.log();
  printSectionTitle(t(lang, "contractTitle"));
  printListBlock(t(lang, "identityFields"), catalog.ingestContract.identity);
  printListBlock(t(lang, "eventFields"), catalog.ingestContract.eventFields);
  printListBlock(t(lang, "payloadFields"), catalog.ingestContract.payloadFields);
  printListBlock(t(lang, "recommendedMetadata"), catalog.ingestContract.metadataRecommended);

  console.log();
  printSectionTitle(t(lang, "toolGroupCore"));
  for (const tool of coreTools) console.log(`- ${tool.name}: ${tool.description}`);

  console.log();
  printSectionTitle(t(lang, "toolGroupGovernance"));
  for (const tool of governanceTools) console.log(`- ${tool.name}: ${tool.description}`);

  console.log();
  printSectionTitle(t(lang, "guidanceTitle"));
  for (const line of catalog.ingestContract.guidance.slice(0, 4)) console.log(`- ${line}`);
  console.log(`- ${t(lang, "nextSteps")}: memohub channel open --actor hermes --source hermes --project memo-hub --purpose primary`);
  console.log(`- ${t(lang, "nextSteps")}: memohub query "Hermes habits" --view agent_profile --actor hermes --project memo-hub`);
  console.log(`- ${t(lang, "nextSteps")}: memohub logs query --channel hermes:mcp-test`);
  console.log(`- ${t(lang, "agentHint")}`);
}

function printDoctorSummary(result: Awaited<ReturnType<typeof runMcpDoctor>>, lang: CliLang): void {
  console.log(chalk.bold.cyan(t(lang, "mcpDoctorTitle")));
  for (const check of result.checks) {
    const mark = check.ok ? chalk.green(t(lang, "passed")) : chalk.red(t(lang, "failed"));
    console.log(`${mark} ${check.name}`);
  }
  console.log(`${t(lang, "status")}: ${result.ok ? chalk.green(t(lang, "accessible")) : chalk.red(t(lang, "inaccessible"))}`);
}

function printHermesInstallSummary(result: ReturnType<typeof installHermesIntegration>, lang: CliLang): void {
  printSectionTitle(t(lang, "hermesInstallTitle"));
  printKeyValue(t(lang, "status"), chalk.green(t(lang, "ready")));
  printKeyValue(t(lang, "memohubRootLabel"), result.paths.memoHubRoot);
  printKeyValue(t(lang, "hermesHomeLabel"), result.paths.hermesHome);
  printKeyValue(t(lang, "integrationPluginLabel"), result.paths.integrationPluginRoot);
  printKeyValue(t(lang, "integrationConfigLabel"), result.paths.integrationConfigPath);
  printKeyValue(t(lang, "pluginLinkLabel"), result.paths.hermesPluginLink);
  printKeyValue(t(lang, "configLinkLabel"), result.paths.hermesConfigLink);
  console.log();
  printSectionTitle(t(lang, "guidanceTitle"));
  for (const step of result.nextSteps) console.log(`- ${step}`);
}

function printHermesDoctorSummary(result: ReturnType<typeof doctorHermesIntegration>, lang: CliLang): void {
  printSectionTitle(t(lang, "hermesDoctorTitle"));
  printKeyValue(t(lang, "requiredPythonLabel"), result.requiredPython);
  printKeyValue(t(lang, "memohubRootLabel"), result.paths.memoHubRoot);
  printKeyValue(t(lang, "hermesHomeLabel"), result.paths.hermesHome);
  console.log();
  for (const check of result.checks) {
    const mark = check.ok ? chalk.green(t(lang, "passed")) : chalk.red(t(lang, "failed"));
    console.log(`${mark} ${check.name}`);
    console.log(`  ${check.detail}`);
  }
  console.log();
  console.log(`${t(lang, "status")}: ${result.success ? chalk.green(t(lang, "accessible")) : chalk.red(t(lang, "inaccessible"))}`);
  if (result.nextSteps.length > 0) {
    console.log();
    printSectionTitle(t(lang, "guidanceTitle"));
    for (const step of result.nextSteps) console.log(`- ${step}`);
  }
}

function printLayerResults(
  title: string,
  results: Array<{ object?: { id?: string; content?: Array<{ text?: string }> }; score?: number }>,
  lang: CliLang,
): void {
  console.log(chalk.bold(title));
  if (results.length === 0) {
    console.log(`- ${t(lang, "noResults")}`);
    return;
  }
  for (const result of results) {
    const text = result.object?.content?.find((block) => typeof block.text === "string")?.text ?? "";
    const score = typeof result.score === "number" ? result.score.toFixed(3) : "-";
    console.log(`- ${result.object?.id ?? "unknown"} [score=${score}]`);
    if (text) console.log(`  ${t(lang, "itemPreview")}: ${previewText(text)}`);
  }
}

function printQueryViewSummary(view: any, request: { actor?: string; project: string; namedView: string }, lang: CliLang): void {
  printSectionTitle(t(lang, "queryTitle"));
  printKeyValue(t(lang, "scopeView"), view.view);
  printKeyValue(t(lang, "actorId"), request.actor || "-");
  printKeyValue(t(lang, "projectId"), request.project);
  printKeyValue(t(lang, "totalHits"), String((view.selfContext?.length ?? 0) + (view.projectContext?.length ?? 0) + (view.globalContext?.length ?? 0)));
  console.log();
  printLayerResults(`${t(lang, "layerSelf")} · ${t(lang, "resultCount")}=${view.selfContext?.length ?? 0}`, view.selfContext ?? [], lang);
  console.log();
  printLayerResults(`${t(lang, "layerProject")} · ${t(lang, "resultCount")}=${view.projectContext?.length ?? 0}`, view.projectContext ?? [], lang);
  console.log();
  printLayerResults(`${t(lang, "layerGlobal")} · ${t(lang, "resultCount")}=${view.globalContext?.length ?? 0}`, view.globalContext ?? [], lang);
  console.log();
  console.log(chalk.gray(`${t(lang, "commandSnippet")}: memohub query "..." --view ${request.namedView} --project ${request.project}${request.actor ? ` --actor ${request.actor}` : ""} --json`));
}

function statusIndicator(status: string): string {
  if (status === "active") return chalk.green("●");
  if (status === "idle") return chalk.yellow("◐");
  if (status === "closed") return chalk.gray("○");
  return chalk.gray("◌");
}

function printChannelEntry(entry: any, lang: CliLang): void {
  const badges = [
    `${statusIndicator(entry.status)} ${entry.status}`,
    entry.isPrimary ? chalk.cyan(t(lang, "selected")) : chalk.gray(t(lang, "reusable")),
    entry.purpose,
  ];
  console.log(chalk.bold(`${entry.channelId}`));
  console.log(`  ${badges.join("  ")}`);
  console.log(`  ${t(lang, "owner")}: ${entry.actorId}    ${t(lang, "projectId")}: ${entry.projectId}    source: ${entry.source}`);
  if (entry.workspaceId) console.log(`  workspace: ${entry.workspaceId}`);
  if (entry.sessionId) console.log(`  session: ${entry.sessionId}`);
  if (entry.taskId) console.log(`  task: ${entry.taskId}`);
  console.log(`  ${t(lang, "createdAt")}: ${entry.createdAt}`);
  console.log(`  ${t(lang, "updatedAt")}: ${entry.lastSeenAt}`);
}

function resolveEventSource(value?: string): EventSource {
  const normalized = (value ?? "cli").toLowerCase();
  return Object.values(EventSource).includes(normalized as EventSource)
    ? normalized as EventSource
    : EventSource.EXTERNAL;
}

function resolveChannelForWrite(
  runtime: UnifiedMemoryRuntime,
  input: {
    source: string;
    projectId: string;
    channel?: string;
    workspaceId?: string;
    sessionId?: string;
    taskId?: string;
  },
): string {
  if (input.channel) {
    runtime.openChannel({
      channelId: input.channel,
      actorId: input.source,
      source: input.source,
      projectId: input.projectId,
      workspaceId: input.workspaceId,
      sessionId: input.sessionId,
      taskId: input.taskId,
      purpose: input.sessionId ? "session" : "primary",
      isPrimary: !input.sessionId,
      metadata: { createdBy: "cli.add" },
    });
    return input.channel;
  }

  if (input.source === EventSource.IDE && input.workspaceId) {
    return runtime.autoBindWorkspaceChannel({
      source: input.source,
      actorId: input.source,
      projectId: input.projectId,
      workspaceId: input.workspaceId,
      sessionId: input.sessionId,
      taskId: input.taskId,
    }).entry.channelId;
  }

  return runtime.openChannel({
    actorId: input.source,
    source: input.source,
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    sessionId: input.sessionId,
    taskId: input.taskId,
    purpose: input.sessionId ? "session" : "primary",
    isPrimary: !input.sessionId,
    metadata: { createdBy: "cli.add" },
  }).entry.channelId;
}

/**
 * 组装新架构运行时。
 *
 * 边界约束：
 * - CLI/MCP 只依赖统一记忆运行时，不再暴露旧 track 概念。
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
  const channels = new ChannelRegistry(runtimeConfig.registry.channelRegistryPath);
  const localAi = new OllamaAdapter({
    url: runtimeConfig.ai.embedderProviderUrl,
    embeddingModel: runtimeConfig.ai.embeddingModel,
    chatModel: runtimeConfig.ai.summarizerProviderUrl === runtimeConfig.ai.embedderProviderUrl
      ? runtimeConfig.ai.chatModel
      : undefined,
  });

  // 第二步：初始化统一运行时，CLI/MCP 后续只通过标准入口访问它。
  const runtime = new UnifiedMemoryRuntime({ cas, vector, embedder: localAi, channels, runtimeConfig });
  await runtime.initialize();
  return runtime;
}

const program = new Command();

function appendWorkflowGuidance(command: Command, lines: string[]): void {
  command.addHelpText("after", () => {
    const lang = activeHelpLang();
    const helpBlock = lines
      .map((line) => `  ${localizeHelpText(line, lang)}`)
      .join("\n");
    return `\n\n${localizeHelpText("Workflow Guide:", lang)}\n${helpBlock}\n`;
  });
}

program
  .name(CLI_METADATA.name)
  .description(helpText(CLI_METADATA.description))
  .version(CLI_METADATA.version);

program.option("--lang <lang>", helpText("Output language: zh or en"));
program.configureOutput({
  writeOut: (str) => process.stdout.write(localizeHelpOutput(str, activeHelpLang())),
  writeErr: (str) => process.stderr.write(localizeHelpOutput(str, activeHelpLang())),
});
program.configureHelp({
  commandDescription: (cmd) => localizeHelpText(cmd.description(), activeHelpLang()),
  optionDescription: (option) => localizeHelpText(option.description || "", activeHelpLang()),
  subcommandTerm: (cmd) => {
    const term = cmd.name() + (cmd.usage() ? ` ${cmd.usage()}` : "");
    return cmd.alias() ? `${term}|${cmd.alias()}` : term;
  },
});
program.hook("preAction", (thisCommand, actionCommand) => {
  ensureConfigBeforeCommand(actionCommand.name());
});

appendWorkflowGuidance(program, [
  "First-time setup: memohub config check -> memohub config show -> memohub mcp doctor",
  "Install Hermes provider: memohub hermes install -> hermes memory setup -> hermes plugins reload",
  "Bind an actor channel: memohub channel open --actor hermes --source hermes --project memo-hub --purpose primary",
  "Write and query memory: memohub add ... -> memohub query ...",
  "Start MCP for agents: memohub mcp config --target hermes -> memohub mcp serve",
  "Troubleshoot with logs: memohub logs query --tail 100 --channel <channel>",
  "High-risk governance: memohub data status -> memohub data clean/rebuild-schema only with explicit confirmation",
]);

// --- CLI 指令集 ---

program
  .command(cliCommand("inspect").name)
  .description(helpText(cliCommand("inspect").description))
  .option("--json", helpText("Output raw JSON"))
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
  .description(helpText(cliCommand("add").description))
  .argument("<text>", helpText("Text content"))
  .option("--project <projectId>", helpText("Current project"), "default")
  .option("--source <source>", helpText("Source descriptor id"), "cli")
  .option("--channel <channelId>", helpText("Governed channel id"))
  .option("--workspace <workspaceId>", helpText("Workspace binding"))
  .option("--session <sessionId>", helpText("Session binding"))
  .option("--task <taskId>", helpText("Task binding"))
  .option("--category <category>", helpText("Memory category/domain hint"))
  .option("--file <filePath>", helpText("Related source file path"))
  .option("--json", helpText("Output raw JSON"))
  .action(async (text, options) => {
    const lang = currentLang(program.opts().lang);
    const spinner = options.json ? undefined : ora(lang === "zh" ? "正在写入记忆..." : "Processing memory...").start();
    writeCliLog("cli.add.request", "CLI memory write requested", {
      source: options.source,
      projectId: options.project,
      channel: options.channel,
      sessionId: options.session,
      taskId: options.task,
      category: options.category,
    });
    const runtime = await createRuntime();

    const result = await ingestMemory(runtime, {
      text,
      source: resolveEventSource(options.source),
      channel: resolveChannelForWrite(runtime, {
        source: resolveEventSource(options.source),
        projectId: options.project,
        channel: options.channel,
        workspaceId: options.workspace,
        sessionId: options.session,
        taskId: options.task,
      }),
      projectId: options.project,
      confidence: EventConfidence.REPORTED,
      sessionId: options.session,
      taskId: options.task,
      filePath: options.file,
      category: options.category,
      metadata: {
        sourceId: options.source,
        timestamp: new Date().toISOString()
      }
    });
    writeCliLog(
      "cli.add.result",
      result.success ? "CLI memory write completed" : "CLI memory write failed",
      {
        success: result.success,
        eventId: result.eventId,
        source: options.source,
        projectId: options.project,
        channel: options.channel,
        sessionId: options.session,
        taskId: options.task,
        category: options.category,
      },
      result.success ? "info" : "error",
    );

    if (options.json) {
      spinner?.stop();
      console.log(JSON.stringify(result, null, 2));
      if (!result.success) process.exitCode = 1;
      return;
    }

    if (result.success) {
      spinner?.succeed(chalk.green(`${t(lang, "memoryCommitted")}: ${result.eventId}, Hash: ${result.contentHash?.slice(0, 8)}...`));
    } else {
      spinner?.fail(chalk.red(`${t(lang, "failedPrefix")}: ${result.error}`));
    }
  });

program
  .command(cliCommand("query").name)
  .description(helpText(cliCommand("query").description))
  .argument("<query>", helpText("Natural language query"))
  .option("--view <view>", helpText("Named context view"), "project_context")
  .option("--actor <actorId>", helpText("Requesting agent or actor"))
  .option("--project <projectId>", helpText("Current project"), "default")
  .option("--limit <limit>", helpText("Per-layer result limit"), "5")
  .option("--json", helpText("Output raw JSON"))
  .action(async (query, options) => {
    const lang = currentLang(program.opts().lang);
    const spinner = options.json ? undefined : ora(lang === "zh" ? "正在分层检索..." : "Planning layered recall...").start();
    writeCliLog("cli.query.request", "CLI memory query requested", {
      actorId: options.actor,
      projectId: options.project,
      view: options.view,
      limit: Number(options.limit),
    });
    const runtime = await createRuntime();
    const view = await queryMemoryView(runtime, {
      view: options.view,
      query,
      actorId: options.actor,
      projectId: options.project,
      limit: Number(options.limit),
      source: EventSource.CLI,
    });
    writeCliLog("cli.query.result", "CLI memory query completed", {
      actorId: options.actor,
      projectId: options.project,
      view: options.view,
      limit: Number(options.limit),
      selfCount: view.selfContext?.length ?? 0,
      projectCount: view.projectContext?.length ?? 0,
      globalCount: view.globalContext?.length ?? 0,
      conflictCount: view.conflictsOrGaps?.length ?? 0,
    });

    spinner?.stop();
    if (options.json) {
      console.log(JSON.stringify(view, null, 2));
      return;
    }
    printQueryViewSummary(view, {
      actor: options.actor,
      project: options.project,
      namedView: options.view,
    }, lang);
  });

program
  .command(cliCommand("list").name)
  .alias(cliCommand("list").alias ?? "ls")
  .description(helpText(cliCommand("list").description))
  .option("--perspective <perspective>", helpText("Governance perspective: actor, project, or global"))
  .option("--actor <actorId>", helpText("Actor id for actor perspective"))
  .option("--project <projectId>", helpText("Project id for project perspective"))
  .option("--workspace <workspaceId>", helpText("Workspace binding"))
  .option("--session <sessionId>", helpText("Session binding"))
  .option("--task <taskId>", helpText("Task binding"))
  .option("--domain <domain...>", helpText("Optional domain filter"))
  .option("--limit <limit>", helpText("Result limit"), "20")
  .option("--json", helpText("Output raw JSON"))
  .action(async (options) => {
    const runtime = await createRuntime();
    const limit = Number(options.limit);
    const explicitPerspective = typeof options.perspective === "string" && options.perspective.length > 0;
    const hasScopedFilter = Boolean(
      explicitPerspective || options.actor || options.project || options.workspace || options.session || options.task || options.domain?.length,
    );
    const perspective = (options.perspective ?? "global") as "actor" | "project" | "global";
    const memories = await runtime.listMemories({
      perspective,
      actorId: options.actor,
      projectId: options.project,
      workspaceId: options.workspace,
      sessionId: options.session,
      taskId: options.task,
      domains: options.domain,
      limit,
    } as never);
    writeCliLog("cli.list.result", "CLI memory list completed", {
      perspective: hasScopedFilter ? perspective : "overview",
      actorId: options.actor,
      projectId: options.project,
      workspaceId: options.workspace,
      sessionId: options.session,
      taskId: options.task,
      resultCount: memories.length,
    });

    if (options.json) {
      console.log(JSON.stringify({ perspective: hasScopedFilter ? perspective : "overview", memories }, null, 2));
      return;
    }

    const lang = currentLang(program.opts().lang);
    if (!hasScopedFilter) {
      printMemoryOverview(memories, lang, limit);
      return;
    }

    printSectionTitle(`MemoHub List · ${perspective}`);
    printKeyValue(t(lang, "resultCount"), String(memories.length));
    for (const memory of memories) {
      console.log();
      console.log(chalk.bold(memory.id));
      console.log(`  ${t(lang, "actorId")}: ${memory.actor?.id ?? "-"}    ${t(lang, "projectId")}: ${memory.subject?.id ?? "-"}`);
      console.log(`  domains: ${memory.domains.map((domain) => domain.type).join(", ") || "-"}`);
      console.log(`  updated: ${memory.updatedAt}`);
      console.log(`  preview: ${(memory.content[0]?.text ?? "").slice(0, 120)}`);
    }
  });

program
  .command(cliCommand("summarize").name)
  .description(helpText(cliCommand("summarize").description))
  .argument("<text>", helpText("Text to summarize"))
  .option("--actor <actorId>", helpText("Actor identity"), "cli")
  .action(async (text, options) => {
    const result = await runAgentOperation({ type: "summarize", text, sourceAgentId: options.actor });
    console.log(JSON.stringify(result, null, 2));
  });

const clarificationCommand = program
  .command("clarification")
  .description(helpText("Manage clarification creation and resolution"));

appendWorkflowGuidance(clarificationCommand, [
  "Create when you detect a conflict or missing fact: memohub clarification create \"...\" --actor hermes",
  "Resolve after user confirmation: memohub clarification resolve <clarificationId> \"answer\" --actor hermes --project memo-hub",
  "Then verify with query: memohub query \"what is the final clarified fact\" --view project_context --project memo-hub",
]);

clarificationCommand
  .command("create")
  .description(helpText(cliCommand("clarification create").description))
  .argument("<text>", helpText("Text needing clarification"))
  .option("--actor <actorId>", helpText("Actor identity"), "cli")
  .action(async (text, options) => {
    const lang = currentLang(program.opts().lang);
    const result = await runAgentOperation({ type: "clarify", text, sourceAgentId: options.actor });
    console.log(JSON.stringify({ message: t(lang, "clarificationCreated"), ...result }, null, 2));
  });

clarificationCommand
  .command("resolve")
  .description(helpText(cliCommand("clarification resolve").description))
  .argument("<clarificationId>", helpText("Clarification item id"))
  .argument("<answer>", helpText("Clarification answer"))
  .option("--actor <actorId>", helpText("Resolving actor identity"), "cli")
  .option("--project <projectId>", helpText("Current project"), "default")
  .option("--memory <memoryIds...>", helpText("Memory ids resolved by this answer"))
  .action(async (clarificationId, answer, options) => {
    const lang = currentLang(program.opts().lang);
    const runtime = await createRuntime();
    const result = await runtime.resolveClarification({
      clarificationId,
      answer,
      resolvedBy: options.actor,
      actorId: options.actor,
      projectId: options.project,
      source: "cli",
      memoryIds: options.memory,
    });
    console.log(JSON.stringify({ message: t(lang, "clarificationResolved"), ...result }, null, 2));
  });

const configCommand = program
  .command("config")
  .description(helpText("Manage MemoHub configuration"));

appendWorkflowGuidance(configCommand, [
  "Check and initialize config first: memohub config check",
  "Inspect resolved paths and models: memohub config show",
  "Read one field: memohub config get mcp.logPath",
  "Write one field: memohub config set system.lang '\"zh\"'",
  "Uninstall only when you want to remove MemoHub config entirely: memohub config uninstall --yes --confirm DELETE_MEMOHUB_CONFIG",
]);

configCommand
  .command("show")
  .description(cliCommand("config show").description)
  .option("--json", "Output raw JSON")
  .action(async (options) => {
    const lang = currentLang(program.opts().lang);
    const config = loadRuntimeConfig();
    if (options.json) {
      console.log(JSON.stringify(config, null, 2));
      return;
    }
    printRuntimeConfigSummary(config, lang);
  });

configCommand
  .command("check")
  .description(cliCommand("config check").description)
  .option("--json", "Output raw JSON")
  .action((options) => {
    const lang = currentLang(program.opts().lang);
    const result = ensureGlobalConfig();
    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }
    console.log(result.created ? chalk.green(t(lang, "configCreated")) : chalk.green(t(lang, "configExists")));
    console.log(`${t(lang, "configFile")}: ${result.configPath}`);
  });

configCommand
  .command("uninstall")
  .description(cliCommand("config uninstall").description)
  .option("--yes", "Acknowledge destructive config removal")
  .option("--confirm <phrase>", `Required confirmation phrase: ${CONFIG_UNINSTALL_CONFIRMATION}`)
  .option("--json", "Output raw JSON")
  .action((options) => {
    const lang = currentLang(program.opts().lang);
    const result = uninstallGlobalConfigWithConfirmation({
      yes: options.yes,
      confirm: options.confirm,
    });
    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
      if (!result.success) process.exitCode = 1;
      return;
    }
    if (!result.success) {
      console.log(chalk.red(String(result.error)));
      process.exitCode = 1;
      return;
    }
    console.log(chalk.green(t(lang, "configRemoved")));
    console.log(`${t(lang, "removedStale")}: ${(result.removed as string[]).join(", ")}`);
  });

configCommand
  .command("get")
  .description(cliCommand("config get").description)
  .argument("<path>", "Dotted config path")
  .option("--json", "Output raw JSON")
  .action((configPath, options) => {
    const loader = new ConfigLoader();
    const value = getConfigValue(loader.getMaskedConfig(), configPath);
    if (options.json) console.log(JSON.stringify({ path: configPath, value }, null, 2));
    else console.log(`${configPath}: ${formatMaybeJson(value)}`);
  });

configCommand
  .command("set")
  .description(cliCommand("config set").description)
  .argument("<path>", "Dotted config path")
  .argument("<value>", "JSON or string value")
  .option("--json", "Output raw JSON")
  .action((configPath, value, options) => {
    const lang = currentLang(program.opts().lang);
    const result = writeConfigValue(configPath, value);
    if (options.json) console.log(JSON.stringify({ success: true, ...result }, null, 2));
    else console.log(chalk.green(`${t(lang, "configUpdated")}: ${result.path} = ${formatMaybeJson(result.value)}`));
  });

const hermesCommand = program
  .command("hermes")
  .description(helpText("Manage Hermes memory provider installation and diagnostics"));

appendWorkflowGuidance(hermesCommand, [
  "Install official Hermes provider files first: memohub hermes install",
  "Then activate it inside Hermes: hermes memory setup",
  "Reload Hermes plugins after updates: hermes plugins reload",
  "Verify links and Python compatibility: memohub hermes doctor",
]);

hermesCommand
  .command("install")
  .description(helpText(cliCommand("hermes install").description))
  .option("--hermes-home <path>", helpText("Hermes home directory"))
  .option("--project <projectId>", helpText("Optional default project id written to provider config"))
  .option("--language <lang>", helpText("Provider output language: auto, zh, or en"), "auto")
  .option("--cwd <workingDirectory>", helpText("Optional working directory written to provider config"))
  .option("--json", helpText("Output raw JSON"))
  .action((options) => {
    const lang = currentLang(program.opts().lang);
    const result = installHermesIntegration({
      hermesHome: options.hermesHome,
      memoHubRoot: loadRuntimeConfig().root,
      projectId: options.project,
      language: options.language,
      workingDirectory: options.cwd,
    });
    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }
    printHermesInstallSummary(result, lang);
  });

hermesCommand
  .command("doctor")
  .description(helpText(cliCommand("hermes doctor").description))
  .option("--hermes-home <path>", helpText("Hermes home directory"))
  .option("--json", helpText("Output raw JSON"))
  .action((options) => {
    const lang = currentLang(program.opts().lang);
    const result = doctorHermesIntegration({
      hermesHome: options.hermesHome,
      memoHubRoot: loadRuntimeConfig().root,
    });
    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
      if (!result.success) process.exitCode = 1;
      return;
    }
    printHermesDoctorSummary(result, lang);
    if (!result.success) process.exitCode = 1;
  });

hermesCommand
  .command("uninstall")
  .description(helpText(cliCommand("hermes uninstall").description))
  .option("--hermes-home <path>", helpText("Hermes home directory"))
  .option("--purge-assets", helpText("Also remove MemoHub-managed Hermes integration assets"))
  .option("--json", helpText("Output raw JSON"))
  .action((options) => {
    const lang = currentLang(program.opts().lang);
    const result = uninstallHermesIntegration({
      hermesHome: options.hermesHome,
      memoHubRoot: loadRuntimeConfig().root,
      purgeAssets: options.purgeAssets,
    });
    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }
    printSectionTitle(t(lang, "hermesUninstallTitle"));
    printKeyValue(t(lang, "status"), chalk.green(t(lang, "ready")));
    printKeyValue(t(lang, "resultCount"), String(result.removed.length));
    for (const removed of result.removed) console.log(`- ${removed}`);
  });

const channelCommand = program
  .command("channel")
  .description(helpText("Manage governed channel bindings"));

appendWorkflowGuidance(channelCommand, [
  "Open or restore a primary actor channel before MCP writes: memohub channel open --actor hermes --source hermes --project memo-hub --purpose primary",
  "List existing channels when reusing sessions: memohub channel list --actor hermes",
  "Inspect one channel before cleanup or debugging: memohub channel status <channelId>",
  "Use close only when you want to stop implicit reuse of a channel",
]);

channelCommand
  .command("open")
  .description("Open or restore a governed channel binding")
  .option("--actor <actorId>", "Actor id", "cli")
  .option("--source <source>", "Source id", "cli")
  .option("--project <projectId>", "Project id", "default")
  .option("--purpose <purpose>", "Channel purpose", "primary")
  .option("--workspace <workspaceId>", "Workspace id")
  .option("--session <sessionId>", "Session id")
  .option("--task <taskId>", "Task id")
  .option("--channel <channelId>", "Explicit channel id")
  .option("--json", "Output raw JSON")
  .action(async (options) => {
    const runtime = await createRuntime();
    const result = runtime.openChannel({
      actorId: options.actor,
      source: options.source,
      projectId: options.project,
      purpose: options.purpose,
      workspaceId: options.workspace,
      sessionId: options.session,
      taskId: options.task,
      channelId: options.channel,
      isPrimary: options.purpose === "primary",
      metadata: { createdBy: "cli.channel.open" },
    });
    writeCliLog("cli.channel.open", result.reused ? "CLI channel restored" : "CLI channel opened", {
      actorId: options.actor,
      source: options.source,
      projectId: options.project,
      purpose: options.purpose,
      channel: result.entry.channelId,
      sessionId: options.session,
      taskId: options.task,
      reused: result.reused,
    });
    if (options.json) {
      console.log(JSON.stringify({ success: true, ...result }, null, 2));
      return;
    }
    const lang = currentLang(program.opts().lang);
    console.log(chalk.green(`${t(lang, result.reused ? "channelReused" : "channelOpened")}: ${result.entry.channelId}`));
    printChannelEntry(result.entry, lang);
  });

channelCommand
  .command("list")
  .description("List governed channels")
  .option("--actor <actorId>", "Actor id")
  .option("--project <projectId>", "Project id")
  .option("--source <source>", "Source id")
  .option("--purpose <purpose>", "Channel purpose")
  .option("--status <status>", "Channel status")
  .option("--json", "Output raw JSON")
  .action(async (options) => {
    const lang = currentLang(program.opts().lang);
    const runtime = await createRuntime();
    const entries = runtime.listChannels({
      actorId: options.actor,
      projectId: options.project,
      source: options.source,
      purpose: options.purpose,
      status: options.status,
    });
    writeCliLog("cli.channel.list", "CLI channel list completed", {
      actorId: options.actor,
      source: options.source,
      projectId: options.project,
      purpose: options.purpose,
      status: options.status,
      resultCount: entries.length,
    });
    if (options.json) {
      console.log(JSON.stringify({ success: true, entries }, null, 2));
      return;
    }
    printSectionTitle(t(lang, "channelListTitle"));
    printKeyValue(t(lang, "resultCount"), String(entries.length));
    printKeyValue(t(lang, "channelFiltersHint"), [options.actor, options.source, options.project, options.purpose, options.status].filter(Boolean).join(" | ") || "-");
    console.log();
    for (const entry of entries) {
      printChannelEntry(entry, lang);
      console.log();
    }
  });

channelCommand
  .command("status")
  .description("Show one governed channel")
  .argument("<channelId>", "Channel id")
  .option("--json", "Output raw JSON")
  .action(async (channelId, options) => {
    const lang = currentLang(program.opts().lang);
    const runtime = await createRuntime();
    const entry = runtime.getChannel(channelId);
    if (!entry) {
      writeCliLog("cli.channel.status", "CLI channel status lookup failed", { channel: channelId }, "warn");
      console.log(chalk.red(`${t(lang, "channelUnknown")}: ${channelId}`));
      process.exitCode = 1;
      return;
    }
    writeCliLog("cli.channel.status", "CLI channel status completed", {
      channel: channelId,
      actorId: entry.actorId,
      source: entry.source,
      projectId: entry.projectId,
      purpose: entry.purpose,
      status: entry.status,
    });
    if (options.json) {
      console.log(JSON.stringify({ success: true, entry }, null, 2));
      return;
    }
    printSectionTitle(t(lang, "channelStatusTitle"));
    printChannelEntry(entry, lang);
  });

channelCommand
  .command("use")
  .description("Mark a channel active for later reuse")
  .argument("<channelId>", "Channel id")
  .option("--json", "Output raw JSON")
  .action(async (channelId, options) => {
    const runtime = await createRuntime();
    const entry = runtime.useChannel(channelId);
    writeCliLog("cli.channel.use", "CLI channel marked active", {
      channel: channelId,
      actorId: entry.actorId,
      source: entry.source,
      projectId: entry.projectId,
      purpose: entry.purpose,
      status: entry.status,
    });
    if (options.json) {
      console.log(JSON.stringify({ success: true, entry }, null, 2));
      return;
    }
    console.log(chalk.green(`${t(currentLang(program.opts().lang), "channelActive")}: ${entry.channelId}`));
  });

channelCommand
  .command("close")
  .description("Close a governed channel")
  .argument("<channelId>", "Channel id")
  .option("--json", "Output raw JSON")
  .action(async (channelId, options) => {
    const runtime = await createRuntime();
    const entry = runtime.closeChannel(channelId);
    writeCliLog("cli.channel.close", "CLI channel closed", {
      channel: channelId,
      actorId: entry.actorId,
      source: entry.source,
      projectId: entry.projectId,
      purpose: entry.purpose,
      status: entry.status,
    });
    if (options.json) {
      console.log(JSON.stringify({ success: true, entry }, null, 2));
      return;
    }
    console.log(chalk.green(`${t(currentLang(program.opts().lang), "channelClosed")}: ${entry.channelId}`));
  });

const dataCommand = program
  .command("data")
  .description(helpText("Manage MemoHub-managed data directories"));

appendWorkflowGuidance(dataCommand, [
  "Always preview first: memohub data status or memohub data clean --actor hermes --purpose test --dry-run",
  "Use test-channel cleanup for onboarding verification instead of clearing all data",
  "Use rebuild-schema only for old schema recovery or first real integration with explicit authorization",
]);

dataCommand
  .command("status")
  .description("Preview MemoHub-managed data directories without deleting anything")
  .option("--json", "Output raw JSON")
  .action((options) => {
    const result = cleanManagedData({ dryRun: true });
    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }
    const lang = currentLang(program.opts().lang);
    console.log(chalk.bold.cyan(t(lang, "dataStatusTitle")));
    console.log(t(lang, "noDataDeleted"));
    console.log(`${t(lang, "confirmationPhrase")}: ${DATA_CLEAN_CONFIRMATION}`);
    for (const target of result.targets as string[]) console.log(`- ${target}`);
  });

dataCommand
  .command("rebuild-schema")
  .description(cliCommand("data rebuild-schema").description)
  .option("--yes", "Acknowledge destructive schema rebuild")
  .option("--confirm <phrase>", `Required confirmation phrase: ${DATA_CLEAN_CONFIRMATION}`)
  .option("--json", "Output raw JSON")
  .action((options) => {
    const authorized = options.yes === true && options.confirm === DATA_CLEAN_CONFIRMATION;
    const result = authorized
      ? { success: true, action: "rebuild_schema", message: "Managed data store rebuilt. Restart any running MemoHub MCP server before retesting.", ...resetGlobalConfig() }
      : { success: false, error: `Refusing to rebuild schema. Pass --yes --confirm ${DATA_CLEAN_CONFIRMATION}.` };
    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
      if (!result.success) process.exitCode = 1;
      return;
    }
    if (!result.success) {
      console.log(chalk.red(String(result.error)));
      process.exitCode = 1;
      return;
    }
    console.log(chalk.green(String(result.message)));
    console.log(`${t(currentLang(program.opts().lang), "configFile")}: ${result.configPath}`);
  });

dataCommand
  .command("clean")
  .description("High-risk cleanup for MemoHub-managed data; defaults to dry-run")
  .option("--dry-run", "Preview cleanup targets without deleting data", true)
  .option("--all", "Select all MemoHub-managed data directories")
  .option("--channel <channel>", "Clean only vector records from one channel")
  .option("--actor <actorId>", "Select governed channels by actor")
  .option("--project <projectId>", "Select governed channels by project id")
  .option("--source <source>", "Select governed channels by source id")
  .option("--purpose <purpose>", "Select governed channels by purpose")
  .option("--status <status>", "Select governed channels by lifecycle status")
  .option("--yes", "Acknowledge destructive cleanup")
  .option("--confirm <phrase>", `Required confirmation phrase: ${DATA_CLEAN_CONFIRMATION}`)
  .option("--json", "Output raw JSON")
  .action(async (options) => {
    const selectorRequested = Boolean(options.actor || options.project || options.source || options.purpose || options.status);
    if (selectorRequested) {
      const runtime = await createRuntime();
      const shouldDeleteSelected = options.yes === true && options.confirm === DATA_CLEAN_CONFIRMATION;
      const result = await cleanChannelsBySelector(runtime, {
        actorId: options.actor,
        projectId: options.project,
        source: options.source,
        purpose: options.purpose,
        status: options.status,
        dryRun: !shouldDeleteSelected,
        yes: options.yes,
        confirm: options.confirm,
      });
      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
        if (!result.success) process.exitCode = 1;
        return;
      }
      const lang = currentLang(program.opts().lang);
      if (!result.success) {
        console.log(chalk.red(String(result.error)));
        process.exitCode = 1;
        return;
      }
      if (result.dryRun) {
        console.log(chalk.yellow(t(lang, "noChannelDataDeleted")));
        console.log(`${t(lang, "matchedRecords")}: ${Number(result.matchedRecords ?? 0)}`);
        console.log(`${t(lang, "resultCount")}: ${Number(result.matchedChannels ?? 0)}`);
        console.log(`${t(lang, "deleteCommand")}: memohub data clean --actor ${options.actor ?? "<actor>"}${options.project ? ` --project ${options.project}` : ""}${options.purpose ? ` --purpose ${options.purpose}` : ""}${options.source ? ` --source ${options.source}` : ""}${options.status ? ` --status ${options.status}` : ""} --yes --confirm ${DATA_CLEAN_CONFIRMATION}`);
        return;
      }
      console.log(chalk.green(`${t(lang, "deletedChannelRecords")}: ${Number(result.matchedRecords ?? 0)}`));
      console.log(`${t(lang, "resultCount")}: ${Number(result.matchedChannels ?? 0)}`);
      return;
    }

    if (options.channel) {
      const runtime = await createRuntime();
      if (!runtime.getChannel(options.channel)) {
        const message = `${t(currentLang(program.opts().lang), "channelUnknown")}: ${options.channel}`;
        if (options.json) {
          console.log(JSON.stringify({ success: false, error: message }, null, 2));
          process.exitCode = 1;
          return;
        }
        console.log(chalk.red(message));
        process.exitCode = 1;
        return;
      }
      const shouldDeleteChannel = options.yes === true && options.confirm === DATA_CLEAN_CONFIRMATION;
      const result = await cleanChannelData(runtime.vectorStore, {
        channel: options.channel,
        dryRun: !shouldDeleteChannel,
        yes: options.yes,
        confirm: options.confirm,
      });
      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
        return;
      }
      if (!result.success) {
        console.log(chalk.red(String(result.error)));
        process.exitCode = 1;
        return;
      }
      if (result.dryRun) {
        const lang = currentLang(program.opts().lang);
        console.log(chalk.yellow(t(lang, "noChannelDataDeleted")));
        console.log(`${t(lang, "matchedRecords")}: ${result.matchedRecords}`);
        console.log(`${t(lang, "deleteCommand")}: memohub data clean --channel ${options.channel} --yes --confirm ${DATA_CLEAN_CONFIRMATION}`);
        return;
      }
      console.log(chalk.green(`${t(currentLang(program.opts().lang), "deletedChannelRecords")}: ${result.deletedRecords} (${options.channel})`));
      return;
    }

    const shouldDelete = options.all === true && options.yes === true && options.confirm === DATA_CLEAN_CONFIRMATION;
    const result = cleanManagedData({
      dryRun: !shouldDelete,
      all: options.all,
      yes: options.yes,
      confirm: options.confirm,
    });
    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }
    if (!result.success) {
      console.log(chalk.red(String(result.error)));
      for (const target of result.targets as string[]) console.log(`- ${target}`);
      process.exitCode = 1;
      return;
    }
    if (result.dryRun) {
      const lang = currentLang(program.opts().lang);
      console.log(chalk.yellow(t(lang, "noDataDeleted")));
      console.log(`${t(lang, "deleteCommand")}: memohub data clean --all --yes --confirm ${DATA_CLEAN_CONFIRMATION}`);
      for (const target of result.targets as string[]) console.log(`- ${target}`);
      return;
    }
    console.log(chalk.green(t(currentLang(program.opts().lang), "deletedManagedData")));
    for (const target of result.removed as string[]) console.log(`- ${target}`);
  });

const mcpCommand = program
  .command("mcp")
  .description(helpText("Manage MCP access, diagnostics, logs, and server lifecycle"));

appendWorkflowGuidance(mcpCommand, [
  "Get Hermes connection config: memohub mcp config --target hermes",
  "Inspect live tool contract: memohub mcp tools",
  "Run readiness checks before onboarding: memohub mcp doctor",
  "Start stdio MCP service for agents: memohub mcp serve",
]);

mcpCommand
  .command("config")
  .description(cliCommand("mcp config").description)
  .option("--target <target>", "Config target: generic or hermes", "generic")
  .option("--json", "Output raw JSON")
  .action(async (options) => {
    const lang = currentLang(program.opts().lang);
    const runtimeConfig = loadRuntimeConfig();
    const config = createMcpClientConfig(options.target, process.cwd(), runtimeConfig);
    if (options.json) {
      console.log(JSON.stringify(config, null, 2));
      return;
    }
    console.log(chalk.bold.cyan(t(lang, "mcpConfigTitle")));
    const server = (config as any).mcpServers?.memohub ?? (config as any).mcp_servers?.memohub;
    printKeyValue(t(lang, "command"), `${server.command} ${server.args.join(" ")}`);
    printKeyValue(t(lang, "cwd"), server.cwd);
    printKeyValue(t(lang, "logPath"), runtimeConfig.mcp.logPath);
    console.log();
    printSectionTitle(t(lang, "guidanceTitle"));
    console.log(`- ${t(lang, "agentHint")}`);
    console.log(`- ${t(lang, "nextSteps")}: memohub config check`);
    console.log(`- ${t(lang, "nextSteps")}: memohub mcp doctor`);
    console.log(`- ${t(lang, "nextSteps")}: memohub mcp serve`);
  });

mcpCommand
  .command("tools")
  .description(cliCommand("mcp tools").description)
  .option("--json", "Output raw JSON")
  .action((options) => {
    const lang = currentLang(program.opts().lang);
    const runtimeConfig = loadRuntimeConfig();
    const catalog = createMcpAccessCatalog(process.cwd(), runtimeConfig);
    if (options.json) console.log(JSON.stringify(catalog, null, 2));
    else printMcpToolsSummary(catalog, lang);
  });

mcpCommand
  .command("status")
  .description(cliCommand("mcp status").description)
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
      latestLogs: logger.readEntries(5),
    };
    if (options.json) {
      console.log(JSON.stringify(status, null, 2));
      return;
    }
    printSectionTitle(t(lang, "mcpStatusTitle"));
    printKeyValue(t(lang, "status"), t(lang, "ready"));
    printKeyValue(t(lang, "runtime"), stats.runtime);
    printKeyValue(t(lang, "toolCount"), String(status.catalog.tools.length));
    printKeyValue(t(lang, "resources"), status.catalog.resources.map((resource) => resource.uri).join(", "));
    printKeyValue(t(lang, "views"), status.catalog.views.join(", "));
    console.log();
    printSectionTitle(t(lang, "storageTitle"));
    printKeyValue(t(lang, "root"), status.catalog.storage.root);
    printKeyValue(t(lang, "dataPath"), status.catalog.storage.dataPath);
    printKeyValue(t(lang, "blob"), status.catalog.storage.blobPath);
    printKeyValue(t(lang, "mcpLog"), runtimeConfig.mcp.logPath);
    printKeyValue(t(lang, "registryPath"), status.catalog.registry.channelRegistryPath);
    console.log();
    printSectionTitle(t(lang, "recentLogsTitle"));
    if (status.latestLogs.length === 0) console.log(`- ${t(lang, "noLogs")}`);
    for (const entry of status.latestLogs) console.log(`- ${entry.timestamp} [${entry.level}] ${entry.event}`);
  });

mcpCommand
  .command("doctor")
  .description(cliCommand("mcp doctor").description)
  .option("--json", "Output raw JSON")
  .action(async (options) => {
    const lang = currentLang(program.opts().lang);
    const runtime = await createRuntime();
    const result = await runMcpDoctor(runtime);
    if (options.json) console.log(JSON.stringify(result, null, 2));
    else printDoctorSummary(result, lang);
    if (!result.ok) process.exitCode = 1;
  });

mcpCommand
  .command("serve")
  .description(cliCommand("serve").description)
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

const logsCommand = program
  .command("logs")
  .description(helpText("Query MemoHub logs"));

appendWorkflowGuidance(logsCommand, [
  "Start broad: memohub logs query --tail 100",
  "Narrow by channel during onboarding verification: memohub logs query --channel hermes:mcp-test",
  "Narrow by session during one task: memohub logs query --session session:2026-04-30-hermes-docs",
  "Use --json when another tool or agent needs to parse results",
]);

logsCommand
  .command("query")
  .description(cliCommand("logs query").description)
  .option("--tail <lines>", "Number of log lines", "50")
  .option("--event <event>", "Filter by log event name")
  .option("--channel <channel>", "Filter by channel id")
  .option("--project <projectId>", "Filter by project id")
  .option("--session <sessionId>", "Filter by session id")
  .option("--task <taskId>", "Filter by task id")
  .option("--source <source>", "Filter by source id")
  .option("--level <level>", "Filter by log level")
  .option("--json", "Output raw JSON")
  .action((options) => {
    const lang = currentLang(program.opts().lang);
    const runtimeConfig = loadRuntimeConfig();
    const logger = new McpLogger(runtimeConfig.mcp.logPath);
    const entries = filterLogEntries(logger.readEntries(Number(options.tail)), {
      level: options.level,
      event: options.event,
      channel: options.channel,
      project: options.project,
      session: options.session,
      task: options.task,
      source: options.source,
    });
    if (entries.length === 0 && !options.json) {
      console.log(`${t(lang, "noLogs")}\n${t(lang, "mcpLog")}: ${logger.path}`);
      return;
    }
    printLogEntries(entries, lang, options.json);
  });

program
  .command("serve")
  .description(helpText("Start the MCP server"))
  .action(async () => {
    const runtimeConfig = loadRuntimeConfig();
    const logger = new McpLogger(runtimeConfig.mcp.logPath);
    try {
      const runtime = await createRuntime();
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

sortTopLevelCommands(program);
program.parse();
