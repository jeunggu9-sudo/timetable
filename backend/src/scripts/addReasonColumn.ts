import { getDatabase } from '../database/connection';

/**
 * off_days 테이블에 reason 컬럼을 추가하는 마이그레이션 스크립트
 */
async function addReasonColumn() {
  try {
    const db = await getDatabase();
    
    // 테이블 구조 확인
    const tableInfo = await db.all("PRAGMA table_info(off_days)");
    console.log('현재 off_days 테이블 구조:', tableInfo);
    
    // reason 컬럼이 이미 있는지 확인
    const hasReasonColumn = tableInfo.some((column: any) => column.name === 'reason');
    
    if (hasReasonColumn) {
      console.log('reason 컬럼이 이미 존재합니다.');
      return;
    }
    
    // reason 컬럼 추가
    await db.run('ALTER TABLE off_days ADD COLUMN reason TEXT DEFAULT ""');
    console.log('reason 컬럼이 성공적으로 추가되었습니다.');
    
    // 업데이트된 테이블 구조 확인
    const updatedTableInfo = await db.all("PRAGMA table_info(off_days)");
    console.log('업데이트된 off_days 테이블 구조:', updatedTableInfo);
    
  } catch (error) {
    console.error('마이그레이션 실행 중 오류:', error);
    process.exit(1);
  }
}

// 스크립트 실행
addReasonColumn()
  .then(() => {
    console.log('마이그레이션 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('마이그레이션 실패:', error);
    process.exit(1);
  });