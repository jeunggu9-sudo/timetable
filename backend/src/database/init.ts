import { getDatabase } from './connection';
import { createSchema, createIndexes } from './schema';

/**
 * 데이터베이스를 초기화합니다
 * - 데이터베이스 연결 생성
 * - 스키마 생성
 * - 인덱스 생성
 */
export async function initializeDatabase(): Promise<void> {
  try {
    console.log('데이터베이스 초기화 시작...');

    // 데이터베이스 연결
    const db = await getDatabase();
    console.log('데이터베이스 연결 성공');

    // 스키마 생성
    await createSchema(db);
    console.log('테이블 생성 완료');

    // 인덱스 생성
    await createIndexes(db);
    console.log('인덱스 생성 완료');

    console.log('데이터베이스 초기화 완료');
  } catch (error) {
    console.error('데이터베이스 초기화 실패:', error);
    throw error;
  }
}
