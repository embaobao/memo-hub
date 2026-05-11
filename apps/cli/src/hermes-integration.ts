import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readlinkSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { resolvePath } from "@memohub/config";

export type HermesProviderLanguage = "auto" | "zh" | "en";

export type HermesCommandCheck = {
  name: string;
  ok: boolean;
  detail: string;
};

export type CommandRunner = (
  command: string,
  args: string[],
  options?: { env?: NodeJS.ProcessEnv },
) => {
  ok: boolean;
  stdout: string;
  stderr: string;
  exitCode: number | null;
};

export type HermesIntegrationPaths = {
  memoHubRoot: string;
  hermesHome: string;
  bundledAssetsRoot: string;
  bundledPluginRoot: string;
  integrationRoot: string;
  integrationPluginRoot: string;
  integrationConfigPath: string;
  hermesPluginLink: string;
  hermesConfigLink: string;
};

export type HermesInstallOptions = {
  memoHubRoot?: string;
  hermesHome?: string;
  projectId?: string;
  language?: HermesProviderLanguage;
  workingDirectory?: string;
  testValidation?: boolean;
  bundledAssetsRoot?: string;
};

export type HermesInstallResult = {
  success: boolean;
  paths: HermesIntegrationPaths;
  config: Record<string, unknown>;
  nextSteps: string[];
};

export type HermesDoctorOptions = {
  memoHubRoot?: string;
  hermesHome?: string;
  bundledAssetsRoot?: string;
  runner?: CommandRunner;
};

export type HermesDoctorResult = {
  success: boolean;
  paths: HermesIntegrationPaths;
  requiredPython: string;
  checks: HermesCommandCheck[];
  nextSteps: string[];
};

export type HermesUninstallOptions = {
  memoHubRoot?: string;
  hermesHome?: string;
  bundledAssetsRoot?: string;
  purgeAssets?: boolean;
};

export type HermesUninstallResult = {
  success: boolean;
  paths: HermesIntegrationPaths;
  removed: string[];
};

const PROVIDER_CONFIG_NAME = "provider.json";
const PYTHON_MIN = { major: 3, minor: 9 };

export function getBundledHermesAssetsRoot(moduleUrl = import.meta.url): string {
  const currentFile = fileURLToPath(moduleUrl);
  return resolve(dirname(currentFile), "..", "assets", "hermes");
}

export function resolveHermesIntegrationPaths(options: {
  memoHubRoot?: string;
  hermesHome?: string;
  bundledAssetsRoot?: string;
} = {}): HermesIntegrationPaths {
  const memoHubRoot = resolvePath(options.memoHubRoot ?? "~/.memohub");
  const hermesHome = resolvePath(options.hermesHome ?? join(homedir(), ".hermes"));
  const bundledAssetsRoot = resolve(options.bundledAssetsRoot ?? getBundledHermesAssetsRoot());
  const integrationRoot = join(memoHubRoot, "integrations", "hermes");
  return {
    memoHubRoot,
    hermesHome,
    bundledAssetsRoot,
    bundledPluginRoot: join(bundledAssetsRoot, "plugins", "memory", "memohub"),
    integrationRoot,
    integrationPluginRoot: join(integrationRoot, "plugin"),
    integrationConfigPath: join(integrationRoot, PROVIDER_CONFIG_NAME),
    // Hermes 用户态 memory provider 扫描目录是 ~/.hermes/plugins/<name>。
    hermesPluginLink: join(hermesHome, "plugins", "memohub"),
    hermesConfigLink: join(hermesHome, "memohub-provider.json"),
  };
}

