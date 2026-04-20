#!/usr/bin/env bun

/**
 * 清理 ClawMem 中的技能数据，迁移到 GBrain
 *
 * 脚本目标：
 * 1. 从 ClawMem 中识别所有 .md/.prompt 文件的数据
 * 2. 将这些数据迁移到 GBrain
 * 3. 从 ClawMem 中删除这些数据
 */

import { connectToDatabase, closeDatabase } from '../src/lib/db.js';

/**
 * 主函数
 */
async function main() {
  console.log('🧹 开始清理技能数据...\n');

  const db = await connectToDatabase();

  try {
    // 1. 查找所有 .md 和 .prompt 文件的数据
    console.log('📊 步骤 1: 查找技能数据...');
    const skills = db.prepare(`
      SELECT id, symbol_name, file_path, text, language, ast_type
      FROM clawmem
      WHERE file_path LIKE '%.md' OR file_path LIKE '%.prompt'
    `).all();

    console.log(`   找到 ${skills.length} 条技能数据\n`);

    if (skills.length === 0) {
      console.log('✅ 没有需要清理的技能数据');
      return;
    }

    // 2. 迁移到 GBrain
    console.log('📦 步骤 2: 迁移到 GBrain...');
    let migrated = 0;
    let failed = 0;

    const insertGBrain = db.prepare(`
      INSERT INTO gbrain (text, category, importance, tags, created_at, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
    `);

    for (const skill of skills) {
      try {
        // 从文件路径提取技能名称
        const skillName = skill.file_path.split('/').pop().replace(/\.(md|prompt)$/, '');

        // 构建知识文本
        const knowledgeText = [
          `技能名称: ${skillName}`,
          `文件路径: ${skill.file_path}`,
          `语言: ${skill.language}`,
          `AST 类型: ${skill.ast_type}`,
          '',
          skill.text
        ].join('\n');

        // 插入到 GBrain
        insertGBrain.run(
          knowledgeText,
          'skills', // category
          0.7, // importance
          JSON.stringify(['skill', 'migration', skill.language]) // tags
        );

        migrated++;
        console.log(`   ✓ 迁移: ${skill.file_path}`);
      } catch (error) {
        failed++;
        console.error(`   ✗ 失败: ${skill.file_path}`, error);
      }
    }

    console.log(`   迁移完成: ${migrated} 条成功, ${failed} 条失败\n`);

    // 3. 从 ClawMem 中删除
    console.log('🗑️  步骤 3: 从 ClawMem 中删除...');
    const deleteStmt = db.prepare(`
      DELETE FROM clawmem
      WHERE file_path LIKE '%.md' OR file_path LIKE '%.prompt'
    `);

    const deleted = deleteStmt.run().changes;
    console.log(`   删除了 ${deleted} 条记录\n`);

    // 4. 显示统计信息
    console.log('📈 清理统计:');
    console.log('   ' + '='.repeat(50));
    console.log(`   原有技能数据: ${skills.length} 条`);
    console.log(`   迁移到 GBrain: ${migrated} 条`);
    console.log(`   迁移失败: ${failed} 条`);
    console.log(`   从 ClawMem 删除: ${deleted} 条`);
    console.log('   ' + '='.repeat(50));

    console.log('\n✅ 清理完成！');
  } catch (error) {
    console.error('❌ 清理失败:', error);
    throw error;
  } finally {
    await closeDatabase(db);
  }
}

// 执行主函数
main().catch(error => {
  console.error(error);
  process.exit(1);
});
