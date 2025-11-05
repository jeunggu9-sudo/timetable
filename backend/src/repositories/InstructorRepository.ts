import { Database } from 'sqlite';
import { Instructor } from '../types/models';
import { getDatabase } from '../database/connection';

export class InstructorRepository {
  private db: Database | null = null;

  private async getDb(): Promise<Database> {
    if (!this.db) {
      this.db = await getDatabase();
    }
    return this.db;
  }

  /**
   * 새로운 교관을 생성합니다
   */
  async create(name: string): Promise<Instructor> {
    const db = await this.getDb();
    const result = await db.run(
      'INSERT INTO instructors (name) VALUES (?)',
      [name]
    );

    const created = await this.findById(result.lastID!);
    if (!created) {
      throw new Error('Failed to create instructor');
    }
    return created;
  }

  /**
   * 모든 교관을 조회합니다
   */
  async findAll(): Promise<Instructor[]> {
    const db = await this.getDb();
    return await db.all<Instructor[]>('SELECT * FROM instructors ORDER BY name');
  }

  /**
   * ID로 교관을 조회합니다
   */
  async findById(id: number): Promise<Instructor | null> {
    const db = await this.getDb();
    const instructor = await db.get<Instructor>(
      'SELECT * FROM instructors WHERE id = ?',
      [id]
    );
    return instructor || null;
  }

  /**
   * 이름으로 교관을 조회합니다
   */
  async findByName(name: string): Promise<Instructor | null> {
    const db = await this.getDb();
    const instructor = await db.get<Instructor>(
      'SELECT * FROM instructors WHERE name = ?',
      [name]
    );
    return instructor || null;
  }

  /**
   * 이름으로 교관을 찾거나 없으면 생성합니다
   */
  async findOrCreate(name: string): Promise<Instructor> {
    const existing = await this.findByName(name);
    if (existing) {
      return existing;
    }
    return await this.create(name);
  }

  /**
   * 교관을 업데이트합니다
   */
  async update(id: number, name: string): Promise<Instructor | null> {
    const db = await this.getDb();
    await db.run(
      'UPDATE instructors SET name = ? WHERE id = ?',
      [name, id]
    );
    return this.findById(id);
  }

  /**
   * 교관을 삭제합니다
   */
  async delete(id: number): Promise<boolean> {
    const db = await this.getDb();
    const result = await db.run('DELETE FROM instructors WHERE id = ?', [id]);
    return (result.changes ?? 0) > 0;
  }

  /**
   * 모든 교관을 삭제합니다 (테스트용)
   */
  async deleteAll(): Promise<void> {
    const db = await this.getDb();
    await db.run('DELETE FROM instructors');
  }
}