export function installHermesIntegration(options: HermesInstallOptions = {}): HermesInstallResult {
  const paths = resolveHermesIntegrationPaths(options);
  if (!existsSync(paths.bundledPluginRoot)) {
    throw new Error(`Bundled Hermes plugin assets are missing: ${paths.bundledPluginRoot}`);
  }

  removeLegacyHermesPluginPaths(paths);

  mkdirSync(dirname(paths.integrationPluginRoot), { recursive: true });
  rmSync(paths.integrationPluginRoot, { recursive: true, force: true });

  // 先把发布包内插件资产拷贝到 ~/.memohub，自身配置目录才是唯一真实资产来源。
  cpSync(paths.bundledPluginRoot, paths.integrationPluginRoot, {
    recursive: true,
    filter: (path) => !path.replaceAll("\\", "/").includes("/__pycache__/"),
  });

  const existingConfig = readJsonRecord(paths.integrationConfigPath);
  const nextConfig = buildProviderConfig({
    existing: existingConfig,
    projectId: options.projectId,
    language: options.language,
    workingDirectory: options.workingDirectory,
    testValidation: options.testValidation,
  });

  mkdirSync(dirname(paths.integrationConfigPath), { recursive: true });
  writeFileSync(paths.integrationConfigPath, `${JSON.stringify(nextConfig, null, 2)}\n`, "utf8");

  mkdirSync(dirname(paths.hermesPluginLink), { recursive: true });
  mkdirSync(dirname(paths.hermesConfigLink), { recursive: true });
  replaceWithSymlink(paths.hermesPluginLink, paths.integrationPluginRoot, "dir");
  replaceWithSymlink(paths.hermesConfigLink, paths.integrationConfigPath, "file");

  return {
    success: true,
    paths,
    config: nextConfig,
    nextSteps: [
      "hermes memory setup",
      "Select memohub as the active memory provider.",
      "hermes plugins reload",
    ],
  };
}

export function doctorHermesIntegration(options: HermesDoctorOptions = {}): HermesDoctorResult {
  const paths = resolveHermesIntegrationPaths(options);
  const runner = options.runner ?? defaultRunner;
  const checks: HermesCommandCheck[] = [];

  checks.push({
    name: "bundled_assets",
    ok: existsSync(paths.bundledPluginRoot),
    detail: paths.bundledPluginRoot,
  });

  checks.push({
    name: "integration_plugin",
    ok: existsSync(paths.integrationPluginRoot),
    detail: paths.integrationPluginRoot,
  });

  checks.push({
    name: "integration_config",
    ok: existsSync(paths.integrationConfigPath),
    detail: paths.integrationConfigPath,
  });

  checks.push({
    name: "hermes_plugin_link",
    ok: isExpectedLink(paths.hermesPluginLink, paths.integrationPluginRoot),
    detail: `${paths.hermesPluginLink} -> ${paths.integrationPluginRoot}`,
  });

  checks.push({
    name: "hermes_config_link",
    ok: isExpectedLink(paths.hermesConfigLink, paths.integrationConfigPath),
    detail: `${paths.hermesConfigLink} -> ${paths.integrationConfigPath}`,
  });

  const memohubResult = runner("memohub", ["--version"]);
  checks.push({
    name: "memohub_command",
    ok: memohubResult.ok,
    detail: memohubResult.ok
      ? (memohubResult.stdout.trim() || "memohub available")
      : (memohubResult.stderr.trim() || "memohub command is not available"),
  });

  const pythonProbe = detectPython(runner);
  checks.push({
    name: "python_runtime",
    ok: pythonProbe.ok,
    detail: pythonProbe.detail,
  });

  const hermesVersion = probeHermesCommand(runner, paths.hermesHome, ["--version"]);
  checks.push({
    name: "hermes_command",
    ok: hermesVersion.ok,
    detail: hermesVersion.detail,
  });

  const pluginList = probeHermesPluginList(runner, paths.hermesHome, {
    preferNativeDiscovery: options.runner === undefined,
  });
  checks.push({
    name: "plugin_discoverable",
    ok: pluginList.ok,
    detail: pluginList.detail,
  });

  const hardChecks = checks.filter((check) => check.name !== "plugin_discoverable");
  return {
    success: hardChecks.every((check) => check.ok),
    paths,
    requiredPython: ">=3.9",
    checks,
    nextSteps: [
      "hermes memory setup",
      "Select memohub as the active memory provider.",
      "hermes plugins reload",
    ],
  };
}

