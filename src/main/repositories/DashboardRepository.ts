import { prisma } from '../prisma/client.js';

export class DashboardRepository {
  // Cache simple stats for 30 seconds
  private static statsCache: { data: any; timestamp: number } | null = null;
  private static CACHE_DURATION = 30000; // 30 seconds

  /**
   * Obtiene estadísticas generales del dashboard
   */
  static async getStats(startDate?: Date, endDate?: Date) {
    // Check cache if no date filters provided
    if (!startDate && !endDate && this.statsCache) {
      const now = Date.now();
      if (now - this.statsCache.timestamp < this.CACHE_DURATION) {
        return this.statsCache.data;
      }
    }

    const where: any = {};

    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) {
        where.created_at.gte = startDate;
      }
      if (endDate) {
        where.created_at.lte = endDate;
      }
    }

    // If no date range specified, use today as default
    const filterWhere = Object.keys(where).length === 0
      ? {
          created_at: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        }
      : where;

    // 1. Revenue (total sales)
    const revenueResult = await prisma.sale.aggregate({
      where: filterWhere,
      _sum: {
        total: true,
      },
    });

    // 2. Total sales count
    const salesCount = await prisma.sale.count({
      where: filterWhere,
    });

    // 3. Calculate profit (requires fetching items)
    const salesWithItems = await prisma.sale.findMany({
      where: filterWhere,
      select: {
        id: true,
        total: true,
        items: {
          select: {
            quantity: true,
            unit_price: true,
            purchase_price: true,
          },
        },
      },
    });

    const totalProfit = salesWithItems.reduce((acc, sale) => {
      const saleProfit = sale.items.reduce((itemAcc, item) => {
        return itemAcc + item.quantity * (item.unit_price - item.purchase_price);
      }, 0);
      return acc + saleProfit;
    }, 0);

    // 4. Active products (stock > 0)
    const activeProducts = await prisma.product.count({
      where: {
        stock: {
          gt: 0,
        },
      },
    });

    // 5. Total clients
    const totalClients = await prisma.client.count();

    // 6. Low stock products count
    const lowStockCount = await prisma.product.count({
      where: {
        stock: {
          lt: prisma.product.fields.min_stock,
        },
      },
    });

    const result = {
      totalRevenue: revenueResult._sum.total || 0,
      totalProfit,
      totalSales: salesCount,
      activeProducts,
      totalClients,
      lowStockProducts: lowStockCount,
      averageSale: salesCount > 0 ? (revenueResult._sum.total || 0) / salesCount : 0,
    };

    // Cache result if no date filters
    if (!startDate && !endDate) {
      this.statsCache = {
        data: result,
        timestamp: Date.now(),
      };
    }

    return result;
  }

  /**
   * Invalida el cache de estadísticas
   */
  static invalidateCache() {
    this.statsCache = null;
  }

  /**
   * Obtiene ventas de los últimos N días agrupadas por fecha
   */
  static async getWeeklySales(days: number = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Obtener ventas de los últimos N días
    const sales = await prisma.sale.findMany({
      where: {
        created_at: {
          gte: startDate,
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
        acc[date] = { date, total: 0, count: 0 };
      }
      acc[date].total += sale.total;
      acc[date].count += 1;
      return acc;
    }, {});

    return Object.values(groupedByDate);
  }

  /**
   * Obtiene productos con stock bajo
   */
  static async getLowStockProducts(limit: number = 10) {
    return prisma.product.findMany({
      where: {
        stock: {
          lt: prisma.product.fields.min_stock,
        },
      },
      include: {
        category: {
          select: {
            name: true,
          },
        },
      },
      select: {
        id: true,
        sku: true,
        name: true,
        stock: true,
        min_stock: true,
        category: true,
      },
      orderBy: {
        stock: 'asc',
      },
      take: limit,
    });
  }

  /**
   * Obtiene ventas por método de pago
   */
  static async getSalesByPaymentMethod(startDate?: Date, endDate?: Date) {
    const where: any = {};

    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) {
        where.created_at.gte = startDate;
      }
      if (endDate) {
        where.created_at.lte = endDate;
      }
    }

    return prisma.sale.groupBy({
      by: ['payment_method'],
      where,
      _count: {
        id: true,
      },
      _sum: {
        total: true,
      },
      _avg: {
        total: true,
      },
    });
  }

  /**
   * Obtiene top productos más vendidos
   */
  static async getTopProducts(limit: number = 10, startDate?: Date, endDate?: Date) {
    const where: any = {};

    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) {
        where.created_at.gte = startDate;
      }
      if (endDate) {
        where.created_at.lte = endDate;
      }
    }

    const topProducts = await prisma.saleItem.groupBy({
      by: ['product_id'],
      where,
      _sum: {
        quantity: true,
      },
      _avg: {
        unit_price: true,
      },
      _count: {
        id: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: limit,
    });

    // Obtener detalles de los productos
    const productIds = topProducts.map((item) => item.product_id);
    const products = await prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
      include: {
        category: true,
      },
    });

    // Combinar datos
    return topProducts.map((item) => {
      const product = products.find((p) => p.id === item.product_id);
      return {
        product_id: item.product_id,
        product_name: product?.name || 'Unknown',
        product_sku: product?.sku || 'Unknown',
        category: product?.category?.name || 'Sin categoría',
        total_quantity: item._sum.quantity || 0,
        avg_price: item._avg.unit_price || 0,
        times_sold: item._count.id,
      };
    });
  }

  /**
   * Obtiene top clientes por ventas
   */
  static async getTopClients(limit: number = 10, startDate?: Date, endDate?: Date) {
    const where: any = {};

    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) {
        where.created_at.gte = startDate;
      }
      if (endDate) {
        where.created_at.lte = endDate;
      }
    }

    const topClients = await prisma.sale.groupBy({
      by: ['client_id'],
      where,
      _count: {
        id: true,
      },
      _sum: {
        total: true,
      },
      _avg: {
        total: true,
      },
      orderBy: {
        _sum: {
          total: 'desc',
        },
      },
      take: limit,
    });

    // Obtener detalles de los clientes
    const clientIds = topClients
      .map((item) => item.client_id)
      .filter((id) => id !== null);

    const clients = await prisma.client.findMany({
      where: {
        id: {
          in: clientIds,
        },
      },
    });

    // Combinar datos
    return topClients.map((item) => {
      const client = clients.find((c) => c.id === item.client_id);
      return {
        client_id: item.client_id,
        client_name: client?.name || 'Cliente Desconocido',
        client_dni: client?.dni || 'N/A',
        total_purchases: item._count.id,
        total_spent: item._sum.total || 0,
        avg_purchase: item._avg.total || 0,
      };
    });
  }

  /**
   * Obtiene ventas por hora del día (para análisis de picos de venta)
   */
  static async getSalesByHour(startDate?: Date, endDate?: Date) {
    const where: any = {};

    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) {
        where.created_at.gte = startDate;
      }
      if (endDate) {
        where.created_at.lte = endDate;
      }
    }

    const sales = await prisma.sale.findMany({
      where,
      select: {
        total: true,
        created_at: true,
      },
    });

    // Agrupar por hora
    const hours = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      total: 0,
      count: 0,
    }));

    sales.forEach((sale) => {
      const hour = sale.created_at.getHours();
      hours[hour].total += sale.total;
      hours[hour].count += 1;
    });

    return hours;
  }

  /**
   * Obtiene resumen de caja (cash registers)
   */
  static async getCashRegisterSummary(startDate?: Date, endDate?: Date) {
    const where: any = {};

    if (startDate || endDate) {
      where.opened_at = {};
      if (startDate) {
        where.opened_at.gte = startDate;
      }
      if (endDate) {
        where.opened_at.lte = endDate;
      }
    }

    const registers = await prisma.cashRegister.findMany({
      where,
      select: {
        id: true,
        opened_at: true,
        opening_amount: true,
        total_sales: true,
      },
      orderBy: {
        opened_at: 'desc',
      },
    });

    const summary = registers.reduce(
      (acc, reg) => {
        acc.totalRegisters += 1;
        acc.totalOpening += reg.opening_amount;
        acc.totalSales += reg.total_sales;
        return acc;
      },
      { totalRegisters: 0, totalOpening: 0, totalSales: 0 },
    );

    return {
      registers,
      summary,
    };
  }

  /**
   * Obtiene métricas de inventario
   */
  static async getInventoryMetrics() {
    // Total products
    const totalProducts = await prisma.product.count();

    // Products with stock
    const productsWithStock = await prisma.product.count({
      where: {
        stock: {
          gt: 0,
        },
      },
    });

    // Products without stock
    const productsWithoutStock = await prisma.product.count({
      where: {
        stock: {
          equals: 0,
        },
      },
    });

    // Low stock products
    const lowStockProducts = await prisma.product.count({
      where: {
        stock: {
          lt: prisma.product.fields.min_stock,
        },
      },
    });

    // Total inventory value (at purchase price)
    const inventoryValue = await prisma.product.aggregate({
      _sum: {
        price_purchase: true,
      },
      where: {
        stock: {
          gt: 0,
        },
      },
    });

    // Total inventory value (at sale price)
    const inventorySaleValue = await prisma.product.aggregate({
      _sum: {
        price_sale: true,
      },
      where: {
        stock: {
          gt: 0,
        },
      },
    });

    // Recent inventory movements
    const recentMovements = await prisma.inventoryMovement.findMany({
      take: 10,
      orderBy: {
        created_at: 'desc',
      },
      include: {
        product: {
          select: {
            name: true,
            sku: true,
          },
        },
      },
    });

    return {
      totalProducts,
      productsWithStock,
      productsWithoutStock,
      lowStockProducts,
      totalPurchaseValue: inventoryValue._sum.price_purchase || 0,
      totalSaleValue: inventorySaleValue._sum.price_sale || 0,
      potentialProfit: (inventorySaleValue._sum.price_sale || 0) - (inventoryValue._sum.price_purchase || 0),
      recentMovements,
    };
  }
}
