#!/usr/bin/env node
// 主 CLI 入口
import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { ConfigManager } from "../core/config.js";
import { GBrain } from "../lib/gbrain.js";
import { ClawMem } from "../lib/clawmem.js";
import { Embedder } from "../core/embedder.js";
import { MemorySummarizer } from "../lib/memory-summarizer.js";
import OpenAI from "openai";
import * as lancedb from "@lancedb/lancedb";
import * as path from "node:path";
import * as os from "node:os";
// 创建 CLI 程序
const program = new Command();
// 初始化配置
const configManager = new ConfigManager();
configManager.applyEnvOverrides();
const config = configManager.getConfig();
// 初始化组件
const embedder = new Embedder(config.embedding);
const gbrain = new GBrain(config.gbrain, embedder);
const clawmem = new ClawMem(config.clawmem, embedder);
// 初始化所有数据库
async function initializeDatabases() {
    const spinner = ora("初始化数据库...").start();
    try {
        await gbrain.initialize();
        await clawmem.initialize();
        spinner.succeed("数据库初始化完成");
    }
    catch (error) {
        spinner.fail("数据库初始化失败");
        console.error(error);
        process.exit(1);
    }
}
// 添加知识
program
    .command("add-knowledge")
    .description("添加知识到 GBrain")
    .argument("<text>", "知识文本")
    .option("-c, --category <category>", "分类", config.gbrain.default_category)
    .option("-i, --importance <importance>", "重要性 (0-1)", "0.5")
    .option("-t, --tags <tags>", "标签 (逗号分隔)", "")
    .action(async (text, options) => {
    await initializeDatabases();
    const spinner = ora("添加知识...").start();
    try {
        const tags = options.tags ? options.tags.split(",").map((t) => t.trim()) : [];
        const id = await gbrain.addKnowledge({
            text,
            category: options.category,
            importance: parseFloat(options.importance),
            tags,
        });
        spinner.succeed(`知识添加成功: ${id}`);
    }
    catch (error) {
        spinner.fail("添加知识失败");
        console.error(error);
    }
});
// 添加代码
program
    .command("add-code")
    .description("添加代码到 ClawMem")
    .argument("<text>", "代码文本")
    .option("-l, --language <language>", "语言", config.clawmem.default_language)
    .option("-a, --ast-type <ast-type>", "AST 类型", "unknown")
    .option("-s, --symbol-name <symbol-name>", "符号名称", "")
    .option("-f, --file-path <file-path>", "文件路径", "")
    .option("-i, --importance <importance>", "重要性 (0-1)", "0.5")
    .option("-t, --tags <tags>", "标签 (逗号分隔)", "")
    .action(async (text, options) => {
    await initializeDatabases();
    const spinner = ora("添加代码...").start();
    try {
        const tags = options.tags ? options.tags.split(",").map((t) => t.trim()) : [];
        const id = await clawmem.addCode({
            text,
            language: options.language,
            ast_type: options.ast_type,
            symbol_name: options.symbol_name,
            file_path: options.file_path,
            importance: parseFloat(options.importance),
            tags,
        });
        spinner.succeed(`代码添加成功: ${id}`);
    }
    catch (error) {
        spinner.fail("添加代码失败");
        console.error(error);
    }
});
// 搜索知识
program
    .command("search-knowledge")
    .description("搜索 GBrain 中的知识")
    .argument("<query>", "搜索查询")
    .option("-l, --limit <limit>", "结果数量", "5")
    .option("-c, --category <category>", "分类过滤")
    .action(async (query, options) => {
    await initializeDatabases();
    const spinner = ora("搜索知识...").start();
    try {
        const results = await gbrain.searchKnowledge(query, {
            limit: parseInt(options.limit),
            category: options.category,
        });
        spinner.succeed(`找到 ${results.length} 条结果`);
        if (results.length > 0) {
            console.log("\n" + chalk.bold("搜索结果:"));
            console.log("=".repeat(80));
            for (let i = 0; i < results.length; i++) {
                const result = results[i];
                const distance = result._distance || 0;
                console.log(`\n[${i + 1}] ${chalk.cyan(result.category)} ${chalk.gray(`(相似度: ${(1 - distance).toFixed(2)})`)}`);
                console.log(chalk.gray("-".repeat(80)));
                console.log(result.text);
                if (result.tags && Array.isArray(result.tags) && result.tags.length > 0) {
                    console.log(chalk.gray(`标签: ${result.tags.join(", ")}`));
                }
            }
        }
    }
    catch (error) {
        spinner.fail("搜索失败");
        console.error(error);
    }
});
// 搜索代码
program
    .command("search-code")
    .description("搜索 ClawMem 中的代码")
    .argument("<query>", "搜索查询")
    .option("-l, --limit <limit>", "结果数量", "5")
    .option("--language <language>", "语言过滤")
    .option("--ast-type <ast-type>", "AST 类型过滤")
    .action(async (query, options) => {
    await initializeDatabases();
    const spinner = ora("搜索代码...").start();
    try {
        const results = await clawmem.searchCode(query, {
            limit: parseInt(options.limit),
            language: options.language,
            ast_type: options.ast_type,
        });
        spinner.succeed(`找到 ${results.length} 条结果`);
        if (results.length > 0) {
            console.log("\n" + chalk.bold("搜索结果:"));
            console.log("=".repeat(80));
            for (let i = 0; i < results.length; i++) {
                const result = results[i];
                const distance = result._distance || 0;
                console.log(`\n[${i + 1}] ${chalk.cyan(result.language)} ${chalk.yellow(result.ast_type)} ${chalk.gray(`(相似度: ${(1 - distance).toFixed(2)})`)}`);
                if (result.symbol_name) {
                    console.log(chalk.gray(`符号: ${result.symbol_name}`));
                }
                if (result.file_path) {
                    console.log(chalk.gray(`文件: ${result.file_path}`));
                }
                console.log(chalk.gray("-".repeat(80)));
                console.log(result.text);
                if (result.tags && Array.isArray(result.tags) && result.tags.length > 0) {
                    console.log(chalk.gray(`标签: ${result.tags.join(", ")}`));
                }
            }
        }
    }
    catch (error) {
        spinner.fail("搜索失败");
        console.error(error);
    }
});
// 统计信息
program
    .command("stats")
    .description("显示记忆系统统计信息")
    .action(async () => {
    await initializeDatabases();
    try {
        const gbrainStats = await gbrain.getStats();
        const clawmemStats = await clawmem.getStats();
        console.log("\n" + chalk.bold("记忆系统统计信息"));
        console.log("=".repeat(80));
        console.log("\n" + chalk.cyan("GBrain (通用知识):"));
        console.log(`  总记录数: ${gbrainStats.total_records}`);
        console.log(`  数据库路径: ${gbrainStats.db_path}`);
        console.log(`  嵌入模型: ${gbrainStats.embedding_model}`);
        console.log(`  向量维度: ${gbrainStats.vector_dim}`);
        console.log("\n" + chalk.cyan("ClawMem (代码记忆):"));
        console.log(`  总记录数: ${clawmemStats.total_records}`);
        console.log(`  数据库路径: ${clawmemStats.db_path}`);
        console.log(`  嵌入模型: ${clawmemStats.embedding_model}`);
        console.log(`  向量维度: ${clawmemStats.vector_dim}`);
    }
    catch (error) {
        console.error("获取统计信息失败:", error);
    }
});
// 配置信息
program
    .command("config")
    .description("显示当前配置")
    .option("--validate", "验证配置")
    .action((options) => {
    if (options.validate) {
        const validation = configManager.validateConfig();
        if (validation.valid) {
            console.log(chalk.green("✓ 配置验证通过"));
        }
        else {
            console.log(chalk.red("✗ 配置验证失败"));
            console.log("\n错误:");
            validation.errors.forEach((error) => {
                console.log(chalk.red(`  - ${error}`));
            });
        }
    }
    else {
        console.log("\n" + chalk.bold("当前配置"));
        console.log("=".repeat(80));
        console.log(JSON.stringify(config, null, 2));
    }
});
// 列出知识
program
    .command("list-knowledge")
    .description("列出 GBrain 中的知识")
    .option("-c, --category <category>", "按分类过滤")
    .option("-l, --limit <limit>", "显示数量", "20")
    .action(async (options) => {
    await initializeDatabases();
    const spinner = ora("列出知识...").start();
    try {
        const limit = parseInt(options.limit);
        const allRecords = await gbrain.getAllRecords();
        // 按分类过滤
        let filteredRecords = allRecords;
        if (options.category) {
            filteredRecords = allRecords.filter((r) => r.category === options.category);
        }
        // 排序：按重要性降序
        filteredRecords.sort((a, b) => (b.importance || 0) - (a.importance || 0));
        // 限制数量
        const records = filteredRecords.slice(0, limit);
        spinner.succeed(`找到 ${records.length} 条记录`);
        if (records.length > 0) {
            console.log("\n" + chalk.bold("知识列表:"));
            console.log("=".repeat(80));
            for (let i = 0; i < records.length; i++) {
                const record = records[i];
                console.log(`\n[${i + 1}] ${chalk.cyan(record.category)} ${chalk.yellow(`重要性: ${(record.importance || 0).toFixed(2)}`)}`);
                console.log(chalk.gray(`ID: ${record.id}`));
                console.log(chalk.gray("-".repeat(80)));
                // 截断过长的文本
                const text = record.text || "";
                const maxLength = 200;
                const displayText = text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
                console.log(displayText);
                if (record.tags && Array.isArray(record.tags) && record.tags.length > 0) {
                    console.log(chalk.gray(`标签: ${record.tags.join(", ")}`));
                }
                console.log(chalk.gray(`来源: ${record.source || "unknown"}`));
            }
        }
    }
    catch (error) {
        spinner.fail("列出知识失败");
        console.error(error);
    }
});
// 列出代码
program
    .command("list-code")
    .description("列出 ClawMem 中的代码")
    .option("-l, --language <language>", "按语言过滤")
    .option("-a, --ast-type <ast-type>", "按 AST 类型过滤")
    .option("--limit <limit>", "显示数量", "20")
    .action(async (options) => {
    await initializeDatabases();
    const spinner = ora("列出代码...").start();
    try {
        const limit = parseInt(options.limit);
        const allRecords = await clawmem.getAllRecords();
        // 按语言或 AST 类型过滤
        let filteredRecords = allRecords;
        if (options.language) {
            filteredRecords = allRecords.filter((r) => r.language === options.language);
        }
        if (options.ast_type) {
            filteredRecords = allRecords.filter((r) => r.ast_type === options.ast_type);
        }
        // 排序：按重要性降序
        filteredRecords.sort((a, b) => (b.importance || 0) - (a.importance || 0));
        // 限制数量
        const records = filteredRecords.slice(0, limit);
        spinner.succeed(`找到 ${records.length} 条记录`);
        if (records.length > 0) {
            console.log("\n" + chalk.bold("代码列表:"));
            console.log("=".repeat(80));
            for (let i = 0; i < records.length; i++) {
                const record = records[i];
                console.log(`\n[${i + 1}] ${chalk.cyan(record.language)} ${chalk.yellow(record.ast_type)} ${chalk.magenta(`重要性: ${(record.importance || 0).toFixed(2)}`)}`);
                console.log(chalk.gray(`ID: ${record.id}`));
                console.log(chalk.gray("-".repeat(80)));
                // 截断过长的文本
                const text = record.text || "";
                const maxLength = 200;
                const displayText = text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
                console.log(displayText);
                if (record.symbol_name) {
                    console.log(chalk.gray(`符号: ${record.symbol_name}`));
                }
                if (record.file_path) {
                    console.log(chalk.gray(`文件: ${record.file_path}`));
                }
                if (record.tags && Array.isArray(record.tags) && record.tags.length > 0) {
                    console.log(chalk.gray(`标签: ${record.tags.join(", ")}`));
                }
                console.log(chalk.gray(`来源: ${record.source || "unknown"}`));
            }
        }
    }
    catch (error) {
        spinner.fail("列出代码失败");
        console.error(error);
    }
});
// 删除知识
program
    .command("delete-knowledge")
    .description("删除 GBrain 中的知识")
    .argument("<ids>", "知识 ID，多个用逗号分隔")
    .action(async (ids) => {
    await initializeDatabases();
    const idList = ids.split(",").map((id) => id.trim());
    const spinner = ora(`删除 ${idList.length} 条知识...`).start();
    try {
        const deletedCount = await gbrain.deleteKnowledge(idList);
        spinner.succeed(`成功删除 ${deletedCount} 条知识`);
    }
    catch (error) {
        spinner.fail("删除知识失败");
        console.error(error);
    }
});
// 删除代码
program
    .command("delete-code")
    .description("删除 ClawMem 中的代码")
    .argument("<ids>", "代码 ID，多个用逗号分隔")
    .action(async (ids) => {
    await initializeDatabases();
    const idList = ids.split(",").map((id) => id.trim());
    const spinner = ora(`删除 ${idList.length} 条代码...`).start();
    try {
        const deletedCount = await clawmem.deleteCode(idList);
        spinner.succeed(`成功删除 ${deletedCount} 条代码`);
    }
    catch (error) {
        spinner.fail("删除代码失败");
        console.error(error);
    }
});
// 按分类删除知识
program
    .command("clean-knowledge")
    .description("按分类删除 GBrain 中的所有知识")
    .argument("<category>", "分类名称")
    .option("--dry-run", "只显示将要删除的记录，不实际删除")
    .action(async (category, options) => {
    await initializeDatabases();
    const spinner = ora(`查找 ${category} 分类...`).start();
    try {
        const allRecords = await gbrain.getAllRecords();
        const filteredRecords = allRecords.filter((r) => r.category === category);
        spinner.succeed(`找到 ${filteredRecords.length} 条记录`);
        if (filteredRecords.length === 0) {
            console.log(chalk.yellow("没有找到任何记录"));
            return;
        }
        // 显示将要删除的记录
        console.log("\n" + chalk.bold("将要删除的记录:"));
        console.log("=".repeat(80));
        for (let i = 0; i < filteredRecords.length; i++) {
            const record = filteredRecords[i];
            const text = record.text || "";
            const displayText = text.length > 100 ? text.substring(0, 100) + "..." : text;
            console.log(`\n[${i + 1}] ${chalk.gray(record.id)}`);
            console.log(`  ${displayText}`);
        }
        if (options.dryRun) {
            console.log("\n" + chalk.yellow("这是 dry-run，没有实际删除"));
            return;
        }
        // 确认删除
        const inquirer = (await import("inquirer")).default;
        const { confirm } = await inquirer.prompt([
            {
                type: "confirm",
                name: "confirm",
                message: `确认删除这 ${filteredRecords.length} 条记录吗？`,
                default: false,
            },
        ]);
        if (!confirm) {
            console.log(chalk.yellow("已取消删除"));
            return;
        }
        // 执行删除
        const deleteSpinner = ora("删除记录...").start();
        const deletedCount = await gbrain.deleteByCategory(category);
        deleteSpinner.succeed(`成功删除 ${deletedCount} 条记录`);
    }
    catch (error) {
        spinner.fail("删除失败");
        console.error(error);
    }
});
// 总结知识
program
    .command("summarize-knowledge")
    .description("总结 GBrain 中的知识")
    .option("-c, --category <category>", "按分类总结")
    .option("-q, --query <query>", "按关键词总结（使用语义搜索）")
    .option("--include-low", "包含低重要性记忆")
    .action(async (options) => {
    await initializeDatabases();
    const spinner = ora("准备总结...").start();
    try {
        let records = [];
        if (options.category) {
            // 按分类获取
            records = await gbrain.getAllRecords();
            records = records.filter((r) => r.category === options.category);
        }
        else if (options.query) {
            // 按关键词搜索
            const searchResults = await gbrain.searchKnowledge(options.query, {
                limit: 50,
            });
            records = searchResults;
        }
        else {
            // 获取所有记录
            records = await gbrain.getAllRecords();
        }
        spinner.succeed(`找到 ${records.length} 条记录`);
        if (records.length === 0) {
            console.log(chalk.yellow("没有找到相关的记忆记录"));
            return;
        }
        // 检查是否配置了 OpenAI API
        if (!process.env.OPENAI_API_KEY) {
            // 输出 MCP 工具调用指令
            console.log("\n" + chalk.bold("📋 Hermes Agent 任务指令"));
            console.log("=".repeat(80));
            console.log("\n" + chalk.yellow("未配置 OpenAI API，请使用以下 MCP 工具完成总结：\n"));
            console.log(chalk.bold("步骤 1: 查询知识"));
            console.log(`  调用 mcp_memohub_query_knowledge 查询知识`);
            console.log(`  参数: {`);
            if (options.category) {
                console.log(`    "category": "${options.category}",`);
                console.log(`    "limit": 50`);
            }
            else if (options.query) {
                console.log(`    "query": "${options.query}",`);
                console.log(`    "limit": 50`);
            }
            else {
                console.log(`    "query": "",  // 空查询获取所有记录`);
                console.log(`    "limit": 100`);
            }
            console.log(`  }`);
            console.log("\n" + chalk.bold("步骤 2: 总结知识"));
            console.log(`  使用返回的记录，生成总结：`);
            console.log(`  - 统计高/中/低重要性记录数量`);
            console.log(`  - 生成整体总结（100-200 字）`);
            console.log(`  - 提取 3-5 个关键点`);
            console.log("\n" + chalk.bold("步骤 3: 保存总结"));
            console.log(`  调用 mcp_memohub_add_knowledge 保存总结`);
            console.log(`  参数: {`);
            console.log(`    "text": "生成的总结文本",`);
            console.log(`    "category": "${options.category || "summary"}",`);
            console.log(`    "importance": 0.9,`);
            console.log(`    "tags": ["summary", "auto-generated"]`);
            console.log(`  }`);
            console.log("\n" + chalk.gray("提示: 总结功能需要 OpenAI API 才能自动生成。"));
            console.log(chalk.gray("配置方式: export OPENAI_API_KEY=\"sk-xxx\""));
            console.log("=".repeat(80));
            return;
        }
        // 初始化 OpenAI
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            baseURL: process.env.OPENAI_BASE_URL,
        });
        // 初始化总结器
        const summarizer = new MemorySummarizer(embedder, openai);
        // 总结
        const summarizeSpinner = ora("正在总结...").start();
        const result = await summarizer.summarizeCategory(records, {
            includeLowImportance: options.includeLow,
        });
        summarizeSpinner.succeed("总结完成");
        // 显示结果
        console.log("\n" + chalk.bold("📊 记忆总结"));
        console.log("=".repeat(80));
        console.log("\n" + chalk.bold("统计信息:"));
        console.log(`  总记录数: ${result.statistics.total}`);
        console.log(`  高重要性 (≥0.8): ${chalk.green(result.statistics.highImportance)}`);
        console.log(`  中等重要性 (0.6-0.8): ${chalk.yellow(result.statistics.mediumImportance)}`);
        console.log(`  低重要性 (<0.6): ${chalk.gray(result.statistics.lowImportance)}`);
        console.log("\n" + chalk.bold("总结:"));
        console.log(result.summary);
        console.log("\n" + chalk.bold("关键点:"));
        result.keyPoints.forEach((point, index) => {
            console.log(`  ${index + 1}. ${point}`);
        });
    }
    catch (error) {
        spinner.fail("总结失败");
        console.error(error);
    }
});
// 萃取关键知识
program
    .command("extract-knowledge")
    .description("从 GBrain 中萃取关键知识")
    .option("-c, --category <category>", "按分类萃取")
    .option("-q, --query <query>", "按关键词萃取（使用语义搜索）")
    .option("-n, --max-results <n>", "最多萃取结果数", "10")
    .option("--min-importance <n>", "最小重要性阈值", "0.7")
    .option("--no-deduplicate", "不执行去重")
    .action(async (options) => {
    await initializeDatabases();
    const spinner = ora("准备萃取...").start();
    try {
        let records = [];
        if (options.category) {
            // 按分类获取
            records = await gbrain.getAllRecords();
            records = records.filter((r) => r.category === options.category);
        }
        else if (options.query) {
            // 按关键词搜索
            const searchResults = await gbrain.searchKnowledge(options.query, {
                limit: 50,
            });
            records = searchResults;
        }
        else {
            // 获取所有记录
            records = await gbrain.getAllRecords();
        }
        spinner.succeed(`找到 ${records.length} 条记录`);
        if (records.length === 0) {
            console.log(chalk.yellow("没有找到相关的记忆记录"));
            return;
        }
        // 检查是否配置了 OpenAI API
        if (!process.env.OPENAI_API_KEY) {
            // 输出 MCP 工具调用指令
            console.log("\n" + chalk.bold("📋 Hermes Agent 任务指令"));
            console.log("=".repeat(80));
            console.log("\n" + chalk.yellow("未配置 OpenAI API，请使用以下 MCP 工具完成萃取：\n"));
            console.log(chalk.bold("步骤 1: 查询知识"));
            console.log(`  调用 mcp_memohub_query_knowledge 查询知识`);
            console.log(`  参数: {`);
            if (options.category) {
                console.log(`    "category": "${options.category}",`);
                console.log(`    "limit": 100`);
            }
            else if (options.query) {
                console.log(`    "query": "${options.query}",`);
                console.log(`    "limit": 100`);
            }
            else {
                console.log(`    "query": "",  // 空查询获取所有记录`);
                console.log(`    "limit": 200`);
            }
            console.log(`  }`);
            console.log("\n" + chalk.bold("步骤 2: 筛选关键知识"));
            console.log(`  从返回的记录中筛选关键知识：`);
            console.log(`  - 按重要性降序排序`);
            console.log(`  - 过滤掉重要性低于 ${options.minImportance} 的记录`);
            console.log(`  - 最多选择 ${options.maxResults} 条记录`);
            if (!options.noDeduplicate) {
                console.log(`  - 去除重复内容`);
            }
            console.log("\n" + chalk.bold("步骤 3: 保存萃取结果"));
            console.log(`  调用 mcp_memohub_add_knowledge 保存每条关键知识`);
            console.log(`  参数（每条）: {`);
            console.log(`    "text": "知识内容",`);
            console.log(`    "category": "${options.category || "extracted"}",`);
            console.log(`    "importance": 0.9,`);
            console.log(`    "tags": ["extracted", "auto-generated"]`);
            console.log(`  }`);
            console.log("\n" + chalk.gray("提示: 萃取功能需要 OpenAI API 才能自动生成。"));
            console.log(chalk.gray("配置方式: export OPENAI_API_KEY=\"sk-xxx\""));
            console.log("=".repeat(80));
            return;
        }
        // 初始化 OpenAI
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            baseURL: process.env.OPENAI_BASE_URL,
        });
        // 初始化总结器
        const summarizer = new MemorySummarizer(embedder, openai);
        // 萃取
        const extractSpinner = ora("正在萃取...").start();
        const result = await summarizer.extractKnowledge(records, {
            maxResults: parseInt(options.maxResults),
            minImportance: parseFloat(options.minImportance),
            deduplicate: !options.noDeduplicate,
        });
        extractSpinner.succeed("萃取完成");
        // 显示结果
        console.log("\n" + chalk.bold("💎 关键知识萃取"));
        console.log("=".repeat(80));
        console.log("\n" + chalk.bold("萃取统计:"));
        console.log(`  处理记录数: ${result.totalProcessed}`);
        console.log(`  去重删除数: ${result.duplicatesRemoved}`);
        console.log(`  萃取结果数: ${result.extracted.length}`);
        console.log("\n" + chalk.bold("萃取结果:"));
        console.log("=".repeat(80));
        result.extracted.forEach((item, index) => {
            console.log(`\n[${index + 1}] ${chalk.cyan(item.category)} ${chalk.yellow(`重要性: ${item.importance.toFixed(2)}`)}`);
            console.log(chalk.gray("-".repeat(80)));
            console.log(item.text);
            console.log(chalk.gray(`原因: ${item.reason}`));
        });
    }
    catch (error) {
        spinner.fail("萃取失败");
        console.error(error);
    }
});
// 清理 ClawMem（清空所有数据）
program
    .command("cleanup-skills")
    .description("清空 ClawMem 中的所有数据")
    .action(async () => {
    const spinner = ora("正在清空 ClawMem...").start();
    try {
        const HOME = process.env.HOME ?? os.homedir();
        const CLAWMEM_DB_PATH = path.join(HOME, ".hermes/data/clawmem.lancedb");
        const GBRAIN_DB_PATH = path.join(HOME, ".hermes/data/gbrain.lancedb");
        // 连接数据库
        const clawmemDb = await lancedb.connect(CLAWMEM_DB_PATH);
        const clawmemTable = await clawmemDb.openTable("clawmem");
        const gbrainDb = await lancedb.connect(GBRAIN_DB_PATH);
        const gbrainTable = await gbrainDb.openTable("gbrain");
        // 清空 ClawMem
        const clawmemCount = await clawmemTable.countRows();
        if (clawmemCount > 0) {
            const allClawmem = await clawmemTable.query().limit(10000).toArray();
            const clawmemIds = allClawmem.map(r => r.id);
            // 分批删除
            const batchSize = 100;
            for (let i = 0; i < clawmemIds.length; i += batchSize) {
                const batch = clawmemIds.slice(i, i + batchSize);
                const conditions = batch.map(id => `id = '${id}'`).join(' OR ');
                await clawmemTable.delete(conditions);
            }
            const newClawmemCount = await clawmemTable.countRows();
            spinner.succeed(`ClawMem 已清空: ${clawmemCount} → ${newClawmemCount} 条记录`);
        }
        else {
            spinner.succeed("ClawMem 已经是空的");
        }
    }
    catch (error) {
        spinner.fail("清空失败");
        console.error(error);
        process.exit(1);
    }
});
// 版本信息
program
    .name("mh")
    .description("MemoHub - 我的双轨记忆中心")
    .version("1.0.0");
// 解析参数
program.parse(process.argv);
//# sourceMappingURL=index.js.map