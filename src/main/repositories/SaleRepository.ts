import db from '../db.js';
import { Sale, SaleItem } from '../../common/types.js';

export class SaleRepository {
  private static salesTable = 'sales';
  private static itemsTable = 'sale_items';

  static async findAll(): Promise<Sale[]> {
    return db(this.salesTable).select('*').orderBy('created_at', 'desc');
  }

  static async findById(id: number): Promise<{ sale: Sale, items: SaleItem[] } | null> {
    const sale = await db(this.salesTable).where({ id }).first();
    if (!sale) return null;
    
    const items = await db(this.itemsTable).where({ sale_id: id });
    return { sale, items };
  }

  static async createSaleWithItems(
    sale: Omit<Sale, 'id' | 'created_at' | 'updated_at'> & { payment_method?: string }, 
    items: Omit<SaleItem, 'id' | 'sale_id' | 'created_at' | 'updated_at'>[]
  ): Promise<number> {
    
    return db.transaction(async (trx) => {
      // 1. Insertamos la Venta
      const [saleIdData] = await trx(this.salesTable).insert(sale).returning('id');
      const saleId = typeof saleIdData === 'object' ? saleIdData.id : saleIdData;

      // 2. Insertamos el Detalle de Venta
      const saleItemsToInsert = items.map(item => ({
        ...item,
        sale_id: saleId
      }));
      await trx(this.itemsTable).insert(saleItemsToInsert);

      // 3. Insertar Movimientos de Inventario
      const movements = items.map(item => ({
        product_id: item.product_id,
        type: 'SALIDA',
        quantity: item.quantity
      }));
      await trx('inventory_movements').insert(movements);

      // 4. Actualizar total en CashRegister según el método de pago
      const cashRegister = await trx('cash_registers').where({ id: sale.cash_register_id, status: 'OPEN' }).first();
      if (!cashRegister) throw new Error('No hay una caja abierta válida para esta venta.');

      const updateData: any = { 
        total_sales: Number(cashRegister.total_sales) + Number(sale.total),
        updated_at: trx.fn.now()
      };

      if (sale.payment_method === 'CARD') {
        updateData.card_sales = Number(cashRegister.card_sales || 0) + Number(sale.total);
      } else {
        updateData.cash_sales = Number(cashRegister.cash_sales || 0) + Number(sale.total);
      }

      await trx('cash_registers')
        .where({ id: sale.cash_register_id })
        .update(updateData);

      return saleId;
    });
  }
}
