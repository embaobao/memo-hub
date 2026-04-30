import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import {
  detectLangFromLocaleText,
  localizeHelpOutput,
  localizeHelpText,
  resolveLang,
} from "../../src/i18n.js";
import * as childProcess from "node:child_process";

const ORIGINAL_ENV = {
  MEMOHUB_LANG: process.env.MEMOHUB_LANG,
  LC_ALL: process.env.LC_ALL,
  LC_MESSAGES: process.env.LC_MESSAGES,
  LANG: process.env.LANG,
  APPLE_LANGUAGES: process.env.APPLE_LANGUAGES,
  APPLE_LOCALE: process.env.APPLE_LOCALE,
};

describe("i18n resolveLang", () => {
  const execFileSyncMock = mock(childProcess.execFileSync);

  beforeEach(() => {
    execFileSyncMock.mockReset();
  });

  afterEach(() => {
    process.env.MEMOHUB_LANG = ORIGINAL_ENV.MEMOHUB_LANG;
    process.env.LC_ALL = ORIGINAL_ENV.LC_ALL;
    process.env.LC_MESSAGES = ORIGINAL_ENV.LC_MESSAGES;
    process.env.LANG = ORIGINAL_ENV.LANG;
    process.env.APPLE_LANGUAGES = ORIGINAL_ENV.APPLE_LANGUAGES;
    process.env.APPLE_LOCALE = ORIGINAL_ENV.APPLE_LOCALE;
  });

  test("prefers explicit CLI input over config and environment", () => {
    process.env.APPLE_LANGUAGES = "zh-Hans";
    expect(resolveLang("en", "auto")).toBe("en");
  });

  test("respects configured zh or en directly", () => {
    process.env.APPLE_LANGUAGES = "en-US";
    expect(resolveLang(undefined, "zh")).toBe("zh");
    expect(resolveLang(undefined, "en")).toBe("en");
  });

  test("auto prefers macOS language hints before C.UTF-8 shell locale", () => {
    process.env.LANG = "C.UTF-8";
    process.env.LC_ALL = "C.UTF-8";
    process.env.APPLE_LANGUAGES = "zh-Hans";
    process.env.APPLE_LOCALE = "zh_CN";

    const originalPlatform = Object.getOwnPropertyDescriptor(process, "platform");
    Object.defineProperty(process, "platform", { value: "darwin" });
    try {
      expect(resolveLang(undefined, "auto")).toBe("zh");
    } finally {
      if (originalPlatform) Object.defineProperty(process, "platform", originalPlatform);
    }
  });

  test("auto reads macOS defaults when shell locale is english but system language is chinese", () => {
    process.env.LANG = "C.UTF-8";
    process.env.LC_ALL = "C.UTF-8";
    process.env.APPLE_LANGUAGES = "";
    process.env.APPLE_LOCALE = "";
    execFileSyncMock.mockImplementation((command: string, args?: readonly string[]) => {
      if (command === "defaults" && args?.join(" ") === "read -g AppleLanguages") return "(\"zh-Hans-CN\")";
      if (command === "defaults" && args?.join(" ") === "read -g AppleLocale") return "zh_CN";
      return "";
    });

    const originalPlatform = Object.getOwnPropertyDescriptor(process, "platform");
    Object.defineProperty(process, "platform", { value: "darwin" });
    try {
      expect(resolveLang(undefined, "auto")).toBe("zh");
    } finally {
      if (originalPlatform) Object.defineProperty(process, "platform", originalPlatform);
    }
  });

  test("detects language from linux locale text", () => {
    expect(detectLangFromLocaleText("LANG=zh_CN.UTF-8\nLC_MESSAGES=zh_CN.UTF-8")).toBe("zh");
  });

  test("detects language from windows locale text", () => {
    expect(detectLangFromLocaleText("zh-CN")).toBe("zh");
  });
});

describe("i18n help localization", () => {
  test("localizes common help labels", () => {
    const text = "Usage:\nOptions:\nCommands:\nWorkflow Guide:\ndisplay help for command";
    expect(localizeHelpOutput(text, "zh")).toContain("用法：");
    expect(localizeHelpOutput(text, "zh")).toContain("选项：");
    expect(localizeHelpOutput(text, "zh")).toContain("命令：");
    expect(localizeHelpOutput(text, "zh")).toContain("流程指引：");
    expect(localizeHelpOutput(text, "zh")).toContain("显示命令帮助");
  });

  test("localizes known command descriptions", () => {
    expect(localizeHelpText("Output language: zh or en", "zh")).toBe("输出语言：zh 或 en");
    expect(localizeHelpText("Start the MCP server", "zh")).toBe("启动 MCP 服务");
  });
});