export function uninstallHermesIntegration(options: HermesUninstallOptions = {}): HermesUninstallResult {
  const paths = resolveHermesIntegrationPaths(options);
  const removed: string[] = [];

  if (existsSync(paths.hermesPluginLink)) {
    rmSync(paths.hermesPluginLink, { recursive: true, force: true });
    removed.push(paths.hermesPluginLink);
  }
  if (existsSync(paths.hermesConfigLink)) {
    rmSync(paths.hermesConfigLink, { force: true });
    removed.push(paths.hermesConfigLink);
  }
  if (options.purgeAssets && existsSync(paths.integrationRoot)) {
    rmSync(paths.integrationRoot, { recursive: true, force: true });
    removed.push(paths.integrationRoot);
  }

  return {
    success: true,
    paths,
    removed,
  };
}

function buildProviderConfig(options: {
  existing: Record<string, unknown>;
  projectId?: string;
  language?: HermesProviderLanguage;
  workingDirectory?: string;
  testValidation?: boolean;
}): Record<string, unknown> {
  const nextConfig: Record<string, unknown> = {
    ...options.existing,
    memohub_command: ["memohub"],
    language: options.language ?? options.existing.language ?? "auto",
    test_validation: options.testValidation ?? options.existing.test_validation ?? true,
  };

  if (options.projectId) nextConfig.project_id = options.projectId;
  else if (!("project_id" in options.existing)) delete nextConfig.project_id;

  if (options.workingDirectory) nextConfig.working_directory = resolve(options.workingDirectory);

  return nextConfig;
}

function readJsonRecord(path: string): Record<string, unknown> {
  if (!existsSync(path)) return {};
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8"));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : {};
  } catch {
    return {};
  }
}

function replaceWithSymlink(linkPath: string, targetPath: string, type: "dir" | "file"): void {
  rmSync(linkPath, { recursive: true, force: true });
  const symlinkType = process.platform === "win32"
    ? (type === "dir" ? "junction" : "file")
    : type;
  symlinkSync(targetPath, linkPath, symlinkType);
}

function removeLegacyHermesPluginPaths(paths: HermesIntegrationPaths): void {
  const legacyTargets = [
    // 旧版本曾把插件写到 integrations/hermes/plugins/memory/memohub，现已统一收敛到 integrations/hermes/plugin。
    join(paths.integrationRoot, "plugins"),
    // 旧调试链路泄漏到 Hermes 仓库内的 bundled provider 会抢占用户插件优先级，必须清理掉。
    join(paths.hermesHome, "hermes-agent", "plugins", "memory", "memohub"),
    // 旧配置文件名不再使用，避免和 provider.json 并存造成误判。
    join(paths.integrationRoot, "memohub-provider.json"),
  ];

  for (const target of legacyTargets) {
    if (!existsSync(target)) continue;
    rmSync(target, { recursive: true, force: true });
  }
}

function isExpectedLink(linkPath: string, targetPath: string): boolean {
  if (!existsSync(linkPath)) return false;
  const stat = lstatSync(linkPath);
  if (!stat.isSymbolicLink()) return false;
  return resolve(dirname(linkPath), readlinkSync(linkPath)) === resolve(targetPath);
}

function detectPython(runner: CommandRunner): { ok: boolean; detail: string } {
  for (const command of ["python3", "python"]) {
    const result = runner(command, ["-c", "import sys; print(f'{sys.version_info[0]}.{sys.version_info[1]}.{sys.version_info[2]}')"]);
    if (!result.ok) continue;
    const version = parseVersion(result.stdout.trim());
    if (!version) {
      return { ok: false, detail: `${command}: unable to parse version output (${result.stdout.trim() || "empty"})` };
    }
    const ok = version.major > PYTHON_MIN.major || (version.major === PYTHON_MIN.major && version.minor >= PYTHON_MIN.minor);
    return { ok, detail: `${command} ${version.major}.${version.minor}.${version.patch}` };
  }
  return { ok: false, detail: "python3/python not available" };
}

function probeHermesCommand(runner: CommandRunner, hermesHome: string, args: string[]): { ok: boolean; detail: string } {
  const result = runner("hermes", args, { env: { ...process.env, HERMES_HOME: hermesHome } });
  return {
    ok: result.ok,
    detail: result.ok
      ? (result.stdout.trim() || "hermes available")
      : (result.stderr.trim() || "hermes command is not available"),
  };
}

