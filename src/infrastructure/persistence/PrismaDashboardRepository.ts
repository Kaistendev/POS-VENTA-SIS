import { PrismaClient } from '@prisma/client';
import { IDashboardRepository } from '../../domain/ports/IDashboardRepository.js';
import { buildDateFilter } from '../../shared/helpers.js';
import {
  DashboardStats,
  WeeklySalesEntry,
  LowStockProduct,
  SalesByPaymentEntry,
  TopProductEntry,
  TopClientEntry,
  SalesByHourEntry,
  CashRegisterSummary,
  InventoryMetrics,
} from '../../domain/models.js';

export class PrismaDashboardRepository implements IDashboardRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getStats(startDate?: Date, endDate?: Date): Promise<DashboardStats> {
    const where: Record<string, unknown> = {};
    Object.assign(where, buildDateFilter('created_at', startDate, endDate));

    const filterWhere = Object.keys(where).length === 0
      ? { created_at: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } }
      : where;

    const revenueResult = await this.prisma.sale.aggregate({
      where: filterWhere as any,
      _sum: { total: true },
    });

    const salesCount = await this.prisma.sale.count({ where: filterWhere as any });

    const salesWithItems = await this.prisma.sale.findMany({
      where: filterWhere as any,
      select: {
        id: true,
        total: true,
        items: {
          select: { quantity: true, unit_price: true, purchase_price: true },
        },
      },
    });

    const totalProfit = salesWithItems.reduce((acc, sale) => {
      const saleProfit = sale.items.reduce((itemAcc, item) => {
        return itemAcc + item.quantity * (item.unit_price - item.purchase_price);
      }, 0);
      return acc + saleProfit;
    }, 0);

    const activeProducts = await this.prisma.product.count({
      where: { stock: { gt: 0 } },
    });

    const totalClients = await this.prisma.client.count();

    const lowStockCount = await this.prisma.product.count({
      where: { stock: { lt: this.prisma.product.fields.min_stock } },
    });

    return {
      todayRevenue: revenueResult._sum.total || 0,
      todayProfit: totalProfit,
      todaySalesCount: salesCount,
      totalRevenue: revenueResult._sum.total || 0,
      totalProfit,
      totalSales: salesCount,
      activeProducts,
      totalClients,
      lowStockProducts: lowStockCount,
      averageSale: salesCount > 0 ? (revenueResult._sum.total || 0) / salesCount : 0,
    };
  }

  async getWeeklySales(days: number = 7): Promise<WeeklySalesEntry[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const sales = await this.prisma.sale.findMany({
      where: { created_at: { gte: startDate } },
      select: { total: true, created_at: true },
      orderBy: { created_at: 'asc' },
    });

    const groupedByDate = sales.reduce<Record<string, WeeklySalesEntry>>((acc, sale) => {
      const date = sale.created_at.toISOString().split('T')[0];
      if (!acc[date]) acc[date] = { date, total: 0, count: 0 };
      acc[date].total += sale.total;
      acc[date].count += 1;
      return acc;
    }, {});

    return Object.values(groupedByDate);
  }

  async getLowStockProducts(limit: number = 10): Promise<LowStockProduct[]> {
    const result = await this.prisma.$queryRaw<Array<Record<string, unknown>>>`
      SELECT p.id, p.sku, p.name, p.stock, p.min_stock, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.stock <= COALESCE(p.min_stock, 5) OR p.stock = 0
      ORDER BY p.stock ASC
      LIMIT ${limit}
    `;

    return (result || []).map((r: any) => ({
      id: r.id,
      sku: r.sku,
      name: r.name,
      stock: r.stock,
      min_stock: r.min_stock,
      category: r.category_name ? { name: r.category_name } : null,
    }));
  }

  async getSalesByPaymentMethod(startDate?: Date, endDate?: Date): Promise<SalesByPaymentEntry[]> {
    const where: Record<string, unknown> = {};
    Object.assign(where, buildDateFilter('created_at', startDate, endDate));

    return this.prisma.sale.groupBy({
      by: ['payment_method'],
      where: where as any,
      _count: { id: true },
      _sum: { total: true },
      _avg: { total: true },
    }) as any;
  }

  async getTopProducts(limit: number = 10, startDate?: Date, endDate?: Date): Promise<TopProductEntry[]> {
    const where: Record<string, unknown> = {};
    Object.assign(where, buildDateFilter('created_at', startDate, endDate));

    const topProducts = await this.prisma.saleItem.groupBy({
      by: ['product_id'],
      where: where as any,
      _sum: { quantity: true },
      _avg: { unit_price: true },
      _count: { id: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: limit,
    });

    const productIds = topProducts.map((item) => item.product_id);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { category: true },
    });

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

  async getTopClients(limit: number = 10, startDate?: Date, endDate?: Date): Promise<TopClientEntry[]> {
    const where: Record<string, unknown> = {};
    Object.assign(where, buildDateFilter('created_at', startDate, endDate));

    const topClients = await this.prisma.sale.groupBy({
      by: ['client_id'],
      where: where as any,
      _count: { id: true },
      _sum: { total: true },
      _avg: { total: true },
      orderBy: { _sum: { total: 'desc' } },
      take: limit,
    });

    const clientIds = topClients
      .map((item) => item.client_id)
      .filter((id): id is number => id !== null);

    const clients = await this.prisma.client.findMany({
      where: { id: { in: clientIds } },
    });

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

  async getSalesByHour(startDate?: Date, endDate?: Date): Promise<SalesByHourEntry[]> {
    const where: Record<string, unknown> = {};
    Object.assign(where, buildDateFilter('created_at', startDate, endDate));

    const sales = await this.prisma.sale.findMany({
      where: where as any,
      select: { total: true, created_at: true },
    });

    const hours = Array.from({ length: 24 }, (_, i) => ({
      hour: i, total: 0, count: 0,
    }));

    sales.forEach((sale) => {
      const hour = sale.created_at.getHours();
      hours[hour].total += sale.total;
      hours[hour].count += 1;
    });

    return hours;
  }

  async getCashRegisterSummary(startDate?: Date, endDate?: Date): Promise<CashRegisterSummary> {
    const where: Record<string, unknown> = {};
    Object.assign(where, buildDateFilter('opened_at', startDate, endDate));

    const registers = await this.prisma.cashRegister.findMany({
      where: where as any,
      select: { id: true, opened_at: true, opening_amount: true, total_sales: true },
      orderBy: { opened_at: 'desc' },
    });

    const summary = registers.reduce(
      (acc, reg) => ({
        totalRegisters: acc.totalRegisters + 1,
        totalOpening: acc.totalOpening + Number(reg.opening_amount),
        totalSales: acc.totalSales + Number(reg.total_sales),
      }),
      { totalRegisters: 0, totalOpening: 0, totalSales: 0 },
    );

    return { registers, summary };
  }

  async getInventoryMetrics(): Promise<InventoryMetrics> {
    const totalProducts = await this.prisma.product.count();

    const productsWithStock = await this.prisma.product.count({
      where: { stock: { gt: 0 } },
    });

    const productsWithoutStock = await this.prisma.product.count({
      where: { stock: { equals: 0 } },
    });

    const lowStockProducts = await this.prisma.product.count({
      where: { stock: { lt: this.prisma.product.fields.min_stock } },
    });

    const inventoryValue = await this.prisma.product.aggregate({
      _sum: { price_purchase: true },
      where: { stock: { gt: 0 } },
    });

    const inventorySaleValue = await this.prisma.product.aggregate({
      _sum: { price_sale: true },
      where: { stock: { gt: 0 } },
    });

    const recentMovements = await this.prisma.inventoryMovement.findMany({
      take: 10,
      orderBy: { created_at: 'desc' },
      include: { product: { select: { name: true, sku: true } } },
    });

    return {
      totalProducts,
      productsWithStock,
      productsWithoutStock,
      lowStockProducts,
      totalPurchaseValue: inventoryValue._sum.price_purchase || 0,
      totalSaleValue: inventorySaleValue._sum.price_sale || 0,
      potentialProfit: (inventorySaleValue._sum.price_sale || 0) - (inventoryValue._sum.price_purchase || 0),
      recentMovements: recentMovements as any,
    };
  }
}
