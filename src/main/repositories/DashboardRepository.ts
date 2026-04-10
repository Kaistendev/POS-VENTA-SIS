import db from '../db.js';

export class DashboardRepository {
  static async getStats() {
    const today = new Date().toISOString().split('T')[0];

    // 1. Ingresos de hoy
    const todayRevenue = await db('sales')
      .whereRaw("date(created_at) = ?", [today])
      .sum('total as total')
      .first();

    // 2. Ventas totales (hoy)
    const todaySalesCount = await db('sales')
      .whereRaw("date(created_at) = ?", [today])
      .count('id as count')
      .first();

    // 3. Productos activos (con stock > 0)
    const activeProducts = await db('products')
      .where('stock', '>', 0)
      .count('id as count')
      .first();

    // 4. Clientes totales
    const totalClients = await db('clients')
      .count('id as count')
      .first();

    return {
      todayRevenue: todayRevenue?.total || 0,
      todaySalesCount: todaySalesCount?.count || 0,
      activeProducts: activeProducts?.count || 0,
      totalClients: totalClients?.count || 0
    };
  }

  static async getWeeklySales() {
    // Obtener ventas de los últimos 7 días agrupadas por fecha
    return db('sales')
      .select(db.raw("date(created_at) as date"), db.raw("sum(total) as total"))
      .whereRaw("created_at >= date('now', '-7 days')")
      .groupByRaw("date(created_at)")
      .orderBy("date", "asc");
  }

  static async getLowStockProducts() {
    return db('products')
      .select('sku', 'name', 'stock')
      .where('stock', '<', 10)
      .orderBy('stock', 'asc')
      .limit(5);
  }
}
