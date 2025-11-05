import { Database } from 'sqlite';
import { OffDay } from '../types/models';
import { getDatabase } from '../database/connection';

export class OffDayRepository {
  private db: Database | null = null;

  private async getDb(): Promise<Database> {
    if (!this.db) {
      this.db = await getDatabase();
    }
    return this.db;
  }

  /**
   * 새로운 휴무일을 생성합니다
   */
  async create(data: { instructor_id: number; date: string; reason?: string }): Promise<OffDay> {
    const db = await this.getDb();
    
    try {
      // reason 컬럼이 있는 경우 시도
      const result = await db.run(
        'INSERT INTO off_days (instructor_id, date, reason) VALUES (?, ?, ?)',
        [data.instructor_id, data.date, data.reason || '']
      );

      const created = await this.findById(result.lastID!);
      if (!created) {
        throw new Error('Failed to create off day');
      }
      return created;
    } catch (error: any) {
      // reason 컬럼이 없는 경우 reason 없이 삽입
      if (error.message && error.message.includes('no column named reason')) {
        console.log('reason 컬럼이 없어서 기본 형태로 삽입합니다.');
        const result = await db.run(
          'INSERT INTO off_days (instructor_id, date) VALUES (?, ?)',
          [data.instructor_id, data.date]
        );

        const created = await this.findById(result.lastID!);
        if (!created) {
          throw new Error('Failed to create off day');
        }
        return created;
      }
      throw error;
    }
  }

  /**
   * 모든 휴무일을 조회합니다
   */
  async findAll(): Promise<OffDay[]> {
    const db = await this.getDb();
    return await db.all<OffDay[]>('SELECT * FROM off_days ORDER BY date');
  }

  /**
   * ID로 휴무일을 조회합니다
   */
  async findById(id: number): Promise<OffDay | null> {
    const db = await this.getDb();
    const offDay = await db.get<OffDay>(
      'SELECT * FROM off_days WHERE id = ?',
      [id]
    );
    return offDay || null;
  }

  /**
   * 교관별 휴무일을 조회합니다
   */
  async findByInstructor(instructorId: number): Promise<OffDay[]> {
    const db = await this.getDb();
    return await db.all<OffDay[]>(
      'SELECT * FROM off_days WHERE instructor_id = ? ORDER BY date',
      [instructorId]
    );
  }

  /**
   * 특정 날짜에 휴무인 교관 목록을 조회합니다
   */
  async findInstructorsByDate(date: string): Promise<number[]> {
    const db = await this.getDb();
    const offDays = await db.all<OffDay[]>(
      'SELECT instructor_id FROM off_days WHERE date = ?',
      [date]
    );
    return offDays.map(od => od.instructor_id);
  }

  /**
   * 특정 교관이 특정 날짜에 휴무인지 확인합니다
   */
  async isInstructorOffDay(instructorId: number, date: string): Promise<boolean> {
    const db = await this.getDb();
    const result = await db.get<{ count: number }>(
      'SELECT COUNT(*) as count FROM off_days WHERE instructor_id = ? AND date = ?',
      [instructorId, date]
    );
    return (result?.count ?? 0) > 0;
  }

  /**
   * 특정 교관의 특정 날짜 휴무일을 조회합니다
   */
  async findByInstructorAndDate(instructorId: number, date: string): Promise<OffDay | null> {
    const db = await this.getDb();
    const offDay = await db.get<OffDay>(
      'SELECT * FROM off_days WHERE instructor_id = ? AND date = ?',
      [instructorId, date]
    );
    return offDay || null;
  }

  /**
   * Instructor 정보를 JOIN하여 조회합니다
   */
  async findByInstructorWithDetails(instructorId: number): Promise<OffDay[]> {
    const db = await this.getDb();
    const offDays = await db.all<any[]>(
      `SELECT 
         od.*,
         i.id as instructor_id_full,
         i.name as instructor_name,
         i.created_at as instructor_created_at
       FROM off_days od
       LEFT JOIN instructors i ON od.instructor_id = i.id
       WHERE od.instructor_id = ?
       ORDER BY od.date`,
      [instructorId]
    );

    return offDays.map(row => ({
      id: row.id,
      instructor_id: row.instructor_id,
      date: row.date,
      created_at: row.created_at,
      instructor: row.instructor_id_full ? {
        id: row.instructor_id_full,
        name: row.instructor_name,
        created_at: row.instructor_created_at
      } : undefined
    }));
  }

  /**
   * 휴무일을 삭제합니다
   */
  async delete(id: number): Promise<boolean> {
    const db = await this.getDb();
    const result = await db.run('DELETE FROM off_days WHERE id = ?', [id]);
    return (result.changes ?? 0) > 0;
  }

  /**
   * 특정 교관의 특정 날짜 휴무일을 삭제합니다
   */
  async deleteByInstructorAndDate(instructorId: number, date: string): Promise<boolean> {
    const db = await this.getDb();
    const result = await db.run(
      'DELETE FROM off_days WHERE instructor_id = ? AND date = ?',
      [instructorId, date]
    );
    return (result.changes ?? 0) > 0;
  }

  /**
   * 모든 휴무일을 삭제합니다 (테스트용)
   */
  async deleteAll(): Promise<void> {
    const db = await this.getDb();
    await db.run('DELETE FROM off_days');
  }
}
