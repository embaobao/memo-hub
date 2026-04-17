#!/usr/bin/env node
// 主 CLI 入口
import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { ConfigManager } from "../core/config.js";
import { GBrain } from "../lib/gbrain.js";
import { ClawMem } from "../lib/clawmem.js";
import { Embedder } from "../core/embedder.js";
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
// 版本信息
program
    .name("mh")
    .description("MemoHub - 我的双轨记忆中心")
    .version("1.0.0");
// 解析参数
program.parse(process.argv);
//# sourceMappingURL=index.js.map