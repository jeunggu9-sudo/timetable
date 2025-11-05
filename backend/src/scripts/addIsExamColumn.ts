import { getDatabase } from '../database/connection';

/**
 * 기존 데이터베이스에 is_exam 컬럼을 추가하는 마이그레이션 스크립트
 */
async function addIsExamColumn() {
  try {
    const db = await getDatabase();
    
    console.log('is_exam 컬럼 추가 시작...');
    
    // 컬럼이 이미 존재하는지 확인
    const tableInfo = await db.all('PRAGMA table_info(schedules)');
    const hasIsExam = tableInfo.some((col: any) => col.name === 'is_exam');
    
    if (hasIsExam) {
      console.log('is_exam 컬럼이 이미 존재합니다.');
      return;
    }
    
    // is_exam 컬럼 추가
    await db.exec(`
      ALTER TABLE schedules 
      ADD COLUMN is_exam BOOLEAN DEFAULT 0;
    `);
    
    console.log('is_exam 컬럼이 성공적으로 추가되었습니다.');
    
    // 기존 데이터의 is_exam을 false로 설정
    await db.run('UPDATE schedules SET is_exam = 0 WHERE is_exam IS NULL');
    
    console.log('기존 데이터 업데이트 완료.');
    
  } catch (error) {
    console.error('마이그레이션 실패:', error);
    process.exit(1);
  }
}

// 스크립트 실행
addIsExamColumn()
  .then(() => {
    console.log('마이그레이션 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('마이그레이션 오류:', error);
    process.exit(1);
  });
