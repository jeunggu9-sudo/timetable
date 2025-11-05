import { Database } from 'sqlite';
import { SchoolHoliday } from '../types/models';
import { getDatabase } from '../database/connection';

export class SchoolHolidayRepository {
  private db: Database | null = null;

  private async getDb(): Promise<Database> {
    if (!this.db) {
      this.db = await getDatabase();
    }
    return this.db;
  }

  /**
   * 새로운 휴관일을 생성합니다
   */
  async create(
    date: string,
    startPeriod: number | null,
    endPeriod: number | null,
    description: string | null
  ): Promise<SchoolHoliday> {
    const db = await this.getDb();
    const result = await db.run(
      'INSERT INTO school_holidays (date, start_period, end_period, description) VALUES (?, ?, ?, ?)',
      [date, startPeriod, endPeriod, description]
    );

    const created = await this.findById(result.lastID!);
    if (!created) {
      throw new Error('Failed to create school holiday');
    }
    return created;
  }

  /**
   * 모든 휴관일을 조회합니다
   */
  async findAll(): Promise<SchoolHoliday[]> {
    const db = await this.getDb();
    return await db.all<SchoolHoliday[]>('SELECT * FROM school_holidays ORDER BY date, start_period');
  }

  /**
   * ID로 휴관일을 조회합니다
   */
  async findById(id: number): Promise<SchoolHoliday | null> {
    const db = await this.getDb();
    const holiday = await db.get<SchoolHoliday>(
      'SELECT * FROM school_holidays WHERE id = ?',
      [id]
    );
    return holiday || null;
  }

  /**
   * 특정 날짜의 휴관일을 조회합니다
   */
  async findByDate(date: string): Promise<SchoolHoliday[]> {
    const db = await this.getDb();
    return await db.all<SchoolHoliday[]>(
      'SELECT * FROM school_holidays WHERE date = ? ORDER BY start_period',
      [date]
    );
  }

  /**
   * 날짜 범위로 휴관일을 조회합니다
   */
  async findByDateRange(startDate: string, endDate: string): Promise<SchoolHoliday[]> {
    const db = await this.getDb();
    return await db.all<SchoolHoliday[]>(
      'SELECT * FROM school_holidays WHERE date >= ? AND date <= ? ORDER BY date, start_period',
      [startDate, endDate]
    );
  }

  /**
   * 특정 날짜/교시가 휴관일인지 확인합니다
   */
  async isHoliday(date: string, period?: number): Promise<boolean> {
    const db = await this.getDb();
    
    if (period === undefined) {
      // 교시 지정 없으면 해당 날짜에 휴관일이 있는지만 확인
      const result = await db.get<{ count: number }>(
        'SELECT COUNT(*) as count FROM school_holidays WHERE date = ?',
        [date]
      );
      return (result?.count ?? 0) > 0;
    }

    // 교시가 지정된 경우
    const result = await db.get<{ count: number }>(
      `SELECT COUNT(*) as count FROM school_holidays 
       WHERE date = ? 
       AND (
         (start_period IS NULL AND end_period IS NULL) OR
         (start_period <= ? AND end_period >= ?)
       )`,
      [date, period, period]
    );
    return (result?.count ?? 0) > 0;
  }

  /**
   * 휴관일을 삭제합니다
   */
  async delete(id: number): Promise<boolean> {
    const db = await this.getDb();
    const result = await db.run('DELETE FROM school_holidays WHERE id = ?', [id]);
    return (result.changes ?? 0) > 0;
  }

  /**
   * 모든 휴관일을 삭제합니다 (테스트용)
   */
  async deleteAll(): Promise<void> {
    const db = await this.getDb();
    await db.run('DELETE FROM school_holidays');
  }
}
