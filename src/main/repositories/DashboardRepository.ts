import { prisma } from '../prisma/client.js';

export class DashboardRepository {
  static async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Ingresos de hoy
    const todayRevenue = await prisma.sale.aggregate({
      where: {
        created_at: {
          gte: today,
        },
      },
      _sum: {
        total: true,
      },
    });

    // 1b. Ganancia de hoy (Profit)
    const todaySales = await prisma.sale.findMany({
      where: {
        created_at: {
          gte: today,
        },
      },
      include: {
        items: true,
      },
    });

    const todayProfit = todaySales.reduce((acc, sale) => {
      const saleProfit = sale.items.reduce((itemAcc, item) => {
        return itemAcc + item.quantity * (item.unit_price - item.purchase_price);
      }, 0);
      return acc + saleProfit;
    }, 0);

    // 2. Ventas totales (hoy)
    const todaySalesCount = await prisma.sale.count({
      where: {
        created_at: {
          gte: today,
        },
      },
    });

    // 3. Productos activos (con stock > 0)
    const activeProducts = await prisma.product.count({
      where: {
        stock: {
          gt: 0,
        },
      },
    });

    // 4. Clientes totales
    const totalClients = await prisma.client.count();

    return {
      todayRevenue: todayRevenue._sum.total || 0,
      todayProfit,
      todaySalesCount,
      activeProducts,
      totalClients,
    };
  }

  static async getWeeklySales() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Obtener ventas de los últimos 7 días
    const sales = await prisma.sale.findMany({
      where: {
        created_at: {
          gte: sevenDaysAgo,
        },
      },
      select: {
        total: true,
        created_at: true,
      },
      orderBy: {
        created_at: 'asc',
      },
    });

    // Agrupar por fecha
    const groupedByDate = sales.reduce((acc: any, sale) => {
      const date = sale.created_at.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { date, total: 0 };
      }
      acc[date].total += sale.total;
      return acc;
    }, {});

    return Object.values(groupedByDate);
  }

  static async getLowStockProducts() {
    return prisma.product.findMany({
      where: {
        stock: {
          lt: prisma.product.fields.min_stock,
        },
      },
      select: {
        sku: true,
        name: true,
        stock: true,
        min_stock: true,
      },
      orderBy: {
        stock: 'asc',
      },
      take: 5,
    });
  }
}
