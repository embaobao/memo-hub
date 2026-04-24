#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import * as yaml from 'yaml';
import { MemoryKernel } from '@memohub/core';
import { OllamaAdapter } from '@memohub/ai-provider';
import { AIProviderRegistry } from '@memohub/ai-provider';
import { ContentAddressableStorage } from '@memohub/storage-flesh';
import { VectorStorage } from '@memohub/storage-soul';
import { MemoOp } from '@memohub/protocol';
import { InsightTrack } from '@memohub/track-insight';
import { SourceTrack } from '@memohub/track-source';
import { Librarian } from '@memohub/librarian';

import { ConfigLoader, resolvePath } from '@memohub/config';

export async function createKernel(): Promise<MemoryKernel> {
  const loader = new ConfigLoader();
  const config = loader.getConfig();
  
  const kernel = new MemoryKernel(config);
  await kernel.initialize();

  return kernel;
}

const program = new Command();

program
  .name('memohub')
  .description('MemoHub v1 - Personal Agent Memory System')
  .version('1.0.0');

program
  .command('add <text>')
  .description('Add knowledge entry')
  .option('-c, --category <category>', 'Category', 'other')
  .option('-i, --importance <importance>', 'Importance (0-1)', '0.5')
  .option('-t, --tags <tags>', 'Comma-separated tags', '')
  .action(async (text: string, opts: any) => {
    const spinner = ora('Adding knowledge...').start();
    try {
      const kernel = await createKernel();
      const result = await kernel.dispatch({
        op: MemoOp.ADD,
        trackId: 'track-insight',
        payload: {
          text,
          category: opts.category,
          importance: parseFloat(opts.importance),
          tags: opts.tags ? opts.tags.split(',').map((t: string) => t.trim()) : [],
        },
      });
      if (result.success) {
        spinner.succeed(chalk.green(`Added: ${result.data.id}`));
      } else {
        spinner.fail(chalk.red(`Error: ${result.error}`));
      }
    } catch (error) {
      spinner.fail(chalk.red(error instanceof Error ? error.message : String(error)));
    }
  });

program
  .command('search <query>')
  .description('Search knowledge')
  .option('-l, --limit <limit>', 'Result limit', '5')
  .action(async (query: string, opts: any) => {
    const spinner = ora('Searching...').start();
    try {
      const kernel = await createKernel();
      const result = await kernel.dispatch({
        op: MemoOp.RETRIEVE,
        trackId: 'track-insight',
        payload: { query, limit: parseInt(opts.limit) },
      });
      if (result.success && result.data?.length) {
        spinner.succeed(chalk.green(`Found ${result.data.length} results:`));
        for (const r of result.data) {
          console.log(chalk.cyan(`  [${r._distance?.toFixed(4) ?? '?'}]`) + ` ${r.text?.slice(0, 100)}...`);
        }
      } else {
        spinner.info(chalk.yellow('No results found'));
      }
    } catch (error) {
      spinner.fail(chalk.red(error instanceof Error ? error.message : String(error)));
    }
  });

program
  .command('list')
  .description('List knowledge categories')
  .action(async () => {
    const spinner = ora('Listing categories...').start();
    try {
      const kernel = await createKernel();
      const result = await kernel.dispatch({
        op: MemoOp.LIST,
        trackId: 'track-insight',
        payload: {},
      });
      if (result.success) {
        spinner.succeed(chalk.green('Categories:'));
        for (const [cat, count] of Object.entries(result.data.categories ?? {})) {
          console.log(`  ${chalk.cyan(cat)}: ${count}`);
        }
        console.log(`  Total: ${result.data.total}`);
      }
    } catch (error) {
      spinner.fail(chalk.red(error instanceof Error ? error.message : String(error)));
    }
  });

program
  .command('delete')
  .description('Delete knowledge entries')
  .option('--ids <ids>', 'Comma-separated IDs')
  .option('--category <category>', 'Delete by category')
  .action(async (opts: any) => {
    const spinner = ora('Deleting...').start();
    try {
      const kernel = await createKernel();
      const result = await kernel.dispatch({
        op: MemoOp.DELETE,
        trackId: 'track-insight',
        payload: {
          ids: opts.ids ? opts.ids.split(',').map((s: string) => s.trim()) : undefined,
          category: opts.category,
        },
      });
      if (result.success) {
        spinner.succeed(chalk.green('Deleted'));
      } else {
        spinner.fail(chalk.red(`Error: ${result.error}`));
      }
    } catch (error) {
      spinner.fail(chalk.red(error instanceof Error ? error.message : String(error)));
    }
  });

program
  .command('add-code <file>')
  .description('Add code file to source track')
  .option('-l, --language <language>', 'Language', 'typescript')
  .action(async (file: string, opts: any) => {
    const spinner = ora('Adding code...').start();
    try {
      const kernel = await createKernel();
      const code = fs.readFileSync(file, 'utf-8');
      const result = await kernel.dispatch({
        op: MemoOp.ADD,
        trackId: 'track-source',
        payload: { code, language: opts.language, file_path: file },
      });
      if (result.success) {
        const count = result.data?.length ?? 0;
        spinner.succeed(chalk.green(`Added ${count} symbol(s)`));
      } else {
        spinner.fail(chalk.red(`Error: ${result.error}`));
      }
    } catch (error) {
      spinner.fail(chalk.red(error instanceof Error ? error.message : String(error)));
    }
  });