function probeHermesPluginList(
  runner: CommandRunner,
  hermesHome: string,
  options: { preferNativeDiscovery: boolean },
): { ok: boolean; detail: string } {
  const discovery = options.preferNativeDiscovery ? probeHermesMemoryDiscovery(hermesHome) : undefined;
  if (discovery) return discovery;

  for (const args of [["plugin", "list"], ["plugins", "list"]]) {
    const result = runner("hermes", args, { env: { ...process.env, HERMES_HOME: hermesHome } });
    const output = `${result.stdout}\n${result.stderr}`;
    if (!result.ok) continue;
    const discovered = output.toLowerCase().includes("memohub");
    return {
      ok: discovered,
      detail: discovered
        ? `memohub discovered via hermes ${args.join(" ")}`
        : `hermes ${args.join(" ")} succeeded but memohub was not listed yet; run hermes memory setup first`,
    };
  }
  return {
    ok: false,
    detail: "Unable to confirm Hermes memory-provider discovery automatically; verify with hermes memory setup or Hermes runtime loading.",
  };
}

function probeHermesMemoryDiscovery(hermesHome: string): { ok: boolean; detail: string } | undefined {
  const hermesExecutable = resolveExecutablePath("hermes");
  if (!hermesExecutable) return undefined;

  const shebang = readShebangCommand(hermesExecutable);
  if (!shebang) return undefined;

  const result = spawnSync(
    shebang.command,
    [
      ...shebang.args,
      "-c",
      [
        "import json",
        "from plugins.memory import discover_memory_providers, load_memory_provider",
        "providers = [name for name, _, _ in discover_memory_providers()]",
        "provider = load_memory_provider('memohub')",
        "print(json.dumps({'providers': providers, 'load_ok': provider is not None, 'available': bool(provider.is_available()) if provider else False}))",
      ].join("; "),
    ],
    {
      env: { ...process.env, HERMES_HOME: hermesHome },
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  if (result.status !== 0) {
    const detail = (result.stderr || result.stdout || "discovery probe failed").trim();
    return { ok: false, detail: `Hermes memory discovery probe failed: ${detail}` };
  }

  try {
    const payload = JSON.parse((result.stdout || "").trim()) as {
      providers?: string[];
      load_ok?: boolean;
      available?: boolean;
    };
    const discovered = Array.isArray(payload.providers) && payload.providers.includes("memohub");
    const loaded = payload.load_ok === true;
    return {
      ok: discovered && loaded,
      detail: discovered && loaded
        ? `memohub discovered via Hermes memory-provider scan (available=${payload.available === true ? "true" : "false"})`
        : `Hermes memory-provider scan did not load memohub. Providers: ${(payload.providers ?? []).join(", ") || "none"}`,
    };
  } catch {
    const detail = (result.stdout || "empty discovery output").trim();
    return { ok: false, detail: `Hermes memory discovery returned non-JSON output: ${detail}` };
  }
}

function resolveExecutablePath(command: string, pathValue = process.env.PATH ?? ""): string | undefined {
  const directories = pathValue.split(process.platform === "win32" ? ";" : ":").filter(Boolean);
  const suffixes = process.platform === "win32" ? ["", ".exe", ".cmd", ".bat"] : [""];
  for (const directory of directories) {
    for (const suffix of suffixes) {
      const candidate = join(directory, `${command}${suffix}`);
      if (existsSync(candidate)) return candidate;
    }
  }
  return undefined;
}

function readShebangCommand(executablePath: string): { command: string; args: string[] } | undefined {
  try {
    const firstLine = readFileSync(executablePath, "utf8").split(/\r?\n/u, 1)[0]?.trim();
    if (!firstLine?.startsWith("#!")) return undefined;
    const parts = firstLine.slice(2).trim().split(/\s+/u).filter(Boolean);
    if (parts.length === 0) return undefined;
    return {
      command: parts[0],
      args: parts.slice(1),
    };
  } catch {
    return undefined;
  }
}

function parseVersion(raw: string): { major: number; minor: number; patch: number } | undefined {
  const match = raw.match(/(\d+)\.(\d+)\.(\d+)/u);
  if (!match) return undefined;
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

function defaultRunner(command: string, args: string[], options: { env?: NodeJS.ProcessEnv } = {}) {
  const result = spawnSync(command, args, {
    env: options.env,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return {
    ok: result.status === 0,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    exitCode: result.status,
  };
}
