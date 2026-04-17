// 自动记忆提取器
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import OpenAI from "openai";
import chalk from "chalk";
import ora from "ora";
config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// 配置
const EXTRACTOR_CONFIG = {
    // OpenAI API 配置
    openai: {
        apiKey: process.env.OPENAI_API_KEY || "",
        baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    },
    // 记忆系统配置
    memory: {
        gbrainPath: process.env.GBRAIN_DB_PATH || "~/.hermes/data/gbrain.lancedb",
        clawmemPath: process.env.CLAWMEM_DB_PATH || "~/.hermes/data/clawmem.lancedb",
    },
    // Session 历史路径
    sessionHistoryPath: process.env.SESSION_HISTORY_PATH || "~/.hermes/data/sessions",
    // 提取器配置
    extractor: {
        minImportance: 0.6, // 最小重要性阈值
        maxItemsPerSession: 10, // 每个 Session 最多提取的项目
        autoCategorize: true, // 自动分类
    },
    // 日志配置
    logging: {
        enabled: true,
        logPath: process.env.EXTRACTOR_LOG_PATH || "~/.hermes/logs/auto-memory-extractor.log",
        verbose: false,
    },
    // 更新追踪
    tracking: {
        enabled: true,
        trackingPath: process.env.TRACKING_PATH || "~/.hermes/data/memory-updates",
    },
};
// 日志函数
function log(level, message) {
    if (!EXTRACTOR_CONFIG.logging.enabled)
        return;
    const timestamp = new Date().toISOString();
    const levelColor = {
        info: chalk.blue,
        warn: chalk.yellow,
        error: chalk.red,
    }[level];
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    // 控制台输出
    console.log(levelColor(logMessage));
    // 文件输出
    try {
        const logPath = EXTRACTOR_CONFIG.logging.logPath.replace(/^~/, process.env.HOME);
        const logDir = path.dirname(logPath);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
        fs.appendFileSync(logPath, logMessage + "\n");
    }
    catch (error) {
        console.error("写入日志失败:", error);
    }
}
class MemoryUpdateTracker {
    updates = [];
    trackingPath;
    constructor() {
        this.trackingPath = EXTRACTOR_CONFIG.tracking.trackingPath.replace(/^~/, process.env.HOME);
        this.loadUpdates();
    }
    loadUpdates() {
        try {
            if (fs.existsSync(this.trackingPath)) {
                const content = fs.readFileSync(this.trackingPath, "utf-8");
                const lines = content.trim().split("\n");
                this.updates = lines
                    .filter((line) => line.trim())
                    .map((line) => JSON.parse(line));
                log("info", `已加载 ${this.updates.length} 条更新记录`);
            }
        }
        catch (error) {
            log("error", `加载更新记录失败: ${error}`);
        }
    }
    saveUpdate(update) {
        this.updates.push(update);
        try {
            const trackingDir = path.dirname(this.trackingPath);
            if (!fs.existsSync(trackingDir)) {
                fs.mkdirSync(trackingDir, { recursive: true });
            }
            // 追加新记录
            fs.appendFileSync(this.trackingPath, JSON.stringify(update) + "\n");
            log("info", `已记录更新: ${update.id}`);
        }
        catch (error) {
            log("error", `保存更新记录失败: ${error}`);
        }
    }
    getUpdatesBySession(sessionId) {
        return this.updates.filter((u) => u.sessionId === sessionId);
    }
    getUpdatesByType(type) {
        return this.updates.filter((u) => u.type === type);
    }
    getRecentUpdates(limit = 20) {
        return this.updates.slice(-limit);
    }
    printUpdatesSummary(updates) {
        console.log("\n" + chalk.bold("📋 记忆更新摘要"));
        console.log("=".repeat(80));
        const byType = updates.reduce((acc, update) => {
            acc[update.type] = acc[update.type] || {
                add: 0,
                update: 0,
                skip: 0,
            };
            acc[update.type][update.action]++;
            return acc;
        }, {});
        for (const [type, actions] of Object.entries(byType)) {
            const typeLabel = type === "gbrain" ? "GBrain" : "ClawMem";
            console.log(`\n${chalk.cyan(typeLabel)}:`);
            console.log(`  新增: ${actions.add}`);
            console.log(`  更新: ${actions.update}`);
            console.log(`  跳过: ${actions.skip}`);
        }
        console.log("\n" + chalk.bold("详细更新记录:"));
        console.log("-".repeat(80));
        for (const update of updates) {
            const actionIcon = {
                add: chalk.green("➕"),
                update: chalk.yellow("🔄"),
                skip: chalk.gray("⏭️"),
            }[update.action];
            const typeLabel = update.type === "gbrain" ? "GB" : "CM";
            const similarityInfo = update.similarity
                ? chalk.gray(` (相似度: ${update.similarity.toFixed(2)})`)
                : "";
            console.log(`\n${actionIcon} [${typeLabel}] ${update.timestamp.substring(0, 19)}`);
            console.log(chalk.gray(`  Session: ${update.sessionId}`));
            console.log(chalk.gray(`  原因: ${update.metadata.reason}`));
            console.log(chalk.gray(`  重要性: ${update.metadata.importance.toFixed(2)}`));
            console.log(chalk.gray(`  内容: ${update.content.substring(0, 100)}...`));
            if (similarityInfo) {
                console.log(chalk.gray(similarityInfo));
            }
        }
    }
}
// 自动记忆提取器
class AutoMemoryExtractor {
    openai;
    tracker;
    constructor() {
        this.openai = new OpenAI({
            apiKey: EXTRACTOR_CONFIG.openai.apiKey,
            baseURL: EXTRACTOR_CONFIG.openai.baseURL,
        });
        this.tracker = new MemoryUpdateTracker();
    }
    /**
     * 分析 Session 并提取重要信息
     */
    async extractFromSession(session) {
        const spinner = ora("分析 Session...").start();
        try {
            // 1. 提取 Session 文本
            const sessionText = this.extractSessionText(session);
            // 2. 使用 LLM 分析并提取重要信息
            const extractedItems = await this.analyzeWithLLM(sessionText, session.id);
            spinner.succeed(`Session 分析完成，提取 ${extractedItems.length} 项重要信息`);
            return extractedItems;
        }
        catch (error) {
            spinner.fail("Session 分析失败");
            log("error", `分析 Session 失败: ${error}`);
            return [];
        }
    }
    /**
     * 提取 Session 文本
     */
    extractSessionText(session) {
        const messages = session.messages || [];
        // 构建文本表示
        const textParts = [];
        for (const msg of messages) {
            const role = msg.role || msg.name || "unknown";
            const content = typeof msg.content === "string"
                ? msg.content
                : JSON.stringify(msg.content);
            textParts.push(`[${role}]: ${content}`);
        }
        return textParts.join("\n\n");
    }
    /**
     * 使用 LLM 分析并提取重要信息
     */
    async analyzeWithLLM(sessionText, sessionId) {
        const prompt = `分析以下对话历史，提取重要信息。只提取值得保存到长期记忆的内容。

对话历史：
${sessionText.substring(0, 8000)}${sessionText.length > 8000 ? "\n...(已截断)" : ""}

请提取以下类型的信息：
1. 用户偏好和习惯
2. 项目相关信息（架构、技术栈、决策）
3. 重要代码片段和设计模式
4. 配置和设置信息
5. 常用命令和工作流
6. 错误和解决方案

对于每个提取的信息项，提供：
- content: 信息内容（50-200字）
- type: "knowledge" 或 "code"
- importance: 重要性（0-1，0.6以上才保存）
- category: 分类（knowledge类型）或 language（code类型）
- tags: 相关标签（3-5个）
- reason: 为什么这个信息重要（30-50字）

以 JSON 数组格式返回，只包含重要性 >= 0.6 的项目。

响应格式：
[
  {
    "content": "...",
    "type": "knowledge",
    "importance": 0.8,
    "category": "user",
    "tags": ["偏好", "习惯"],
    "reason": "用户明确表达了偏好，会影响未来的交互"
  },
  {
    "content": "...",
    "type": "code",
    "importance": 0.9,
    "language": "typescript",
    "ast_type": "function",
    "tags": ["工具函数", "常用"],
    "reason": "重要工具函数，多次使用"
  }
]`;
        try {
            const response = await this.openai.chat.completions.create({
                model: EXTRACTOR_CONFIG.openai.model,
                messages: [
                    {
                        role: "system",
                        content: "你是一个专业的记忆提取助手，擅长从对话中识别和提取重要信息。",
                    },
                    {
                        role: "user",
                        content: prompt,
                    },
                ],
                temperature: 0.3,
                max_tokens: 2000,
            });
            const content = response.choices[0]?.message?.content || "[]";
            const items = JSON.parse(content);
            // 限制提取数量
            return items.slice(0, EXTRACTOR_CONFIG.extractor.maxItemsPerSession);
        }
        catch (error) {
            log("error", `LLM 分析失败: ${error}`);
            return [];
        }
    }
    /**
     * 保存提取的信息到记忆系统
     */
    async saveToMemory(items, sessionId) {
        if (items.length === 0) {
            log("info", "没有需要保存的信息");
            return;
        }
        const spinner = ora(`保存 ${items.length} 项到记忆系统...`).start();
        try {
            const savedItems = [];
            for (const item of items) {
                if (item.type === "knowledge") {
                    await this.saveToGBrain(item, sessionId, savedItems);
                }
                else if (item.type === "code") {
                    await this.saveToClawMem(item, sessionId, savedItems);
                }
            }
            spinner.succeed(`成功保存 ${savedItems.length} 项到记忆系统`);
            // 打印更新摘要
            this.tracker.printUpdatesSummary(savedItems);
        }
        catch (error) {
            spinner.fail("保存到记忆系统失败");
            log("error", `保存失败: ${error}`);
        }
    }
    /**
     * 保存到 GBrain
     */
    async saveToGBrain(item, sessionId, savedItems) {
        // TODO: 实际调用 GBrain API
        // 这里先用模拟数据
        const update = {
            id: `update-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
            timestamp: new Date().toISOString(),
            sessionId,
            type: "gbrain",
            action: "add",
            content: item.content,
            metadata: {
                category: item.category || "other",
                importance: item.importance,
                tags: item.tags || [],
                reason: item.reason,
            },
        };
        savedItems.push(update);
        this.tracker.saveUpdate(update);
    }
    /**
     * 保存到 ClawMem
     */
    async saveToClawMem(item, sessionId, savedItems) {
        // TODO: 实际调用 ClawMem API
        // 这里先用模拟数据
        const update = {
            id: `update-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
            timestamp: new Date().toISOString(),
            sessionId,
            type: "clawmem",
            action: "add",
            content: item.content,
            metadata: {
                language: item.language || "unknown",
                ast_type: item.ast_type || "unknown",
                importance: item.importance,
                tags: item.tags || [],
                reason: item.reason,
            },
        };
        savedItems.push(update);
        this.tracker.saveUpdate(update);
    }
    /**
     * 处理 Session 文件
     */
    async processSessionFile(sessionPath) {
        const spinner = ora(`处理 Session: ${sessionPath}...`).start();
        try {
            // 1. 读取 Session 文件
            const content = fs.readFileSync(sessionPath, "utf-8");
            const session = JSON.parse(content);
            // 2. 提取 Session ID
            const sessionId = session.id || path.basename(sessionPath);
            // 3. 分析并提取信息
            const extractedItems = await this.extractFromSession(session);
            // 4. 保存到记忆系统
            await this.saveToMemory(extractedItems, sessionId);
            spinner.succeed(`Session ${sessionId} 处理完成`);
        }
        catch (error) {
            spinner.fail(`Session 处理失败: ${sessionPath}`);
            log("error", `处理 Session 失败: ${error}`);
        }
    }
    /**
     * 批量处理 Sessions
     */
    async processSessions(sessionsDir) {
        const spinner = ora(`扫描 Sessions 目录...`).start();
        try {
            const sessionFiles = fs.readdirSync(sessionsDir)
                .filter((file) => file.endsWith(".json"))
                .map((file) => path.join(sessionsDir, file));
            spinner.succeed(`找到 ${sessionFiles.length} 个 Session 文件`);
            for (const sessionFile of sessionFiles) {
                await this.processSessionFile(sessionFile);
            }
            console.log("\n" + chalk.bold("所有 Session 处理完成"));
            console.log("=" * 80);
            console.log(`总共处理 ${sessionFiles.length} 个 Sessions`);
        }
        catch (error) {
            spinner.fail("扫描 Sessions 失败");
            log("error", `扫描失败: ${error}`);
        }
    }
    /**
     * 显示更新追踪信息
     */
    showTrackingInfo() {
        console.log("\n" + chalk.bold("📊 记忆更新追踪"));
        console.log("=".repeat(80));
        const recentUpdates = this.tracker.getRecentUpdates(20);
        if (recentUpdates.length === 0) {
            console.log("\n暂无更新记录");
            return;
        }
        this.tracker.printUpdatesSummary(recentUpdates);
    }
}
// CLI 入口
async function main() {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.log(chalk.bold("自动记忆提取器"));
        console.log("\n使用方法:");
        console.log("  bun run index.ts <session-path>     # 处理单个 Session");
        console.log("  bun run index.ts --batch <dir>     # 批量处理 Sessions");
        console.log("  bun run index.ts --tracking        # 查看更新追踪");
        console.log("\n示例:");
        console.log("  bun run index.ts ~/.hermes/data/sessions/session-123.json");
        console.log("  bun run index.ts --batch ~/.hermes/data/sessions");
        console.log("  bun run index.ts --tracking");
        return;
    }
    const extractor = new AutoMemoryExtractor();
    // 处理单个 Session
    if (args[0] && !args[0].startsWith("--")) {
        const sessionPath = args[0].replace(/^~/, process.env.HOME);
        await extractor.processSessionFile(sessionPath);
    }
    // 批量处理
    else if (args[0] === "--batch") {
        const sessionsDir = args[1]
            ? args[1].replace(/^~/, process.env.HOME)
            : EXTRACTOR_CONFIG.sessionHistoryPath.replace(/^~/, process.env.HOME);
        await extractor.processSessions(sessionsDir);
    }
    // 显示追踪信息
    else if (args[0] === "--tracking") {
        extractor.showTrackingInfo();
    }
}
main().catch((error) => {
    console.error("执行失败:", error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map