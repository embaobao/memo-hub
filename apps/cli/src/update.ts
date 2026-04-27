#!/usr/bin/env node

/**
 * MemoHub CLI 更新脚本
 * 职责: 检查并更新 CLI 到最新版本
 *
 * 使用方法:
 *   memohub update
 */

import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import * as https from "node:https";

const PACKAGE_NAME = "@memohub/cli";
const NPM_REGISTRY = "https://registry.npmjs.org";

/**
 * 获取当前版本
 */
function getCurrentVersion(): string {
  const packageJsonPath = path.join(process.cwd(), "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
  return packageJson.version;
}

/**
 * 获取最新版本
 */
async function getLatestVersion(): Promise<string> {
  return new Promise((resolve, reject) => {
    https
      .get(`${NPM_REGISTRY}/${PACKAGE_NAME}`, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          try {
            const packageInfo = JSON.parse(data);
            resolve(packageInfo["dist-tags"].latest);
          } catch (error) {
            reject(error);
          }
        });
      })
      .on("error", reject);
  });
}

/**
 * 检查更新
 */
async function checkUpdate(): Promise<void> {
  console.log("正在检查更新...");

  const currentVersion = getCurrentVersion();
  const latestVersion = await getLatestVersion();

  console.log(`当前版本: ${currentVersion}`);
  console.log(`最新版本: ${latestVersion}`);

  if (currentVersion === latestVersion) {
    console.log("✅ 已经是最新版本");
    return;
  }

  console.log(`\n🎉 发现新版本: ${latestVersion}`);
  console.log("\n更新命令:");
  console.log("  npm update -g @memohub/cli");
  console.log("  或");
  console.log("  bun install -g @memohub/cli");
}

/**
 * 主函数
 */
export async function main() {
  try {
    await checkUpdate();
  } catch (error) {
    console.error(
      "❌ 检查更新失败:",
      error instanceof Error ? error.message : String(error),
    );
    process.exit(1);
  }
}

// 如果直接运行此脚本，执行 main 函数
const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  main();
}