program
  .command('search-code <query>')
  .description('Search code')
  .option('-l, --limit <limit>', 'Result limit', '5')
  .action(async (query: string, opts: any) => {
    const spinner = ora('Searching code...').start();
    try {
      const kernel = await createKernel();
      const result = await kernel.dispatch({
        op: MemoOp.RETRIEVE,
        trackId: 'track-source',
        payload: { query, limit: parseInt(opts.limit) },
      });
      if (result.success && result.data?.length) {
        spinner.succeed(chalk.green(`Found ${result.data.length} results:`));
        for (const r of result.data) {
          console.log(chalk.cyan(`  [${r.metadata?.symbol_name ?? ''}]`) + ` ${r.text?.slice(0, 80)}...`);
        }
      } else {
        spinner.info(chalk.yellow('No results found'));
      }
    } catch (error) {
      spinner.fail(chalk.red(error instanceof Error ? error.message : String(error)));
    }
  });

program
  .command('search-all <query>')
  .description('Unified search with retrieval pipeline (LightRAG style)')
  .option('-l, --limit <limit>', 'Result limit', '10')
  .option('--lexical', 'Enable lexical channel', false)
  .option('--entity-expansion', 'Enable entity expansion', true)
  .action(async (query: string, opts: any) => {
    const spinner = ora('Searching with retrieval pipeline...').start();
    try {
      const { RetrievalPipeline } = await import('@memohub/librarian');
      const kernel = await createKernel();
      const embedder = kernel.getEmbedder();

      const pipeline = new RetrievalPipeline(kernel, embedder, {
        maxResults: parseInt(opts.limit),
        enableLexical: opts.lexical,
        enableEntityExpansion: opts.entityExpansion,
      });

      const result = await pipeline.execute(query);

      spinner.succeed(chalk.green(`Pipeline completed in ${result.duration}ms`));

      // 显示 Pre 阶段结果
      console.log(chalk.bold('\n📋 Intent:'));
      console.log(`  Type: ${chalk.cyan(result.pre.intent.type)}`);
      console.log(`  Confidence: ${(result.pre.intent.confidence * 100).toFixed(0)}%`);
      console.log(`  Reason: ${result.pre.intent.reason}`);

      if (result.pre.entities.entities.length > 0) {
        console.log(chalk.bold('\n🏷️  Entities:'));
        console.log(`  ${result.pre.entities.entities.join(', ')}`);
      }

      // 显示 Exec 阶段结果
      console.log(chalk.bold('\n🔍 Retrieved:'));
      console.log(`  Vector: ${result.exec.stats.vectorCount} results`);
      if (result.exec.stats.lexicalCount !== undefined) {
        console.log(`  Lexical: ${result.exec.stats.lexicalCount} results`);
      }
      if (result.exec.stats.entityExpandedCount !== undefined && result.exec.stats.entityExpandedCount > 0) {
        console.log(`  Entity Expanded: ${result.exec.stats.entityExpandedCount} results`);
        console.log(`  Expansion Sources: ${result.exec.stats.expansionSources.join(', ')}`);
      }

      // 显示 Post 阶段结果
      console.log(chalk.bold('\n✨ Final Results:'));
      console.log(`  Dedup: ${result.post.dedupStats.beforeCount} → ${result.post.dedupStats.afterCount} (${result.post.dedupStats.duplicateCount} duplicates removed)`);

      if (result.post.finalResults.length === 0) {
        spinner.info(chalk.yellow('\nNo results found'));
        return;
      }

      console.log(chalk.bold(`\n📊 Top ${result.post.finalResults.length} Results:\n`));

      for (let i = 0; i < result.post.finalResults.length; i++) {
        const r = result.post.finalResults[i];
        const factor = result.post.rankingFactors[i];

        const trackIcon = r.track_id === 'track-source' ? '💻' : '🧠';
        const trackLabel = r.track_id === 'track-source' ? 'Code' : 'Knowledge';

        console.log(chalk.bold(`${i + 1}. ${trackIcon} [${trackLabel}]`) + chalk.gray(` (score: ${factor?.finalScore.toFixed(3)})`));
        console.log(chalk.gray(`   ID: ${r.id}`));
        console.log(chalk.gray(`   Track: ${r.track_id}`));

        if (r.track_id === 'track-source') {
          console.log(chalk.cyan(`   Symbol: ${r.metadata?.symbol_name ?? 'N/A'}`));
          console.log(chalk.cyan(`   Type: ${r.metadata?.ast_type ?? 'unknown'}`));
          if (r.metadata?.file_path) {
            console.log(chalk.cyan(`   File: ${r.metadata.file_path}`));
          }
        } else {
          console.log(chalk.cyan(`   Category: ${r.metadata?.category ?? 'N/A'}`));
          console.log(chalk.cyan(`   Importance: ${(r.metadata?.importance ?? 0.5).toFixed(2)}`));
        }

        if (r.entities && Array.isArray(r.entities) && r.entities.length > 0) {
          console.log(chalk.gray(`   Entities: ${r.entities.join(', ')}`));
        }

        const text = r.text ?? '';
        const preview = text.length > 150 ? text.slice(0, 150) + '...' : text;
        console.log(chalk.gray(`   Text: ${preview}`));

        if (factor) {
          console.log(chalk.gray(`   Scores: vec=${factor.vectorScore.toFixed(2)} ent=${factor.entityCoverage.toFixed(2)} trk=${factor.trackWeight.toFixed(2)}`));
        }

        console.log();
      }
    } catch (error) {
      spinner.fail(chalk.red(error instanceof Error ? error.message : String(error)));
    }
  });

