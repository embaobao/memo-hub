#!/usr/bin/env node
// @ts-nocheck
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { MemoryKernel } from '../../../packages/core/src/kernel.ts';
import { MemoOp } from '../../../packages/protocol/src/types.ts';
import { ConfigLoader } from '../../../packages/config/src/index.ts';
import { 
  CasTool, 
  VectorTool, 
  EmbedderTool, 
  RetrieverTool, 
  RerankerTool, 
  AggregatorTool, 
  EntityLinkerTool, 
  GraphStoreTool,
  CodeAnalyzerTool
} from '../../../packages/builtin-tools/src/index.ts';
import { DeduplicatorTool } from '../../../packages/librarian/src/tools.ts';

import { InsightTrack } from '../../../tracks/track-insight/src/index.ts';
import { SourceTrack } from '../../../tracks/track-source/src/index.ts';
import { StreamTrack } from '../../../tracks/track-stream/src/index.ts';
import { WikiTrack } from '../../../tracks/track-wiki/src/index.ts';

export async function createKernel(): Promise<MemoryKernel> {
  const loader = new ConfigLoader();
  const config = loader.getConfig();

  const kernel = new MemoryKernel(config);
  await kernel.initialize();

  // 注册原子工具
  const tr = kernel.getToolRegistry();
  tr.register(new CasTool());
  tr.register(new VectorTool());
  tr.register(new EmbedderTool());
  tr.register(new RetrieverTool());
  tr.register(new RerankerTool());
  tr.register(new AggregatorTool());
  tr.register(new EntityLinkerTool());
  tr.register(new CodeAnalyzerTool());
  tr.register(new GraphStoreTool(config.system.root));
  tr.register(new DeduplicatorTool() as any);

  // 编程式注册内置轨道
  await kernel.registerTrack(new InsightTrack());
  await kernel.registerTrack(new SourceTrack());
  await kernel.registerTrack(new StreamTrack());
  await kernel.registerTrack(new WikiTrack());

  return kernel;
}

const program = new Command();

program
  .name('memohub')
  .description('MemoHub v1 - Personal Agent Memory System')
  .version('1.0.0');

program
  .command('ui')
  .description('Start MemoHub Web Console')
  .action(async () => {
    const { startApiServer } = await import('./api.ts');
    const kernel = await createKernel();
    await startApiServer(kernel);
  });

program.parse();
