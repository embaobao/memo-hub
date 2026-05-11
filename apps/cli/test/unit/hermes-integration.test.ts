import { afterEach, describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, readlinkSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import {
  doctorHermesIntegration,
  installHermesIntegration,
  uninstallHermesIntegration,
} from "../../src/hermes-integration.js";

describe("hermes integration", () => {
  const tempDirs: string[] = [];

  afterEach(() => {
    for (const path of tempDirs.splice(0)) rmSync(path, { recursive: true, force: true });
  });

  test("install writes plugin assets under ~/.memohub integration root and links Hermes user paths", () => {
    const fixture = createFixture();

    const result = installHermesIntegration({
      memoHubRoot: fixture.memoHubRoot,
      hermesHome: fixture.hermesHome,
      bundledAssetsRoot: fixture.assetsRoot,
      projectId: "memo-hub-hermes-smoke",
      language: "zh",
      testValidation: true,
    });

    expect(result.success).toBe(true);
    expect(readFileSync(join(result.paths.integrationPluginRoot, "plugin.yaml"), "utf8")).toContain("name: memohub");
    expect(readlinkSync(result.paths.hermesPluginLink)).toBe(result.paths.integrationPluginRoot);
    expect(readlinkSync(result.paths.hermesConfigLink)).toBe(result.paths.integrationConfigPath);
    expect(result.paths.integrationPluginRoot.endsWith("/integrations/hermes/plugin")).toBe(true);
    expect(result.paths.integrationConfigPath.endsWith("/integrations/hermes/provider.json")).toBe(true);
    expect(result.paths.hermesPluginLink.endsWith("/.hermes/plugins/memohub")).toBe(true);
    expect(result.paths.hermesConfigLink.endsWith("/.hermes/memohub-provider.json")).toBe(true);

    const config = JSON.parse(readFileSync(result.paths.integrationConfigPath, "utf8"));
    expect(config.memohub_command).toEqual(["memohub"]);
    expect(config.project_id).toBe("memo-hub-hermes-smoke");
    expect(config.language).toBe("zh");
    expect(config.test_validation).toBe(true);
  });

  test("install removes leaked legacy Hermes provider paths before linking the official plugin root", () => {
    const fixture = createFixture();
    const legacyShadow = join(fixture.hermesHome, "hermes-agent", "plugins", "memory", "memohub");
    const legacyNestedAssets = join(fixture.memoHubRoot, "integrations", "hermes", "plugins", "memory", "memohub");
    const legacyConfig = join(fixture.memoHubRoot, "integrations", "hermes", "memohub-provider.json");

    mkdirSync(legacyShadow, { recursive: true });
    writeFileSync(join(legacyShadow, "__init__.py"), "legacy = True\n", "utf8");
    mkdirSync(legacyNestedAssets, { recursive: true });
    writeFileSync(join(legacyNestedAssets, "__init__.py"), "legacy = True\n", "utf8");
    mkdirSync(dirname(legacyConfig), { recursive: true });
    writeFileSync(legacyConfig, "{\n  \"legacy\": true\n}\n", "utf8");

    installHermesIntegration({
      memoHubRoot: fixture.memoHubRoot,
      hermesHome: fixture.hermesHome,
      bundledAssetsRoot: fixture.assetsRoot,
    });

    expect(existsSync(legacyShadow)).toBe(false);
    expect(existsSync(legacyNestedAssets)).toBe(false);
    expect(existsSync(legacyConfig)).toBe(false);
  });

  test("doctor reports plugin discovery and python compatibility with a stub runner", () => {
    const fixture = createFixture();
    installHermesIntegration({
      memoHubRoot: fixture.memoHubRoot,
      hermesHome: fixture.hermesHome,
      bundledAssetsRoot: fixture.assetsRoot,
    });

    const result = doctorHermesIntegration({
      memoHubRoot: fixture.memoHubRoot,
      hermesHome: fixture.hermesHome,
      bundledAssetsRoot: fixture.assetsRoot,
      runner: (command, args) => {
        if (command === "memohub") return okResult("1.1.0");
        if (command === "python3") return okResult("3.9.6");
        if (command === "hermes" && args.join(" ") === "--version") return okResult("Hermes 0.1.0");
        if (command === "hermes" && args.join(" ") === "plugin list") return okResult("memohub\nbuiltin");
        if (command === "hermes" && args.join(" ") === "plugins list") return okResult("memohub\nbuiltin");
        return failResult("unsupported");
      },
    });

    expect(result.success).toBe(true);
    expect(result.checks.find((check) => check.name === "python_runtime")?.detail).toContain("3.9.6");
    expect(result.checks.find((check) => check.name === "plugin_discoverable")?.ok).toBe(true);
  });

  test("uninstall removes Hermes links and can purge MemoHub-managed Hermes assets", () => {
    const fixture = createFixture();
    const install = installHermesIntegration({
      memoHubRoot: fixture.memoHubRoot,
      hermesHome: fixture.hermesHome,
      bundledAssetsRoot: fixture.assetsRoot,
    });

    const result = uninstallHermesIntegration({
      memoHubRoot: fixture.memoHubRoot,
      hermesHome: fixture.hermesHome,
      bundledAssetsRoot: fixture.assetsRoot,
      purgeAssets: true,
    });

    expect(result.success).toBe(true);
    expect(result.removed).toContain(install.paths.hermesPluginLink);
    expect(result.removed).toContain(install.paths.hermesConfigLink);
    expect(result.removed).toContain(install.paths.integrationRoot);
  });

  function createFixture() {
    const root = mkdtempSync(join(tmpdir(), "memohub-hermes-install-"));
    tempDirs.push(root);
    const assetsRoot = join(root, "assets");
    const pluginRoot = join(assetsRoot, "plugins", "memory", "memohub");
    mkdirSync(pluginRoot, { recursive: true });
    writeFileSync(join(pluginRoot, "__init__.py"), "def register(ctx=None):\n    return None\n", "utf8");
    writeFileSync(
      join(pluginRoot, "plugin.yaml"),
      "name: memohub\nversion: 1.0.0\ndescription: MemoHub plugin\nhooks:\n  - prefetch\n",
      "utf8",
    );
    writeFileSync(join(pluginRoot, "provider.py"), "class MemoHubMemoryProvider:\n    pass\n", "utf8");

    return {
      assetsRoot,
      memoHubRoot: join(root, ".memohub"),
      hermesHome: join(root, ".hermes"),
    };
  }
});

function okResult(stdout: string) {
  return { ok: true, stdout, stderr: "", exitCode: 0 };
}

function failResult(stderr: string) {
  return { ok: false, stdout: "", stderr, exitCode: 1 };
}
