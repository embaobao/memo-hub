#!/usr/bin/env bun

import * as lancedb from '@lancedb/lancedb';
import * as path from 'node:path';
import * as os from 'node:os';
import { ContentAddressableStorage } from '../packages/storage-flesh/src/index.js';
import { VectorStorage } from '../packages/storage-soul/src/index.js';

const DRY_RUN = process.argv.includes('--dry-run');

async function migrateClawMem() {
  const oldDbPath = (process.env.CLAWMEM_DB_PATH ?? '~/.hermes/data/clawmem.lancedb').replace(/^~/, os.homedir());
  const newDbPath = (process.env.MEMOHUB_DB_PATH ?? '~/.memohub/data/memohub.lancedb').replace(/^~/, os.homedir());
  const casPath = (process.env.MEMOHUB_CAS_PATH ?? '~/.memohub/blobs').replace(/^~/, os.homedir());

  console.log(`Migrating ClawMem: ${oldDbPath} → ${newDbPath}`);
  if (DRY_RUN) console.log('[DRY RUN] No changes will be written');

  const oldDb = await lancedb.connect(path.resolve(oldDbPath));
  const tableNames = await oldDb.tableNames();

  if (!tableNames.includes('clawmem')) {
    console.log('No clawmem table found, skipping');
    return;
  }

  const oldTable = await oldDb.openTable('clawmem');
  const records = await oldTable.query().limit(100000).toArray();

  console.log(`Found ${records.length} clawmem records`);

  if (DRY_RUN) {
    console.log(`[DRY RUN] Would migrate ${records.length} records to track-source`);
    return;
  }

  const cas = new ContentAddressableStorage(casPath);
  const newStorage = new VectorStorage({
    dbPath: newDbPath,
    tableName: 'memohub',
    dimensions: 768,
  });

  await newStorage.initialize();

  let migrated = 0;
  for (const record of records) {
    const r = record as any;
    if (!r.text || r.id === '__schema__') continue;

    const hash = await cas.write(r.text);

    await newStorage.add({
      id: r.id?.startsWith('source-') ? r.id : `source-${r.id}`,
      vector: r.vector ?? new Array(768).fill(0),
      hash,
      track_id: 'track-source',
      entities: r.entities ?? [r.symbol_name].filter(Boolean),
      metadata: {
        language: r.language ?? 'typescript',
        ast_type: r.ast_type ?? 'unknown',
        symbol_name: r.symbol_name ?? '',
        parent_symbol: r.parent_symbol ?? null,
        file_path: r.file_path ?? '',
        importance: r.importance ?? 0.5,
        tags: r.tags ?? [],
        source: r.source ?? 'migration',
      },
      timestamp: r.timestamp ?? new Date().toISOString(),
    });

    migrated++;
  }

  console.log(`Migrated ${migrated} clawmem records to track-source`);
}

migrateClawMem().catch(console.error);
