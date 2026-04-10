import db from '../db.js';
import { CashRegister } from '../../common/types.js';

export class CashRegisterRepository {
  private static tableName = 'cash_registers';

  static async findAll(): Promise<CashRegister[]> {
    return db(this.tableName).select('*').orderBy('opened_at', 'desc');
  }

  static async findById(id: number): Promise<CashRegister | undefined> {
    return db(this.tableName).where({ id }).first();
  }

  static async create(cashRegister: Omit<CashRegister, 'id' | 'created_at' | 'updated_at' | 'opened_at' | 'total_sales'>): Promise<number[]> {
    return db(this.tableName).insert(cashRegister).returning('id');
  }

  static async update(id: number, updates: Partial<Omit<CashRegister, 'id' | 'created_at' | 'updated_at'>>): Promise<number> {
    return db(this.tableName)
      .where({ id })
      .update({ ...updates, updated_at: db.fn.now() });
  }

  static async delete(id: number): Promise<number> {
    return db(this.tableName).where({ id }).delete();
  }
}
