import { Database } from 'sqlite';
import { Schedule } from '../types/models';
import { getDatabase } from '../database/connection';

export class ScheduleRepository {
  private db: Database | null = null;

  private async getDb(): Promise<Database> {
    if (!this.db) {
      this.db = await getDatabase();
    }
    return this.db;
  }

  /**
   * 새로운 일정을 생성합니다
   */
  async create(schedule: Omit<Schedule, 'id' | 'created_at'>): Promise<Schedule> {
    const db = await this.getDb();
    const result = await db.run(
      `INSERT INTO schedules (course_id, instructor_id, date, start_period, end_period, is_pre_assigned, is_exam)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        schedule.course_id,
        schedule.instructor_id,
        schedule.date,
        schedule.start_period,
        schedule.end_period,
        schedule.is_pre_assigned ? 1 : 0,
        schedule.is_exam ? 1 : 0
      ]
    );

    const created = await this.findById(result.lastID!);
    if (!created) {
      throw new Error('Failed to create schedule');
    }
    return created;
  }

  /**
   * 모든 일정을 조회합니다
   */
  async findAll(): Promise<Schedule[]> {
    const db = await this.getDb();
    return await db.all<Schedule[]>('SELECT * FROM schedules ORDER BY date, start_period');
  }

  /**
   * ID로 일정을 조회합니다
   */
  async findById(id: number): Promise<Schedule | null> {
    const db = await this.getDb();
    const schedule = await db.get<Schedule>(
      'SELECT * FROM schedules WHERE id = ?',
      [id]
    );
    return schedule || null;
  }

  /**
   * 날짜 범위로 일정을 조회합니다
   */
  async findByDateRange(startDate: string, endDate: string): Promise<Schedule[]> {
    const db = await this.getDb();
    return await db.all<Schedule[]>(
      `SELECT * FROM schedules 
       WHERE date >= ? AND date <= ?
       ORDER BY date, start_period`,
      [startDate, endDate]
    );
  }

  /**
   * 모든 일정을 Course 및 Instructor 정보와 함께 조회합니다
   */
  async findAllWithDetails(): Promise<Schedule[]> {
    const db = await this.getDb();
    const schedules = await db.all<any[]>(
      `SELECT 
         s.*,
         c.id as course_id_full,
         c.구분 as course_구분,
         c.과목 as course_과목,
         c.시수 as course_시수,
         c.담당교관 as course_담당교관,
         c.선배정 as course_선배정,
         c.평가 as course_평가,
         c.excel_order as course_excel_order,
         c.created_at as course_created_at,
         i.id as instructor_id_full,
         i.name as instructor_name,
         i.created_at as instructor_created_at
       FROM schedules s
       LEFT JOIN courses c ON s.course_id = c.id
       LEFT JOIN instructors i ON s.instructor_id = i.id
       ORDER BY s.date, s.start_period`
    );

    return schedules.map(row => ({
      id: row.id,
      course_id: row.course_id,
      instructor_id: row.instructor_id,
      date: row.date,
      start_period: row.start_period,
      end_period: row.end_period,
      is_pre_assigned: Boolean(row.is_pre_assigned),
      is_exam: Boolean(row.is_exam),
      created_at: row.created_at,
      course: row.course_id_full ? {
        id: row.course_id_full,
        구분: row.course_구분,
        과목: row.course_과목,
        시수: row.course_시수,
        담당교관: row.course_담당교관,
        선배정: row.course_선배정,
        평가: row.course_평가,
        excel_order: row.course_excel_order,
        created_at: row.course_created_at
      } : undefined,
      instructor: row.instructor_id_full ? {
        id: row.instructor_id_full,
        name: row.instructor_name,
        created_at: row.instructor_created_at
      } : undefined
    }));
  }

  /**
   * 교관별 일정을 조회합니다 (날짜 범위 선택적)
   */
  async findByInstructorWithDetails(
    instructorId: number,
    startDate?: string,
    endDate?: string
  ): Promise<Schedule[]> {
    const db = await this.getDb();
    
    let query = `
      SELECT 
        s.*,
        c.id as course_id_full,
        c.구분 as course_구분,
        c.과목 as course_과목,
        c.시수 as course_시수,
        c.담당교관 as course_담당교관,
        c.선배정 as course_선배정,
        c.평가 as course_평가,
        c.excel_order as course_excel_order,
        c.created_at as course_created_at,
        i.id as instructor_id_full,
        i.name as instructor_name,
        i.created_at as instructor_created_at
      FROM schedules s
      LEFT JOIN courses c ON s.course_id = c.id
      LEFT JOIN instructors i ON s.instructor_id = i.id
      WHERE s.instructor_id = ?
    `;
    
    const params: any[] = [instructorId];
    
    if (startDate && endDate) {
      query += ' AND s.date >= ? AND s.date <= ?';
      params.push(startDate, endDate);
    }
    
    query += ' ORDER BY s.date, s.start_period';
    
    const schedules = await db.all<any[]>(query, params);

    return schedules.map(row => ({
      id: row.id,
      course_id: row.course_id,
      instructor_id: row.instructor_id,
      date: row.date,
      start_period: row.start_period,
      end_period: row.end_period,
      is_pre_assigned: Boolean(row.is_pre_assigned),
      is_exam: Boolean(row.is_exam),
      created_at: row.created_at,
      course: row.course_id_full ? {
        id: row.course_id_full,
        구분: row.course_구분,
        과목: row.course_과목,
        시수: row.course_시수,
        담당교관: row.course_담당교관,
        선배정: row.course_선배정,
        평가: row.course_평가,
        excel_order: row.course_excel_order,
        created_at: row.course_created_at
      } : undefined,
      instructor: row.instructor_id_full ? {
        id: row.instructor_id_full,
        name: row.instructor_name,
        created_at: row.instructor_created_at
      } : undefined
    }));
  }

  /**
   * Course 및 Instructor 정보를 JOIN하여 조회합니다
   */
  async findByDateRangeWithDetails(startDate: string, endDate: string): Promise<Schedule[]> {
    const db = await this.getDb();
    const schedules = await db.all<any[]>(
      `SELECT 
         s.*,
         c.id as course_id_full,
         c.구분 as course_구분,
         c.과목 as course_과목,
         c.시수 as course_시수,
         c.담당교관 as course_담당교관,
         c.선배정 as course_선배정,
         c.평가 as course_평가,
         c.excel_order as course_excel_order,
         c.created_at as course_created_at,
         i.id as instructor_id_full,
         i.name as instructor_name,
         i.created_at as instructor_created_at
       FROM schedules s
       LEFT JOIN courses c ON s.course_id = c.id
       LEFT JOIN instructors i ON s.instructor_id = i.id
       WHERE s.date >= ? AND s.date <= ?
       ORDER BY s.date, s.start_period`,
      [startDate, endDate]
    );

    return schedules.map(row => ({
      id: row.id,
      course_id: row.course_id,
      instructor_id: row.instructor_id,
      date: row.date,
      start_period: row.start_period,
      end_period: row.end_period,
      is_pre_assigned: Boolean(row.is_pre_assigned),
      is_exam: Boolean(row.is_exam),
      created_at: row.created_at,
      course: row.course_id_full ? {
        id: row.course_id_full,
        구분: row.course_구분,
        과목: row.course_과목,
        시수: row.course_시수,
        담당교관: row.course_담당교관,
        선배정: row.course_선배정,
        평가: row.course_평가,
        excel_order: row.course_excel_order,
        created_at: row.course_created_at
      } : undefined,
      instructor: row.instructor_id_full ? {
        id: row.instructor_id_full,
        name: row.instructor_name,
        created_at: row.instructor_created_at
      } : undefined
    }));
  }

  /**
   * 특정 날짜/교시의 중복을 체크합니다
   */
  async checkConflict(date: string, startPeriod: number, endPeriod: number, excludeId?: number): Promise<boolean> {
    const db = await this.getDb();
    
    let query = `
      SELECT COUNT(*) as count FROM schedules
      WHERE date = ?
      AND (
        (start_period <= ? AND end_period >= ?)
        OR (start_period <= ? AND end_period >= ?)
        OR (start_period >= ? AND end_period <= ?)
      )
    `;
    const params: any[] = [date, startPeriod, startPeriod, endPeriod, endPeriod, startPeriod, endPeriod];

    if (excludeId !== undefined) {
      query += ' AND id != ?';
      params.push(excludeId);
    }

    const result = await db.get<{ count: number }>(query, params);
    return (result?.count ?? 0) > 0;
  }

  /**
   * 특정 날짜/과목의 배정된 시수를 조회합니다
   */
  async getAssignedHoursForCourseOnDate(courseId: number, date: string): Promise<number> {
    const db = await this.getDb();
    const result = await db.get<{ total: number }>(
      `SELECT SUM(end_period - start_period + 1) as total
       FROM schedules
       WHERE course_id = ? AND date = ?`,
      [courseId, date]
    );
    return result?.total ?? 0;
  }

  /**
   * 특정 과목의 전체 배정된 시수를 조회합니다 (모든 날짜 포함)
   */
  async getTotalAssignedHoursForCourse(courseId: number): Promise<number> {
    const db = await this.getDb();
    const result = await db.get<{ total: number }>(
      `SELECT SUM(end_period - start_period + 1) as total
       FROM schedules
       WHERE course_id = ?`,
      [courseId]
    );
    return result?.total ?? 0;
  }

  /**
   * 특정 날짜에 동일 교관의 동일 과목이 연속으로 몇 시간 배정되어 있는지 확인합니다
   * @param instructorId 교관 ID
   * @param courseId 과목 ID
   * @param date 날짜 (YYYY-MM-DD)
   * @param startPeriod 확인할 시작 교시
   * @returns 연속 배정된 시수 (해당 시작 교시 이전의 연속 시수)
   */
  async getConsecutiveHoursForInstructorCourse(
    instructorId: number,
    courseId: number,
    date: string,
    startPeriod: number
  ): Promise<number> {
    const db = await this.getDb();
    
    // 해당 날짜의 동일 교관, 동일 과목 일정을 조회
    const schedules = await db.all<Schedule[]>(
      `SELECT * FROM schedules
       WHERE instructor_id = ? AND course_id = ? AND date = ?
       ORDER BY start_period`,
      [instructorId, courseId, date]
    );

    if (schedules.length === 0) {
      return 0;
    }

    // startPeriod 바로 이전까지 연속된 시수를 계산
    let consecutiveHours = 0;
    let expectedPeriod = startPeriod - 1;

    // 역순으로 확인하여 연속된 교시 찾기
    for (let i = schedules.length - 1; i >= 0; i--) {
      const schedule = schedules[i];
      
      // 현재 스케줄이 expectedPeriod를 포함하는지 확인
      if (schedule.end_period === expectedPeriod) {
        // 이 스케줄의 시수를 더함
        const hours = schedule.end_period - schedule.start_period + 1;
        consecutiveHours += hours;
        expectedPeriod = schedule.start_period - 1;
      } else if (schedule.end_period < expectedPeriod) {
        // 연속되지 않음
        break;
      }
    }

    return consecutiveHours;
  }

  /**
   * 일정을 업데이트합니다
   */
  async update(id: number, schedule: Partial<Omit<Schedule, 'id' | 'created_at'>>): Promise<Schedule | null> {
    const db = await this.getDb();
    
    const fields: string[] = [];
    const values: any[] = [];

    if (schedule.course_id !== undefined) {
      fields.push('course_id = ?');
      values.push(schedule.course_id);
    }
    if (schedule.instructor_id !== undefined) {
      fields.push('instructor_id = ?');
      values.push(schedule.instructor_id);
    }
    if (schedule.date !== undefined) {
      fields.push('date = ?');
      values.push(schedule.date);
    }
    if (schedule.start_period !== undefined) {
      fields.push('start_period = ?');
      values.push(schedule.start_period);
    }
    if (schedule.end_period !== undefined) {
      fields.push('end_period = ?');
      values.push(schedule.end_period);
    }
    if (schedule.is_pre_assigned !== undefined) {
      fields.push('is_pre_assigned = ?');
      values.push(schedule.is_pre_assigned ? 1 : 0);
    }
    if (schedule.is_exam !== undefined) {
      fields.push('is_exam = ?');
      values.push(schedule.is_exam ? 1 : 0);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    await db.run(
      `UPDATE schedules SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return this.findById(id);
  }

  /**
   * 일정을 삭제합니다
   */
  async delete(id: number): Promise<boolean> {
    const db = await this.getDb();
    const result = await db.run('DELETE FROM schedules WHERE id = ?', [id]);
    return (result.changes ?? 0) > 0;
  }

  /**
   * 모든 일정을 삭제합니다 (테스트용)
   */
  async deleteAll(): Promise<void> {
    const db = await this.getDb();
    await db.run('DELETE FROM schedules');
  }
}
