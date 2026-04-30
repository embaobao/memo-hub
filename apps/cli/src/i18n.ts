import { execFileSync } from "node:child_process";

export type CliLang = "zh" | "en";

export function resolveLang(input?: string, configured?: string): CliLang {
  if (input === "en" || input === "zh") return input;
  if (configured === "en" || configured === "zh") return configured;
  const systemLocale = detectSystemLocale();
  if (systemLocale === "zh") return "zh";
  if (systemLocale === "en") return "en";

  const env = `${process.env.MEMOHUB_LANG ?? ""} ${process.env.LC_ALL ?? ""} ${process.env.LC_MESSAGES ?? ""} ${process.env.LANG ?? ""} ${Intl.DateTimeFormat().resolvedOptions().locale ?? ""}`.toLowerCase();
  // 配置为 auto 时按系统语言；无法判断时默认中文。
  if (env.includes("zh")) return "zh";
  if (env.includes("en")) return "en";
  return "zh";
}

function detectSystemLocale(): CliLang | undefined {
  return detectSystemLocaleForPlatform(process.platform);
}

export function detectSystemLocaleForPlatform(platform: NodeJS.Platform): CliLang | undefined {
  if (platform === "darwin") {
    const appleLanguages = process.env.APPLE_LANGUAGES?.toLowerCase();
    const appleLocale = process.env.APPLE_LOCALE?.toLowerCase();
    const defaultsLocale = readMacDefaultsLocale();
    const combined = `${appleLanguages ?? ""} ${appleLocale ?? ""} ${defaultsLocale ?? ""}`;
    const detected = detectLangFromLocaleText(combined);
    if (detected) return detected;
  }

  if (platform === "linux") {
    const locale = readLinuxLocale();
    const detected = detectLangFromLocaleText(locale);
    if (detected) return detected;
  }

  if (platform === "win32") {
    const locale = readWindowsLocale();
    const detected = detectLangFromLocaleText(locale);
    if (detected) return detected;
  }

  const intlLocale = Intl.DateTimeFormat().resolvedOptions().locale?.toLowerCase();
  if (intlLocale?.includes("zh")) return "zh";
  if (intlLocale?.includes("en")) return "en";
  return undefined;
}

export function detectLangFromLocaleText(localeText?: string): CliLang | undefined {
  const normalized = localeText?.toLowerCase();
  if (!normalized) return undefined;
  if (normalized.includes("zh")) return "zh";
  if (normalized.includes("en")) return "en";
  return undefined;
}

