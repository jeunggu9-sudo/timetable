/**
 * 데이터베이스 완전 초기화 스크립트
 * 모든 테이블을 삭제하고 새로운 스키마로 재생성합니다
 * 
 * 실행 방법: npm run reset-db
 */

import dotenv from 'dotenv';
import { getDatabase, closeDatabase } from '../database/connection';
import { dropAllTables, createSchema, createIndexes } from '../database/schema';

// 환경변수 로드
dotenv.config();

async function main() {
  try {
    console.log('=== 데이터베이스 완전 초기화 시작 ===\n');

    // 데이터베이스 연결
    const db = await getDatabase();
    console.log('✓ 데이터베이스 연결 성공');

    // 모든 테이블 삭제
    console.log('\n기존 테이블 삭제 중...');
    await dropAllTables(db);
    console.log('✓ 모든 테이블 삭제 완료');

    // 스키마 재생성
    console.log('\n새로운 스키마 생성 중...');
    await createSchema(db);
    console.log('✓ 테이블 생성 완료');

    // 인덱스 생성
    console.log('\n인덱스 생성 중...');
    await createIndexes(db);
    console.log('✓ 인덱스 생성 완료');

    console.log('\n=== 데이터베이스 초기화가 성공적으로 완료되었습니다 ===');
    console.log('\n생성된 테이블:');
    console.log('  - courses (교과목)');
    console.log('  - instructors (교관)');
    console.log('  - schedules (일정, is_exam 필드 포함)');
    console.log('  - off_days (휴무일)');
    
    process.exit(0);
  } catch (error) {
    console.error('\n✗ 데이터베이스 초기화 중 오류가 발생했습니다:', error);
    process.exit(1);
  } finally {
    await closeDatabase();
  }
}

main();
