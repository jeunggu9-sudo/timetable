/**
 * 데이터베이스 초기화 스크립트
 * 이 스크립트를 실행하여 데이터베이스를 생성하고 초기화합니다
 * 
 * 실행 방법: npm run init-db
 */

import dotenv from 'dotenv';
import { initializeDatabase, closeDatabase } from '../database';

// 환경변수 로드
dotenv.config();

async function main() {
  try {
    await initializeDatabase();
    console.log('\n✓ 데이터베이스 초기화가 성공적으로 완료되었습니다.');
    process.exit(0);
  } catch (error) {
    console.error('\n✗ 데이터베이스 초기화 중 오류가 발생했습니다:', error);
    process.exit(1);
  } finally {
    await closeDatabase();
  }
}

main();