program
  .command('dedup')
  .description('Run deduplication scan')
  .option('--track <trackId>', 'Track ID', 'track-insight')
  .option('--threshold <threshold>', 'Similarity threshold', '0.95')
  .action(async (opts: any) => {
    const spinner = ora('Scanning for duplicates...').start();
    try {
      const kernel = await createKernel();
      const result = await kernel.dispatch({
        op: MemoOp.LIST,
        trackId: 'track-librarian',
        payload: { trackId: opts.track, threshold: parseFloat(opts.threshold) },
      });
      if (result.success) {
        spinner.succeed(chalk.green(`Found ${result.data.conflictCount} potential duplicates`));
      }
    } catch (error) {
      spinner.fail(chalk.red(error instanceof Error ? error.message : String(error)));
    }
  });

program
  .command('distill')
  .description('Run knowledge distillation')
  .option('--track <trackId>', 'Track ID', 'track-insight')
  .action(async (opts: any) => {
    const spinner = ora('Distilling knowledge...').start();
    try {
      const kernel = await createKernel();
      const result = await kernel.dispatch({
        op: MemoOp.DISTILL,
        trackId: 'track-librarian',
        payload: { trackId: opts.track },
      });
      if (result.success) {
        spinner.succeed(chalk.green(`Distilled ${result.data.totalConflicts} conflicts`));
      }
    } catch (error) {
      spinner.fail(chalk.red(error instanceof Error ? error.message : String(error)));
    }
  });

program
  .command('config')
  .description('Show or validate configuration')
  .option('--validate', 'Validate configuration')
  .option('--init', 'Initialize default configuration file')
  .option('--show', 'Show current configuration with masked secrets')
  .option('--clear-cache', 'Clear execution cache')
  .option('--check', 'Scan configuration integrity and display registered tools/tracks')
  .action(async (opts: any) => {
    if (opts.init) {
      try {
        ConfigLoader.initDefault();
      } catch (error: any) {
        console.error(chalk.red(error.message));
      }
      return;
    }

    if (opts.clearCache) {
      const kernel = await createKernel();
      kernel.clearCache();
      console.log(chalk.green('Cache cleared successfully'));
      return;
    }

    if (opts.check) {
      const kernel = await createKernel();
      const tools = await kernel.listTools();
      const tracks = await kernel.listTracks();
      
      console.log(chalk.bold('\n🛠  Registered Tools:'));
      tools.forEach(t => console.log(`  - ${chalk.cyan(t.id)} (${t.type})`));
      
      console.log(chalk.bold('\n🛤  Registered Tracks:'));
      tracks.forEach(t => {
        const stepCount = t.flow?.length || Object.values(t.flows || {}).reduce((acc, f) => acc + (f?.length || 0), 0);
        console.log(`  - ${chalk.green(t.id)}: ${stepCount} steps total`);
      });
      return;
    }

    const loader = new ConfigLoader();
    const config = opts.show ? loader.getMaskedConfig() : loader.getConfig();

    if (opts.show && (config as any)._sources) {
      console.log(chalk.bold('\n📄 Configuration Sources:'));
      (config as any)._sources.forEach((s: string) => console.log(`  - ${chalk.dim(s)}`));
      console.log('');
    }

    if (opts.validate) {
      // Zod validation is already performed during loader.load()
      console.log(chalk.green('Configuration is valid'));
      return;
    }

    console.log(JSON.stringify(config, null, 2));
  });

program
  .command('update')
  .description('检查并更新 CLI 到最新版本')
  .action(async () => {
    const spinner = ora('检查更新...').start();
    try {
      // 动态导入 update 模块
      const updateModule = await import('./update.js');
      spinner.stop();
      await updateModule.main();
    } catch (error) {
      spinner.fail(chalk.red(error instanceof Error ? error.message : String(error)));
    }
  });

program
  .command('serve')
  .description('Start MCP server')
  .action(async () => {
    console.log(chalk.cyan('Starting MemoHub MCP Server...'));
    const { startMcpServer } = await import('./mcp.js');
    await startMcpServer();
  });

program.parse();
