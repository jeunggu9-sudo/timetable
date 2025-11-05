/**
 * off_days 테이블에 reason 컬럼을 추가하는 마이그레이션 스크립트
 */

import dotenv from 'dotenv';
import { getDatabase, closeDatabase } from '../database/connection';

// 환경변수 로드
dotenv.config();

async function migrateOffDaysTable() {
  try {
    const db = await getDatabase();
    
    console.log('off_days 테이블 마이그레이션을 시작합니다...');
    
    // 기존 테이블 구조 확인
    const tableInfo = await db.all("PRAGMA table_info(off_days)");
    console.log('현재 테이블 구조:', tableInfo);
    
    // reason 컬럼이 있는지 확인
    const hasReasonColumn = tableInfo.some((column: any) => column.name === 'reason');
    
    if (hasReasonColumn) {
      console.log('✓ reason 컬럼이 이미 존재합니다.');
      return;
    }
    
    console.log('reason 컬럼을 추가합니다...');
    
    // reason 컬럼 추가
    await db.exec(`
      ALTER TABLE off_days 
      ADD COLUMN reason TEXT DEFAULT '';
    `);
    
    console.log('✓ reason 컬럼이 성공적으로 추가되었습니다.');
    
    // 업데이트된 테이블 구조 확인
    const updatedTableInfo = await db.all("PRAGMA table_info(off_days)");
    console.log('업데이트된 테이블 구조:', updatedTableInfo);
    
  } catch (error) {
    console.error('✗ 마이그레이션 중 오류가 발생했습니다:', error);
    throw error;
  }
}

async function main() {
  try {
    await migrateOffDaysTable();
    console.log('\n✓ off_days 테이블 마이그레이션이 성공적으로 완료되었습니다.');
    process.exit(0);
  } catch (error) {
    console.error('\n✗ 마이그레이션 실패:', error);
    process.exit(1);
  } finally {
    await closeDatabase();
  }
}

main();