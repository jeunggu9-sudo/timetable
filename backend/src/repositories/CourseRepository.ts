import { Database } from 'sqlite';
import { Course } from '../types/models';
import { getDatabase } from '../database/connection';

export class CourseRepository {
  private db: Database | null = null;

  private async getDb(): Promise<Database> {
    if (!this.db) {
      this.db = await getDatabase();
    }
    return this.db;
  }

  /**
   * 새로운 교과목을 생성합니다
   */
  async create(course: Omit<Course, 'id' | 'created_at'>): Promise<Course> {
    const db = await this.getDb();
    const result = await db.run(
      `INSERT INTO courses (구분, 과목, 시수, 담당교관, 선배정, 평가, excel_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [course.구분, course.과목, course.시수, course.담당교관, course.선배정, course.평가, course.excel_order]
    );

    const created = await this.findById(result.lastID!);
    if (!created) {
      throw new Error('Failed to create course');
    }
    return created;
  }

  /**
   * 모든 교과목을 조회합니다
   */
  async findAll(): Promise<Course[]> {
    const db = await this.getDb();
    return await db.all<Course[]>('SELECT * FROM courses ORDER BY excel_order');
  }

  /**
   * ID로 교과목을 조회합니다
   */
  async findById(id: number): Promise<Course | null> {
    const db = await this.getDb();
    const course = await db.get<Course>('SELECT * FROM courses WHERE id = ?', [id]);
    return course || null;
  }

  /**
   * 선배정 값으로 교과목을 필터링합니다
   */
  async findByPreAssignment(preAssignment: 1 | 2): Promise<Course[]> {
    const db = await this.getDb();
    return await db.all<Course[]>(
      'SELECT * FROM courses WHERE 선배정 = ? ORDER BY excel_order',
      [preAssignment]
    );
  }

  /**
   * 교과목을 업데이트합니다
   */
  async update(id: number, course: Partial<Omit<Course, 'id' | 'created_at'>>): Promise<Course | null> {
    const db = await this.getDb();
    
    const fields: string[] = [];
    const values: any[] = [];

    if (course.구분 !== undefined) {
      fields.push('구분 = ?');
      values.push(course.구분);
    }
    if (course.과목 !== undefined) {
      fields.push('과목 = ?');
      values.push(course.과목);
    }
    if (course.시수 !== undefined) {
      fields.push('시수 = ?');
      values.push(course.시수);
    }
    if (course.담당교관 !== undefined) {
      fields.push('담당교관 = ?');
      values.push(course.담당교관);
    }
    if (course.선배정 !== undefined) {
      fields.push('선배정 = ?');
      values.push(course.선배정);
    }
    if (course.평가 !== undefined) {
      fields.push('평가 = ?');
      values.push(course.평가);
    }
    if (course.excel_order !== undefined) {
      fields.push('excel_order = ?');
      values.push(course.excel_order);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    await db.run(
      `UPDATE courses SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return this.findById(id);
  }

  /**
   * 교과목을 삭제합니다
   */
  async delete(id: number): Promise<boolean> {
    const db = await this.getDb();
    const result = await db.run('DELETE FROM courses WHERE id = ?', [id]);
    return (result.changes ?? 0) > 0;
  }

  /**
   * 모든 교과목을 삭제합니다 (테스트용)
   */
  async deleteAll(): Promise<void> {
    const db = await this.getDb();
    await db.run('DELETE FROM courses');
  }
}