function readMacDefaultsLocale(): string | undefined {
  try {
    const languages = execFileSync("defaults", ["read", "-g", "AppleLanguages"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).toLowerCase();
    const locale = execFileSync("defaults", ["read", "-g", "AppleLocale"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).toLowerCase();
    return `${languages} ${locale}`;
  } catch {
    return undefined;
  }
}

function readLinuxLocale(): string | undefined {
  try {
    return execFileSync("locale", [], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).toLowerCase();
  } catch {
    return undefined;
  }
}

function readWindowsLocale(): string | undefined {
  try {
    return execFileSync(
      "powershell",
      ["-NoProfile", "-Command", "[System.Globalization.CultureInfo]::InstalledUICulture.Name"],
      {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      },
    ).toLowerCase();
  } catch {
    return undefined;
  }
}

const helpTextMap = {
  zh: {
    "MemoHub - unified AI memory hub": "MemoHub - 统一 AI 记忆中枢",
    "output the version number": "输出版本号",
    "Output language: zh or en": "输出语言：zh 或 en",
    "Inspect current Memory OS registry and AI resources": "检查当前记忆中枢注册表与 AI 资源",
    "Output raw JSON": "输出原始 JSON",
    "Inject a new memory through the Integration Hub write path": "通过 Integration Hub 写入一条新记忆",
    "Current project": "当前项目",
    "Source descriptor id": "来源标识",
    "Governed channel id": "治理渠道 ID",
    "Workspace binding": "工作区绑定",
    "Session binding": "会话绑定",
    "Task binding": "任务绑定",
    "Memory category/domain hint": "记忆分类或领域提示",
    "Related source file path": "关联源文件路径",
    "Query a named layered context view through self/project/global recall": "通过自己/项目/全局分层召回查询命名视图",
    "Named context view": "命名上下文视图",
    "Requesting agent or actor": "请求方角色",
    "Per-layer result limit": "每层结果上限",
    "List governed memory objects directly by actor/project/global perspective": "按角色/项目/全局视角直接列出治理后的记忆对象",
    "Governance perspective: actor, project, or global": "治理视角：actor、project 或 global",
    "Actor id for actor perspective": "actor 视角对应的角色 ID",
    "Project id for project perspective": "project 视角对应的项目 ID",
    "Optional domain filter": "可选领域过滤",
    "Result limit": "结果上限",
    "Create a governed summary candidate from explicit text": "从显式文本生成治理摘要候选",
    "Agent identity": "角色标识",
    "Manage clarification creation and resolution": "管理澄清创建与澄清回写",
    "Create clarification questions for explicit conflicting or missing memory text": "为冲突或缺失的记忆文本生成澄清问题",
    "Resolving agent identity": "执行澄清回写的角色标识",
    "Memory ids resolved by this answer": "被本次澄清解决的记忆 ID",
    "Manage MemoHub configuration": "管理 MemoHub 配置",
    "Print resolved new-architecture runtime configuration": "打印当前新架构运行时配置",
    "Check global configuration and initialize it when missing": "检查全局配置，并在缺失时完成初始化",
    "Remove global MemoHub configuration fragments with second confirmation": "二次确认后删除全局 MemoHub 配置",
    "Acknowledge destructive config removal": "确认执行破坏性配置删除",
    "Read a raw configuration value by dotted path": "按点路径读取原始配置值",
    "Write a raw configuration value by dotted path": "按点路径写入原始配置值",
    "Manage governed channel bindings": "管理治理渠道绑定",
    "Open or restore a governed channel binding": "打开或恢复一个治理渠道绑定",
    "Owner actor id": "所有者角色 ID",
    "Source id": "来源 ID",
    "Project id": "项目 ID",
    "Channel purpose": "渠道用途",
    "Workspace id": "工作区 ID",
    "Session id": "会话 ID",
    "Task id": "任务 ID",
    "Explicit channel id": "显式渠道 ID",
    "List governed channels": "列出治理渠道",
    "Filter by owner actor": "按所有者角色过滤",
    "Filter by project": "按项目过滤",
    "Filter by source": "按来源过滤",
    "Filter by purpose": "按用途过滤",
    "Filter by status": "按状态过滤",
    "Show one governed channel": "查看单个治理渠道",
    "Mark a channel active for later reuse": "将渠道标记为激活，便于后续复用",
    "Close a governed channel": "关闭治理渠道",
    "Manage MemoHub-managed data directories": "管理 MemoHub 托管数据目录",
    "Preview MemoHub-managed data directories without deleting anything": "预览 MemoHub 托管数据目录，不做删除",
    "High-risk: rebuild the managed data store schema after explicit user authorization": "高风险：在显式授权后重建托管数据存储 Schema",
    "Acknowledge destructive schema rebuild": "确认执行破坏性 Schema 重建",
    "High-risk cleanup for MemoHub-managed data; defaults to dry-run": "高风险清理 MemoHub 托管数据，默认仅 dry-run",
    "Preview cleanup targets without deleting data": "预览清理目标但不删除数据",
    "Select all MemoHub-managed data directories": "选择全部 MemoHub 托管数据目录",
    "Clean only vector records from one channel": "仅清理某个渠道的向量记录",
    "Select governed channels by owner actor": "按所有者角色选择治理渠道",
    "Select governed channels by project id": "按项目 ID 选择治理渠道",
    "Select governed channels by source id": "按来源 ID 选择治理渠道",
    "Select governed channels by purpose": "按用途选择治理渠道",
    "Select governed channels by lifecycle status": "按生命周期状态选择治理渠道",
    "Acknowledge destructive cleanup": "确认执行破坏性清理",
    "Print MCP client config and agent skill instructions": "打印 MCP 客户端配置与 Agent Skill 接入说明",
    "Config target: generic or hermes": "配置目标：generic 或 hermes",
    "Print current MCP tools, resources, views, and agent instructions": "打印当前 MCP 工具、资源、视图与 Agent 接入说明",
    "Check MemoHub MCP runtime status, storage paths, and exposed dimensions": "检查 MemoHub MCP 运行状态、存储路径与暴露维度",
    "Validate MCP access readiness, catalog consistency, config, log writability, and runtime schema health": "校验 MCP 接入准备、目录一致性、配置、日志可写性与运行时 Schema 健康度",
    "Start the MCP (Model Context Protocol) server": "启动 MCP（Model Context Protocol）服务",
    "Query MemoHub logs": "查询 MemoHub 日志",
    "Read MemoHub logs with readable filters for event, channel, project, session, task, and source": "按事件、渠道、项目、会话、任务和来源过滤查询 MemoHub 日志",
    "Number of log lines": "日志行数",
    "Filter by log event name": "按日志事件名过滤",
    "Filter by channel id": "按渠道 ID 过滤",
    "Filter by project id": "按项目 ID 过滤",
    "Filter by session id": "按会话 ID 过滤",
    "Filter by task id": "按任务 ID 过滤",
    "Filter by source id": "按来源 ID 过滤",
    "Filter by log level": "按日志级别过滤",
    "Start the MCP server": "启动 MCP 服务",
    "First-time setup: memohub config check -> memohub config show -> memohub mcp doctor": "首次接入：memohub config check -> memohub config show -> memohub mcp doctor",
    "Bind an actor channel: memohub channel open --actor hermes --source hermes --project memo-hub --purpose primary": "绑定角色渠道：memohub channel open --actor hermes --source hermes --project memo-hub --purpose primary",
    "Write and query memory: memohub add ... -> memohub query ...": "写入并查询记忆：memohub add ... -> memohub query ...",
    "Start MCP for agents: memohub mcp config --target hermes -> memohub mcp serve": "为 Agent 启动 MCP：memohub mcp config --target hermes -> memohub mcp serve",
    "Troubleshoot with logs: memohub logs query --tail 100 --channel <channel>": "通过日志排障：memohub logs query --tail 100 --channel <channel>",
    "High-risk governance: memohub data status -> memohub data clean/rebuild-schema only with explicit confirmation": "高风险治理：memohub data status -> memohub data clean/rebuild-schema，仅在显式确认后执行",
    "Get Hermes connection config: memohub mcp config --target hermes": "获取 Hermes 接入配置：memohub mcp config --target hermes",
    "Inspect live tool contract: memohub mcp tools": "查看当前工具契约：memohub mcp tools",
    "Run readiness checks before onboarding: memohub mcp doctor": "接入前执行就绪检查：memohub mcp doctor",
    "Start stdio MCP service for agents: memohub mcp serve": "为 Agent 启动 stdio MCP 服务：memohub mcp serve",
    "Check and initialize config first: memohub config check": "先检查并初始化配置：memohub config check",
    "Inspect resolved paths and models: memohub config show": "查看解析后的路径与模型：memohub config show",
    "Read one field: memohub config get mcp.logPath": "读取单个配置项：memohub config get mcp.logPath",
    "Write one field: memohub config set system.lang '\"zh\"'": "写入单个配置项：memohub config set system.lang '\"zh\"'",
    "Uninstall only when you want to remove MemoHub config entirely: memohub config uninstall --yes --confirm DELETE_MEMOHUB_CONFIG": "仅在要彻底移除 MemoHub 配置时卸载：memohub config uninstall --yes --confirm DELETE_MEMOHUB_CONFIG",
    "display help for command": "显示命令帮助",
  },
  en: {},
} as const;

export function localizeHelpText(text: string, lang: CliLang): string {
  if (lang === "en") return text;
  const direct = helpTextMap.zh[text as keyof typeof helpTextMap.zh];
  if (direct) return direct;
  return text
    .replace(/^Required confirmation phrase: (.+)$/u, "必需确认短语：$1")
    .replace(/^Text content$/u, "文本内容")
    .replace(/^Natural language query$/u, "自然语言查询")
    .replace(/^Text to summarize$/u, "待总结文本")
    .replace(/^Text needing clarification$/u, "需要澄清的文本")
    .replace(/^Clarification item id$/u, "澄清项 ID")
    .replace(/^Clarification answer$/u, "澄清回答")
    .replace(/^Dotted config path$/u, "点路径配置项")
    .replace(/^JSON or string value$/u, "JSON 或字符串值")
    .replace(/^Path$/u, "路径");
}

export function localizeHelpOutput(text: string, lang: CliLang): string {
  if (lang === "en") return text;
  let output = text
    .replace(/^Usage:/gmu, "用法：")
    .replace(/^Options:/gmu, "选项：")
    .replace(/^Commands:/gmu, "命令：")
    .replace(/^Arguments:/gmu, "参数：")
    .replace(/^Aliases:/gmu, "别名：")
    .replace(/^Examples:/gmu, "示例：")
    .replace(/^Workflow Guide:/gmu, "流程指引：")
    .replace(/display help for command/gmu, "显示命令帮助");
  output = output
    .replace(/Manage MCP access, diagnostics, logs, and\s+server lifecycle/gmu, "管理 MCP 接入、诊断、日志与服务生命周期")
    .replace(/Print current MCP tools, resources, views, and agent\s+instructions/gmu, "打印当前 MCP 工具、资源、视图与 Agent 接入说明")
    .replace(/Check MemoHub MCP runtime status, storage paths, and\s+exposed dimensions/gmu, "检查 MemoHub MCP 运行状态、存储路径与暴露维度")
    .replace(/Validate MCP access readiness, catalog consistency, config,\s+log writability, and runtime schema health/gmu, "校验 MCP 接入准备、目录一致性、配置、日志可写性与运行时 Schema 健康度")
    .replace(/Print resolved new-architecture runtime\s+configuration/gmu, "打印当前新架构运行时配置")
    .replace(/Check global configuration and initialize it\s+when missing/gmu, "检查全局配置，并在缺失时完成初始化")
    .replace(/Remove global MemoHub configuration fragments\s+with second confirmation/gmu, "二次确认后删除全局 MemoHub 配置")
    .replace(/Check and initialize config first: memohub config check/gmu, "先检查并初始化配置：memohub config check")
    .replace(/Inspect resolved paths and models: memohub config show/gmu, "查看解析后的路径与模型：memohub config show")
    .replace(/Read one field: memohub config get mcp\.logPath/gmu, "读取单个配置项：memohub config get mcp.logPath")
    .replace(/Write one field: memohub config set system\.lang '"zh"'/gmu, "写入单个配置项：memohub config set system.lang '\"zh\"'")
    .replace(/Uninstall only when you want to remove MemoHub config entirely: memohub config uninstall --yes --confirm DELETE_MEMOHUB_CONFIG/gmu, "仅在要彻底移除 MemoHub 配置时卸载：memohub config uninstall --yes --confirm DELETE_MEMOHUB_CONFIG")
    .replace(/Get Hermes connection config: memohub mcp config --target hermes/gmu, "获取 Hermes 接入配置：memohub mcp config --target hermes")
    .replace(/Inspect live tool contract: memohub mcp tools/gmu, "查看当前工具契约：memohub mcp tools")
    .replace(/Run readiness checks before onboarding: memohub mcp doctor/gmu, "接入前执行就绪检查：memohub mcp doctor")
    .replace(/Start stdio MCP service for agents: memohub mcp serve/gmu, "为 Agent 启动 stdio MCP 服务：memohub mcp serve")
    .replace(/Inspect current Memory OS registry and AI\s+resources/gmu, "检查当前记忆中枢注册表与 AI 资源")
    .replace(/Inject a new memory through the\s+Integration Hub write path/gmu, "通过 Integration Hub 写入一条新记忆")
    .replace(/Query a named layered context view through\s+self\/project\/global recall/gmu, "通过自己/项目/全局分层召回查询命名视图")
    .replace(/List governed memory objects directly by\s+actor\/project\/global perspective/gmu, "按角色/项目/全局视角直接列出治理后的记忆对象")
    .replace(/Create a governed summary candidate from\s+explicit text/gmu, "从显式文本生成治理摘要候选")
    .replace(/Manage clarification creation and\s+resolution/gmu, "管理澄清创建与澄清回写")
    ;
  for (const [source, target] of Object.entries(helpTextMap.zh)) {
    output = output.replaceAll(source, target);
  }
  return output;
}

export function resolveLangFromArgv(argv: string[] = process.argv): CliLang | undefined {
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--lang") {
      const next = argv[index + 1];
      if (next === "zh" || next === "en") return next;
    }
    if (token?.startsWith("--lang=")) {
      const value = token.slice("--lang=".length);
      if (value === "zh" || value === "en") return value;
    }
  }
  return undefined;
}

