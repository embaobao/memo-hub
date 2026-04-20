#!/usr/bin/env bun

/**
 * 分析 ClawMem 代码记录的分布
 */

import { connect } from '@lancedb/lancedb';
import { homedir } from 'os';

const CLAWMEM_DB_PATH = `${homedir()}/.hermes/data/clawmem.lancedb`;

async function analyzeClawMem() {
  const db = await connect(CLAWMEM_DB_PATH);
  const table = await db.openTable('clawmem');

  const total = await table.countRows();
  console.log(`\n📊 ClawMem 代码记录分析`);
  console.log(`================================================================================`);
  console.log(`总记录数: ${total}\n`);

  // 按语言统计
  const allData = await table.toArrow();
  const byLanguage: Record<string, number> = {};
  const byAstType: Record<string, number> = {};
  const bySource: Record<string, number> = {};

  for (let i = 0; i < allData.numRows; i++) {
    const lang = allData.getChildAt(allData.schema.fields.findIndex(f => f.name === 'language'))?.get(i) || 'unknown';
    const ast = allData.getChildAt(allData.schema.fields.findIndex(f => f.name === 'ast_type'))?.get(i) || 'unknown';
    const source = allData.getChildAt(allData.schema.fields.findIndex(f => f.name === 'source'))?.get(i) || 'unknown';

    byLanguage[lang] = (byLanguage[lang] || 0) + 1;
    byAstType[ast] = (byAstType[ast] || 0) + 1;
    bySource[source] = (bySource[source] || 0) + 1;
  }

  // 按语言分布
  console.log(`📌 按语言分布:`);
  console.log(`--------------------------------------------------------------------------------`);
  Object.entries(byLanguage)
    .sort((a, b) => b[1] - a[1])
    .forEach(([lang, count]) => {
      console.log(`  ${lang.padEnd(20)} ${count.toString().padStart(5)} 条`);
    });

  // 按 AST 类型分布
  console.log(`\n📌 按 AST 类型分布:`);
  console.log(`--------------------------------------------------------------------------------`);
  Object.entries(byAstType)
    .sort((a, b) => b[1] - a[1])
    .forEach(([ast, count]) => {
      console.log(`  ${ast.padEnd(30)} ${count.toString().padStart(5)} 条`);
    });

  // 按来源分布
  console.log(`\n📌 按来源分布:`);
  console.log(`--------------------------------------------------------------------------------`);
  Object.entries(bySource)
    .sort((a, b) => b[1] - a[1])
    .forEach(([source, count]) => {
      console.log(`  ${source.padEnd(30)} ${count.toString().padStart(5)} 条`);
    });

  // 重要记录抽样
  console.log(`\n📌 高重要性记录抽样:`);
  console.log(`--------------------------------------------------------------------------------`);
  const importances = allData.getChildAt(allData.schema.fields.findIndex(f => f.name === 'importance')) || [];
  const texts = allData.getChildAt(allData.schema.fields.findIndex(f => f.name === 'text')) || [];
  const asts = allData.getChildAt(allData.schema.fields.findIndex(f => f.name === 'ast_type')) || [];

  let shown = 0;
  for (let i = 0; i < allData.numRows && shown < 10; i++) {
    const importance = importances?.get(i) || 0;
    if (importance >= 0.8) {
      const text = texts?.get(i) || '';
      const ast = asts?.get(i) || 'unknown';
      const name = text.substring(0, 40);
      console.log(`  ${shown + 1}. ${name} (${ast}) [${importance}]`);
      shown++;
    }
  }
}

analyzeClawMem().catch(console.error);
