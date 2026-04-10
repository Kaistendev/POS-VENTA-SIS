import db from '../db.js';
import { Product } from '../../common/types.js';

export class ProductRepository {
  private static tableName = 'products';

  static async findAll(): Promise<Product[]> {
    return db(this.tableName).select('*');
  }

  static async findById(id: number): Promise<Product | undefined> {
    return db(this.tableName).where({ id }).first();
  }

  static async findBySku(sku: string): Promise<Product | undefined> {
    return db(this.tableName).where({ sku }).first();
  }

  static async create(product: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'stock'>): Promise<number[]> {
    return db(this.tableName).insert(product).returning('id');
  }

  static async update(id: number, product: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>): Promise<number> {
    return db(this.tableName)
      .where({ id })
      .update({ ...product, updated_at: db.fn.now() });
  }

  static async delete(id: number): Promise<number> {
    return db(this.tableName).where({ id }).delete();
  }
}
