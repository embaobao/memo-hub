import { z } from "zod";
import { ConfigLoader } from "@memohub/config";
import {
  ensureGlobalConfig,
  getConfigValue,
  resetGlobalConfig,
  uninstallGlobalConfig,
  writeConfigValue,
} from "../../config-commands.js";
import { loadRuntimeConfig } from "../../runtime-config.js";

export const ConfigGetInputSchema = z.object({
  path: z.string().optional().describe("点分配置路径；为空时返回解析后的运行时配置"),
});

export const ConfigSetInputSchema = z.object({
  path: z.string().min(1).describe("点分配置路径"),
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.unknown()), z.record(z.unknown())]).describe("配置值"),
});

export const ConfigManageInputSchema = z.object({
  action: z.enum(["check", "init", "uninstall"]).describe("配置管理动作"),
});

export function createConfigGetHandler() {
  return async (params: z.infer<typeof ConfigGetInputSchema>) => {
    const parsed = ConfigGetInputSchema.safeParse(params);
    if (!parsed.success) return { success: false, error: "Invalid input schema", details: parsed.error.errors };
    if (!parsed.data.path) {
      return { success: true, config: loadRuntimeConfig() };
    }
    const loader = new ConfigLoader();
    return {
      success: true,
      path: parsed.data.path,
      value: getConfigValue(loader.getMaskedConfig(), parsed.data.path),
    };
  };
}

export function createConfigSetHandler() {
  return async (params: z.infer<typeof ConfigSetInputSchema>) => {
    const parsed = ConfigSetInputSchema.safeParse(params);
    if (!parsed.success) return { success: false, error: "Invalid input schema", details: parsed.error.errors };
    // MCP 直接传结构化值；复用 CLI 写入函数时转成 JSON 字符串，避免类型丢失。
    const result = writeConfigValue(parsed.data.path, JSON.stringify(parsed.data.value));
    return { success: true, ...result };
  };
}

export function createConfigManageHandler() {
  return async (params: z.infer<typeof ConfigManageInputSchema>) => {
    const parsed = ConfigManageInputSchema.safeParse(params);
    if (!parsed.success) return { success: false, error: "Invalid input schema", details: parsed.error.errors };
    if (parsed.data.action === "check") return { success: true, ...ensureGlobalConfig() };
    if (parsed.data.action === "init") return { success: true, ...resetGlobalConfig() };
    return { success: true, ...uninstallGlobalConfig() };
  };
}

export const CONFIG_GET_TOOL_METADATA = {
  name: "memohub_config_get",
  description: "读取 MemoHub 新架构配置；不传 path 时返回解析后的运行时配置",
};

export const CONFIG_SET_TOOL_METADATA = {
  name: "memohub_config_set",
  description: "写入 MemoHub 新架构配置点分路径",
};

export const CONFIG_MANAGE_TOOL_METADATA = {
  name: "memohub_config_manage",
  description: "检查、初始化或卸载 MemoHub 全局配置",
};
