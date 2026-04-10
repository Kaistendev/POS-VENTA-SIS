import db from '../db.js';
import { InventoryMovement } from '../../common/types.js';

export class InventoryRepository {
  private static tableName = 'inventory_movements';

  static async findHistoryByProduct(product_id: number): Promise<InventoryMovement[]> {
    return db(this.tableName)
      .where({ product_id })
      .orderBy('created_at', 'desc');
  }

  static async createMovement(movement: Omit<InventoryMovement, 'id' | 'created_at' | 'updated_at'>): Promise<number[]> {
    // Esto detonará el trigger 'trg_inventory_entrada' o 'trg_inventory_salida' en la BD
    // actualizando automáticamente la cantidad en 'products'
    return db(this.tableName).insert(movement).returning('id');
  }
}
