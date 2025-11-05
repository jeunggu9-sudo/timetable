import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import fs from 'fs';

let db: Database | null = null;

/**
 * SQLite 데이터베이스 연결을 가져오거나 생성합니다
 */
export async function getDatabase(): Promise<Database> {
  if (db) {
    return db;
  }

  const dbPath = process.env.DATABASE_PATH || './data/schedule.db';
  const dbDir = path.dirname(dbPath);

  // 데이터베이스 디렉토리가 없으면 생성
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  // 외래키 제약조건 활성화
  await db.exec('PRAGMA foreign_keys = ON;');

  return db;
}

/**
 * 데이터베이스 연결을 닫습니다
 */
export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.close();
    db = null;
  }
}
