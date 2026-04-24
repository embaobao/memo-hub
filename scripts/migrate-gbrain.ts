#!/usr/bin/env bun

import * as lancedb from '@lancedb/lancedb';
import * as path from 'node:path';
import * as os from 'node:os';
import { ContentAddressableStorage } from '../packages/storage-flesh/src/index.js';
import { VectorStorage } from '../packages/storage-soul/src/index.js';

const DRY_RUN = process.argv.includes('--dry-run');

async function migrateGBrain() {
  const oldDbPath = (process.env.GBRAIN_DB_PATH ?? '~/.hermes/data/gbrain.lancedb').replace(/^~/, os.homedir());
  const newDbPath = (process.env.MEMOHUB_DB_PATH ?? '~/.memohub/data/memohub.lancedb').replace(/^~/, os.homedir());
  const casPath = (process.env.MEMOHUB_CAS_PATH ?? '~/.memohub/blobs').replace(/^~/, os.homedir());

  console.log(`Migrating GBrain: ${oldDbPath} → ${newDbPath}`);
  if (DRY_RUN) console.log('[DRY RUN] No changes will be written');

  const oldDb = await lancedb.connect(path.resolve(oldDbPath));
  const tableNames = await oldDb.tableNames();

  if (!tableNames.includes('gbrain')) {
    console.log('No gbrain table found, skipping');
    return;
  }

  const oldTable = await oldDb.openTable('gbrain');
  const records = await oldTable.query().limit(100000).toArray();

  console.log(`Found ${records.length} gbrain records`);

  if (DRY_RUN) {
    console.log(`[DRY RUN] Would migrate ${records.length} records to track-insight`);
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
      id: r.id?.startsWith('insight-') ? r.id : `insight-${r.id}`,
      vector: r.vector ?? new Array(768).fill(0),
      hash,
      track_id: 'track-insight',
      entities: r.entities ?? [],
      metadata: {
        category: r.category ?? 'other',
        importance: r.importance ?? 0.5,
        tags: r.tags ?? [],
        source: r.source ?? 'migration',
        scope: r.scope ?? 'global',
      },
      timestamp: r.timestamp ?? new Date().toISOString(),
    });

    migrated++;
  }

  console.log(`Migrated ${migrated} gbrain records to track-insight`);
}

migrateGBrain().catch(console.error);
