import { Database } from 'sqlite';

/**
 * 데이터베이스 스키마를 생성합니다
 */
export async function createSchema(db: Database): Promise<void> {
  // courses 테이블 생성
  await db.exec(`
    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      구분 TEXT NOT NULL,
      과목 TEXT NOT NULL,
      시수 INTEGER NOT NULL,
      담당교관 TEXT NOT NULL,
      선배정 INTEGER NOT NULL CHECK(선배정 IN (1, 2)),
      평가 TEXT,
      excel_order INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // instructors 테이블 생성
  await db.exec(`
    CREATE TABLE IF NOT EXISTS instructors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // schedules 테이블 생성
  await db.exec(`
    CREATE TABLE IF NOT EXISTS schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL,
      instructor_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      start_period INTEGER NOT NULL,
      end_period INTEGER NOT NULL,
      is_pre_assigned BOOLEAN DEFAULT 0,
      is_exam BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
      FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE CASCADE
    );
  `);

  // off_days 테이블 생성
  await db.exec(`
    CREATE TABLE IF NOT EXISTS off_days (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      instructor_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      reason TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE CASCADE,
      UNIQUE(instructor_id, date)
    );
  `);

  // school_holidays 테이블 생성 (전체 휴관일)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS school_holidays (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      start_period INTEGER,
      end_period INTEGER,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(date, start_period, end_period)
    );
  `);
}

/**
 * 인덱스를 생성합니다
 */
export async function createIndexes(db: Database): Promise<void> {
  // schedules 테이블 인덱스
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_schedules_date 
    ON schedules(date);
  `);

  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_schedules_course 
    ON schedules(course_id);
  `);

  // off_days 테이블 인덱스
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_off_days_instructor 
    ON off_days(instructor_id);
  `);

  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_off_days_date 
    ON off_days(date);
  `);

  // school_holidays 테이블 인덱스
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_school_holidays_date 
    ON school_holidays(date);
  `);
}

/**
 * 모든 테이블을 삭제합니다 (테스트용)
 */
export async function dropAllTables(db: Database): Promise<void> {
  await db.exec('DROP TABLE IF EXISTS schedules;');
  await db.exec('DROP TABLE IF EXISTS school_holidays;');
  await db.exec('DROP TABLE IF EXISTS off_days;');
  await db.exec('DROP TABLE IF EXISTS courses;');
  await db.exec('DROP TABLE IF EXISTS instructors;');
}