const messages = {
  zh: {
    runtimeTitle: "MemoHub 运行时",
    configTitle: "MemoHub 配置",
    queryTitle: "MemoHub 查询结果",
    channelListTitle: "MemoHub 渠道列表",
    channelStatusTitle: "MemoHub 渠道状态",
    summaryTitle: "概览",
    identityTitle: "身份绑定",
    storageTitle: "存储与注册表",
    contractTitle: "写入约定",
    guidanceTitle: "接入指引",
    recentLogsTitle: "最近日志",
    layerSelf: "自己",
    layerProject: "项目",
    layerGlobal: "全局",
    resultCount: "结果数",
    totalHits: "总命中",
    actorId: "Agent",
    projectId: "项目",
    scopeView: "视图",
    channelId: "渠道",
    purpose: "用途",
    state: "状态",
    primaryFlag: "主渠道",
    yes: "是",
    no: "否",
    owner: "所有者",
    createdAt: "创建时间",
    updatedAt: "最近活动",
    registryPath: "渠道注册表",
    dataPath: "数据目录",
    itemPreview: "内容摘要",
    noResults: "没有召回结果。",
    recommendedMetadata: "推荐元数据",
    eventFields: "事件字段",
    payloadFields: "负载字段",
    identityFields: "身份字段",
    toolGroupCore: "核心读写",
    toolGroupGovernance: "治理与诊断",
    commandSnippet: "命令片段",
    channelFiltersHint: "可按 actor / source / project / purpose / status 过滤",
    selected: "当前",
    reusable: "可复用",
    logPath: "日志路径",
    configVersion: "配置版本",
    mcpCatalogTitle: "MemoHub MCP 能力",
    mcpConfigTitle: "MemoHub MCP 接入配置",
    mcpStatusTitle: "MemoHub MCP 状态",
    mcpDoctorTitle: "MemoHub MCP 检查",
    root: "根目录",
    vectorDb: "向量库",
    table: "数据表",
    blob: "Blob",
    embedder: "嵌入模型",
    mcpLog: "MCP 日志",
    views: "查询视图",
    operations: "操作能力",
    command: "命令",
    cwd: "工作目录",
    agentHint: "Agent 接入后先读取: memohub://tools",
    runtime: "运行时",
    model: "模型",
    stores: "存储",
    layers: "查询层级",
    tools: "工具",
    resources: "资源",
    status: "状态",
    ready: "ready",
    toolCount: "工具数",
    passed: "通过",
    failed: "失败",
    accessible: "可接入",
    inaccessible: "不可接入",
    configInitialized: "全局配置已初始化为新架构配置。",
    configFile: "配置文件",
    removedStale: "已删除无效配置目录",
    configUpdated: "配置已更新",
    noLogs: "暂无 MCP 日志。",
    memoryCommitted: "记忆已写入",
    failedPrefix: "失败",
    configCreated: "配置不存在，已初始化。",
    configExists: "配置已存在。",
    configRemoved: "全局配置已删除。",
    channelOpened: "已创建渠道",
    channelReused: "已复用渠道",
    channelActive: "当前激活渠道",
    channelClosed: "已关闭渠道",
    channelUnknown: "未知渠道",
    dataStatusTitle: "MemoHub 数据状态",
    noDataDeleted: "当前仅预览，没有删除任何数据。",
    noChannelDataDeleted: "当前仅预览，没有删除任何渠道数据。",
    confirmationPhrase: "确认短语",
    matchedRecords: "匹配记录数",
    deleteCommand: "执行删除命令",
    deletedChannelRecords: "已删除渠道记录",
    deletedManagedData: "已删除 MemoHub 管理数据目录，重测前请重启 MCP。",
    restartHint: "重测前请重启正在运行的 MCP 服务。",
    commonCommands: "常用命令",
    filters: "筛选条件",
    nextSteps: "下一步",
    logQueryTitle: "MemoHub 日志查询",
    logEvent: "事件",
    logLevel: "级别",
    logChannel: "渠道",
    logSession: "会话",
    logTask: "任务",
    logProject: "项目",
    logSource: "来源",
    logMessage: "消息",
    noMatches: "没有匹配结果。",
    clarificationCreated: "已生成澄清项",
    clarificationResolved: "已写回澄清结果",
  },
  en: {
    runtimeTitle: "MemoHub Runtime",
    configTitle: "MemoHub Configuration",
    queryTitle: "MemoHub Query Result",
    channelListTitle: "MemoHub Channels",
    channelStatusTitle: "MemoHub Channel Status",
    summaryTitle: "Summary",
    identityTitle: "Identity Binding",
    storageTitle: "Storage & Registry",
    contractTitle: "Ingest Contract",
    guidanceTitle: "Guidance",
    recentLogsTitle: "Recent Logs",
    layerSelf: "Self",
    layerProject: "Project",
    layerGlobal: "Global",
    resultCount: "Results",
    totalHits: "Total hits",
    actorId: "Agent",
    projectId: "Project",
    scopeView: "View",
    channelId: "Channel",
    purpose: "Purpose",
    state: "Status",
    primaryFlag: "Primary",
    yes: "Yes",
    no: "No",
    owner: "Owner",
    createdAt: "Created at",
    updatedAt: "Last seen",
    registryPath: "Channel registry",
    dataPath: "Data path",
    itemPreview: "Preview",
    noResults: "No recalled memory.",
    recommendedMetadata: "Recommended metadata",
    eventFields: "Event fields",
    payloadFields: "Payload fields",
    identityFields: "Identity fields",
    toolGroupCore: "Core Read/Write",
    toolGroupGovernance: "Governance & Diagnostics",
    commandSnippet: "Command snippet",
    channelFiltersHint: "Filter by actor / source / project / purpose / status",
    selected: "Current",
    reusable: "Reusable",
    logPath: "Log path",
    configVersion: "Config version",
    mcpCatalogTitle: "MemoHub MCP Capabilities",
    mcpConfigTitle: "MemoHub MCP Access Config",
    mcpStatusTitle: "MemoHub MCP Status",
    mcpDoctorTitle: "MemoHub MCP Check",
    root: "Root",
    vectorDb: "Vector DB",
    table: "Table",
    blob: "Blob",
    embedder: "Embedder",
    mcpLog: "MCP log",
    views: "Views",
    operations: "Operations",
    command: "Command",
    cwd: "Working directory",
    agentHint: "Agent should read first: memohub://tools",
    runtime: "Runtime",
    model: "Model",
    stores: "Stores",
    layers: "Query layers",
    tools: "Tools",
    resources: "Resources",
    status: "Status",
    ready: "ready",
    toolCount: "Tool count",
    passed: "PASS",
    failed: "FAIL",
    accessible: "accessible",
    inaccessible: "inaccessible",
    configInitialized: "Global configuration initialized for the new architecture.",
    configFile: "Config file",
    removedStale: "Removed stale config directories",
    configUpdated: "Config updated",
    noLogs: "No MCP logs yet.",
    memoryCommitted: "Memory committed",
    failedPrefix: "Failed",
    configCreated: "Config was missing and has been initialized.",
    configExists: "Config exists.",
    configRemoved: "Global configuration removed.",
    channelOpened: "Opened channel",
    channelReused: "Reused channel",
    channelActive: "Active channel",
    channelClosed: "Closed channel",
    channelUnknown: "Unknown channel",
    dataStatusTitle: "MemoHub Data Status",
    noDataDeleted: "Dry run only. No data was deleted.",
    noChannelDataDeleted: "Dry run only. No channel data was deleted.",
    confirmationPhrase: "Confirmation phrase",
    matchedRecords: "Matched records",
    deleteCommand: "Run to delete",
    deletedChannelRecords: "Deleted channel records",
    deletedManagedData: "MemoHub-managed data directories deleted. Restart MCP before retesting.",
    restartHint: "Restart any running MCP server before retesting.",
    commonCommands: "Common commands",
    filters: "Filters",
    nextSteps: "Next steps",
    logQueryTitle: "MemoHub Log Query",
    logEvent: "Event",
    logLevel: "Level",
    logChannel: "Channel",
    logSession: "Session",
    logTask: "Task",
    logProject: "Project",
    logSource: "Source",
    logMessage: "Message",
    noMatches: "No matching log entries.",
    clarificationCreated: "Clarification created",
    clarificationResolved: "Clarification resolved",
  },
} as const;

export function t(lang: CliLang, key: keyof typeof messages.zh): string {
  return messages[lang][key];
}
