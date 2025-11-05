/**
 * school_holidays 테이블을 기존 데이터베이스에 추가하는 스크립트
 * 
 * 사용법: node add-school-holidays-table.js
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'schedule.db');
const db = new sqlite3.Database(dbPath);

console.log('데이터베이스 연결 성공:', dbPath);

// school_holidays 테이블 생성
db.serialize(() => {
  console.log('school_holidays 테이블 생성 중...');
  
  db.run(`
    CREATE TABLE IF NOT EXISTS school_holidays (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      start_period INTEGER,
      end_period INTEGER,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(date, start_period, end_period)
    );
  `, (err) => {
    if (err) {
      console.error('테이블 생성 실패:', err.message);
    } else {
      console.log('✓ school_holidays 테이블 생성 완료');
    }
  });

  // 인덱스 생성
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_school_holidays_date 
    ON school_holidays(date);
  `, (err) => {
    if (err) {
      console.error('인덱스 생성 실패:', err.message);
    } else {
      console.log('✓ 인덱스 생성 완료');
    }
  });
});

db.close((err) => {
  if (err) {
    console.error('데이터베이스 종료 실패:', err.message);
  } else {
    console.log('\n데이터베이스 업데이트 완료!');
    console.log('백엔드 서버를 재시작해주세요.');
  }
});
