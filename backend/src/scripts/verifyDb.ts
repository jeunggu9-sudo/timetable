/**
 * 데이터베이스 스키마 검증 스크립트
 */

import dotenv from 'dotenv';
import { getDatabase, closeDatabase } from '../database';

dotenv.config();

async function verifyDatabase() {
  try {
    const db = await getDatabase();
    
    console.log('=== 데이터베이스 스키마 검증 ===\n');
    
    // 테이블 목록 조회
    const tables = await db.all(`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      ORDER BY name;
    `);
    
    console.log('📋 테이블 목록:');
    tables.forEach(table => {
      console.log(`  - ${table.name}`);
    });
    
    console.log('\n📊 각 테이블 구조:\n');
    
    // 각 테이블의 구조 확인
    for (const table of tables) {
      if (table.name.startsWith('sqlite_')) continue;
      
      console.log(`\n[${table.name}]`);
      const columns = await db.all(`PRAGMA table_info(${table.name})`);
      columns.forEach(col => {
        const nullable = col.notnull ? 'NOT NULL' : 'NULL';
        const pk = col.pk ? '(PK)' : '';
        console.log(`  ${col.name}: ${col.type} ${nullable} ${pk}`);
      });
      
      // 외래키 확인
      const foreignKeys = await db.all(`PRAGMA foreign_key_list(${table.name})`);
      if (foreignKeys.length > 0) {
        console.log('  외래키:');
        foreignKeys.forEach(fk => {
          console.log(`    - ${fk.from} -> ${fk.table}(${fk.to})`);
        });
      }
    }
    
    // 인덱스 목록 조회
    console.log('\n\n🔍 인덱스 목록:');
    const indexes = await db.all(`
      SELECT name, tbl_name 
      FROM sqlite_master 
      WHERE type='index' AND name NOT LIKE 'sqlite_%'
      ORDER BY tbl_name, name;
    `);
    
    indexes.forEach(idx => {
      console.log(`  - ${idx.name} (on ${idx.tbl_name})`);
    });
    
    console.log('\n✓ 데이터베이스 검증 완료\n');
    
  } catch (error) {
    console.error('데이터베이스 검증 실패:', error);
    process.exit(1);
  } finally {
    await closeDatabase();
  }
}

verifyDatabase();
