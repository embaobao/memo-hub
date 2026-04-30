import { z } from "zod";
import { ConfigLoader } from "@memohub/config";
import {
  cleanManagedData,
  cleanChannelData,
  cleanChannelsBySelector,
  CONFIG_UNINSTALL_CONFIRMATION,
  DATA_CLEAN_CONFIRMATION,
  ensureGlobalConfig,
  getConfigValue,
  resetGlobalConfig,
  uninstallGlobalConfigWithConfirmation,
  writeConfigValue,
} from "../../config-commands.js";
import { loadRuntimeConfig } from "../../runtime-config.js";
import type { UnifiedMemoryRuntime } from "../../unified-memory-runtime.js";

export const ConfigGetInputSchema = z.object({
  path: z.string().optional().describe("点分配置路径；为空时返回解析后的运行时配置"),
});

export const ConfigSetInputSchema = z.object({
  path: z.string().min(1).describe("点分配置路径"),
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.unknown()), z.record(z.unknown())]).describe("配置值"),
});

export const ConfigManageInputSchema = z.object({
  action: z.enum(["check", "uninstall"]).describe("配置管理动作"),
  confirm: z.string().optional().describe(`高风险卸载二次确认，必须为 ${CONFIG_UNINSTALL_CONFIRMATION}`),
});

export const DataManageInputSchema = z.object({
  action: z.enum(["status", "clean_all", "clean_channel", "rebuild_schema"]).describe("数据管理动作"),
  channel: z.string().optional().describe("渠道清理范围，例如 hermes:mcp-test"),
  ownerActorId: z.string().optional().describe("按归属 Actor 选择渠道，例如 hermes"),
  source: z.string().optional().describe("按来源筛选渠道"),
  projectId: z.string().optional().describe("按项目筛选渠道"),
  purpose: z.enum(["primary", "session", "test", "adapter", "import"]).optional().describe("按渠道用途筛选"),
  status: z.enum(["active", "idle", "closed", "archived"]).optional().describe("按渠道状态筛选"),
  confirm: z.string().optional().describe(`高风险清理二次确认，必须为 ${DATA_CLEAN_CONFIRMATION}`),
  dryRun: z.boolean().optional().describe("仅预览清理目标，不删除数据"),
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

export function createConfigManageHandler(runtime?: UnifiedMemoryRuntime) {
  return async (params: z.infer<typeof ConfigManageInputSchema>) => {
    const parsed = ConfigManageInputSchema.safeParse(params);
    if (!parsed.success) return { success: false, error: "Invalid input schema", details: parsed.error.errors };
    if (parsed.data.action === "check") return { success: true, ...ensureGlobalConfig() };
    return uninstallGlobalConfigWithConfirmation({
      yes: parsed.data.confirm === CONFIG_UNINSTALL_CONFIRMATION,
      confirm: parsed.data.confirm,
    });
  };
}

export function createDataManageHandler(runtime?: UnifiedMemoryRuntime) {
  return async (params: z.infer<typeof DataManageInputSchema>) => {
    const parsed = DataManageInputSchema.safeParse(params);
    if (!parsed.success) return { success: false, error: "Invalid input schema", details: parsed.error.errors };
    if (parsed.data.action === "status") return cleanManagedData({ dryRun: true });
    if (parsed.data.action === "clean_all") {
      return cleanManagedData({
        all: true,
        yes: parsed.data.confirm === DATA_CLEAN_CONFIRMATION,
        confirm: parsed.data.confirm,
        dryRun: parsed.data.dryRun ?? false,
      });
    }
    if (parsed.data.action === "clean_channel") {
      if (!runtime) {
        return { success: false, error: "Runtime is required for channel cleanup." };
      }
      if (parsed.data.ownerActorId || parsed.data.source || parsed.data.projectId || parsed.data.purpose || parsed.data.status) {
        return cleanChannelsBySelector(runtime, {
          ownerActorId: parsed.data.ownerActorId,
          source: parsed.data.source,
          projectId: parsed.data.projectId,
          purpose: parsed.data.purpose,
          status: parsed.data.status,
          yes: parsed.data.confirm === DATA_CLEAN_CONFIRMATION,
          confirm: parsed.data.confirm,
          dryRun: parsed.data.dryRun ?? true,
        });
      }
      if (!parsed.data.channel || !runtime.getChannel(parsed.data.channel)) {
        return { success: false, error: `Unknown channel: ${parsed.data.channel ?? ""}`.trim() };
      }
      return cleanChannelData(runtime.vectorStore, {
        channel: parsed.data.channel,
        yes: parsed.data.confirm === DATA_CLEAN_CONFIRMATION,
        confirm: parsed.data.confirm,
        dryRun: parsed.data.dryRun ?? true,
      });
    }
    if (parsed.data.action === "rebuild_schema") {
      return {
        success: true,
        action: parsed.data.action,
        message: "Managed data store rebuilt. Restart any running MemoHub MCP server before retesting.",
        ...resetGlobalConfig(),
      };
    }
    return { success: false, error: "Unsupported data action." };
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
  description: `检查配置或二次确认卸载全局配置。卸载必须 confirm=${CONFIG_UNINSTALL_CONFIRMATION}`,
};

export const DATA_MANAGE_TOOL_METADATA = {
  name: "memohub_data_manage",
  description: `查看数据清理目标、按渠道清理、二次确认清空全部 MemoHub 管理数据或重建 schema。清理必须 confirm=${DATA_CLEAN_CONFIRMATION}`,
};
