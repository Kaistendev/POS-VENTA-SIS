import db from '../db.js';
import { AuditLog } from '../../common/types.js';

export class AuditRepository {
  private static tableName = 'audit_logs';

  static async findAll(): Promise<AuditLog[]> {
    return db(this.tableName).select('*').orderBy('created_at', 'desc');
  }

  static async findByEntity(entity: string, entity_id: number): Promise<AuditLog[]> {
    return db(this.tableName).where({ entity, entity_id }).orderBy('created_at', 'desc');
  }

  static async create(log: Omit<AuditLog, 'id' | 'created_at' | 'updated_at'>): Promise<number[]> {
    return db(this.tableName).insert(log).returning('id');
  }
}
