import db from '../db.js';
import { User } from '../../common/types.js';

export class UserRepository {
  private static tableName = 'users';

  static async findAll(): Promise<User[]> {
    return db(this.tableName).select('*');
  }

  static async findById(id: number): Promise<User | undefined> {
    return db(this.tableName).where({ id }).first();
  }

  static async findByUsername(username: string): Promise<User | undefined> {
    return db(this.tableName).where({ username }).first();
  }

  static async create(user: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<number[]> {
    return db(this.tableName).insert(user).returning('id');
  }

  static async update(id: number, user: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>): Promise<number> {
    return db(this.tableName)
      .where({ id })
      .update({ ...user, updated_at: db.fn.now() });
  }

  static async delete(id: number): Promise<number> {
    return db(this.tableName).where({ id }).delete();
  }
}
