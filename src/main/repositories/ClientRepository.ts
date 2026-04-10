import db from '../db.js';
import { Client } from '../../common/types.js';

export class ClientRepository {
  private static tableName = 'clients';

  static async findAll(): Promise<Client[]> {
    return db(this.tableName).select('*');
  }

  static async findById(id: number): Promise<Client | undefined> {
    return db(this.tableName).where({ id }).first();
  }

  static async findByDni(dni: string): Promise<Client | undefined> {
    return db(this.tableName).where({ dni }).first();
  }

  static async create(client: Omit<Client, 'id' | 'created_at' | 'updated_at'>): Promise<number[]> {
    return db(this.tableName).insert(client).returning('id');
  }

  static async update(id: number, client: Partial<Omit<Client, 'id' | 'created_at' | 'updated_at'>>): Promise<number> {
    return db(this.tableName)
      .where({ id })
      .update({ ...client, updated_at: db.fn.now() });
  }

  static async delete(id: number): Promise<number> {
    return db(this.tableName).where({ id }).delete();
  }
}
