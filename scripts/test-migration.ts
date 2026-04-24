#!/usr/bin/env bun

/**
 * Migration Validation Test Script
 *
 * This script validates the migration scripts without actually migrating data.
 * It checks:
 * - Old database can be opened and read
 * - Records can be queried and converted
 * - New schema is valid
 * - CAS functionality works
 */

import * as lancedb from '@lancedb/lancedb';
import * as path from 'node:path';
import * as os from 'node:os';

// Import from dist directories (after build)
import { ContentAddressableStorage } from '../packages/storage-flesh/dist/index.js';
import { VectorStorage } from '../packages/storage-soul/dist/index.js';
import { MemoOp, validateInstruction } from '../packages/protocol/dist/index.js';

interface ValidationResult {
  success: boolean;
  message: string;
  details?: any;
}

async function testGBrainMigration(): Promise<ValidationResult> {
  const oldDbPath = (process.env.GBRAIN_DB_PATH ?? '~/.hermes/data/gbrain.lancedb').replace(/^~/, os.homedir());
  const casPath = (process.env.MEMOHUB_CAS_PATH ?? '~/.memohub/blobs').replace(/^~/, os.homedir());

  try {
    // Test 1: Can we open the old database?
    const oldDb = await lancedb.connect(path.resolve(oldDbPath));
    const tableNames = await oldDb.tableNames();

    if (!tableNames.includes('gbrain')) {
      return {
        success: true,
        message: 'No gbrain table found (nothing to migrate)',
      };
    }

    // Test 2: Can we read records?
    const oldTable = await oldDb.openTable('gbrain');
    const records = await oldTable.query().limit(10).toArray();

    if (records.length === 0) {
      return {
        success: true,
        message: 'GBrain table is empty (nothing to migrate)',
      };
    }

    // Test 3: Do records have required fields?
    const sampleRecord = records[0] as any;
    const requiredFields = ['id', 'vector'];
    const missingFields = requiredFields.filter(f => !(f in sampleRecord));

    if (missingFields.length > 0) {
      return {
        success: false,
        message: `GBrain records missing required fields: ${missingFields.join(', ')}`,
        details: { sampleRecord }
      };
    }

    // Test 4: Can we convert to new schema?
    const converted = {
      id: sampleRecord.id?.startsWith('insight-') ? sampleRecord.id : `insight-${sampleRecord.id}`,
      vector: sampleRecord.vector ?? new Array(768).fill(0),
      hash: 'test-hash-' + sampleRecord.id, // Placeholder
      track_id: 'track-insight',
      entities: sampleRecord.entities ?? [],
      metadata: {
        category: sampleRecord.category ?? 'other',
        importance: sampleRecord.importance ?? 0.5,
        tags: sampleRecord.tags ?? [],
        source: sampleRecord.source ?? 'migration',
        scope: sampleRecord.scope ?? 'global',
      },
      timestamp: sampleRecord.timestamp ?? new Date().toISOString(),
    };

    // Test 5: Is the converted schema valid?
    const validation = validateInstruction({
      op: MemoOp.ADD,
      trackId: 'track-insight',
      payload: {
        text: sampleRecord.text ?? 'test',
        category: converted.metadata.category,
        importance: converted.metadata.importance,
        tags: converted.metadata.tags,
        entities: converted.entities,
      },
    });

    if (!validation.success) {
      return {
        success: false,
        message: `Converted GBrain record fails validation: ${validation.error}`,
        details: { converted, validationError: validation.error }
      };
    }

    // Test 6: Does CAS work?
    const cas = new ContentAddressableStorage(casPath);
    const testHash = await cas.write('test content');
    const canRead = await cas.has(testHash);

    if (!canRead) {
      return {
        success: false,
        message: 'CAS write verification failed',
      };
    }

    return {
      success: true,
      message: `GBrain migration validation passed (${records.length} records)`,
      details: {
        totalRecords: (await oldTable.query().limit(100000).toArray()).length,
        sampleConversion: converted,
        casWorks: true,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: `GBrain migration validation failed: ${error instanceof Error ? error.message : String(error)}`,
      details: { error },
    };
  }
}

async function testClawMemMigration(): Promise<ValidationResult> {
  const oldDbPath = (process.env.CLAWMEM_DB_PATH ?? '~/.hermes/data/clawmem.lancedb').replace(/^~/, os.homedir());
  const casPath = (process.env.MEMOHUB_CAS_PATH ?? '~/.memohub/blobs').replace(/^~/, os.homedir());

  try {
    // Test 1: Can we open the old database?
    const oldDb = await lancedb.connect(path.resolve(oldDbPath));
    const tableNames = await oldDb.tableNames();

    if (!tableNames.includes('clawmem')) {
      return {
        success: true,
        message: 'No clawmem table found (nothing to migrate)',
      };
    }

    // Test 2: Can we read records?
    const oldTable = await oldDb.openTable('clawmem');
    const records = await oldTable.query().limit(10).toArray();

    if (records.length === 0) {
      return {
        success: true,
        message: 'ClawMem table is empty (nothing to migrate)',
      };
    }

    // Test 3: Do records have required fields?
    const sampleRecord = records[0] as any;
    const requiredFields = ['id', 'vector'];
    const missingFields = requiredFields.filter(f => !(f in sampleRecord));

    if (missingFields.length > 0) {
      return {
        success: false,
        message: `ClawMem records missing required fields: ${missingFields.join(', ')}`,
        details: { sampleRecord }
      };
    }

    // Test 4: Can we convert to new schema?
    const converted = {
      id: sampleRecord.id?.startsWith('source-') ? sampleRecord.id : `source-${sampleRecord.id}`,
      vector: sampleRecord.vector ?? new Array(768).fill(0),
      hash: 'test-hash-' + sampleRecord.id, // Placeholder
      track_id: 'track-source',
      entities: sampleRecord.entities ?? [sampleRecord.symbol_name].filter(Boolean),
      metadata: {
        language: sampleRecord.language ?? 'typescript',
        ast_type: sampleRecord.ast_type ?? 'unknown',
        symbol_name: sampleRecord.symbol_name ?? '',
        parent_symbol: sampleRecord.parent_symbol ?? null,
        file_path: sampleRecord.file_path ?? '',
        importance: sampleRecord.importance ?? 0.5,
        tags: sampleRecord.tags ?? [],
        source: sampleRecord.source ?? 'migration',
      },
      timestamp: sampleRecord.timestamp ?? new Date().toISOString(),
    };

    // Test 5: Is the converted schema valid?
    const validation = validateInstruction({
      op: MemoOp.ADD,
      trackId: 'track-source',
      payload: {
        text: sampleRecord.text ?? 'test',
        code: sampleRecord.text ?? 'test',
        language: converted.metadata.language,
        ast_type: converted.metadata.ast_type,
        symbol_name: converted.metadata.symbol_name,
        file_path: converted.metadata.file_path,
      },
    });

    if (!validation.success) {
      return {
        success: false,
        message: `Converted ClawMem record fails validation: ${validation.error}`,
        details: { converted, validationError: validation.error }
      };
    }

    return {
      success: true,
      message: `ClawMem migration validation passed (${records.length} records)`,
      details: {
        totalRecords: (await oldTable.query().limit(100000).toArray()).length,
        sampleConversion: converted,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: `ClawMem migration validation failed: ${error instanceof Error ? error.message : String(error)}`,
      details: { error },
    };
  }
}

async function main() {
  console.log('🧪 Testing Migration Scripts\n');

  // Test GBrain migration
  console.log('📋 Testing GBrain migration...');
  const gbrainResult = await testGBrainMigration();
  console.log(`  ${gbrainResult.success ? '✅' : '❌'} ${gbrainResult.message}`);
  if (gbrainResult.details) {
    console.log(`  Details:`, JSON.stringify(gbrainResult.details, null, 2));
  }
  console.log();

  // Test ClawMem migration
  console.log('📋 Testing ClawMem migration...');
  const clawmemResult = await testClawMemMigration();
  console.log(`  ${clawmemResult.success ? '✅' : '❌'} ${clawmemResult.message}`);
  if (clawmemResult.details) {
    console.log(`  Details:`, JSON.stringify(clawmemResult.details, null, 2));
  }
  console.log();

  // Summary
  const allPassed = gbrainResult.success && clawmemResult.success;
  console.log('📊 Summary:');
  console.log(`  GBrain: ${gbrainResult.success ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  ClawMem: ${clawmemResult.success ? '✅ PASS' : '❌ FAIL'}`);
  console.log();
  console.log(allPassed ? '🎉 All migration tests passed!' : '⚠️  Some migration tests failed');

  process.exit(allPassed ? 0 : 1);
}

main().catch(console.error);
