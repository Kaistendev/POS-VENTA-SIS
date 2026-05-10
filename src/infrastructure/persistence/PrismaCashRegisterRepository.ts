import { PrismaClient } from '@prisma/client';
import { ICashRegisterRepository } from '../../domain/ports/ICashRegisterRepository.js';
import { CashRegister, CashRegisterWithSales } from '../../domain/models.js';
import { buildDateFilter } from '../../shared/helpers.js';

export class PrismaCashRegisterRepository implements ICashRegisterRepository {
  constructor(private prisma: PrismaClient) {}

  async findOpen(): Promise<CashRegister | null> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    return this.prisma.cashRegister.findFirst({
      where: { opened_at: { gte: startOfDay } },
      orderBy: { opened_at: 'desc' },
    }) as unknown as CashRegister | null;
  }

  async findById(id: number): Promise<CashRegisterWithSales | null> {
    const register = await this.prisma.cashRegister.findUnique({
      where: { id },
      include: {
        sales: {
          include: {
            client: true,
            items: { include: { product: true } },
          },
        },
      },
    });
    return register as unknown as CashRegisterWithSales | null;
  }

  async findAll(startDate?: Date, endDate?: Date): Promise<(CashRegister & { _count?: { sales: number } })[]> {
    const where: any = {};
    Object.assign(where, buildDateFilter('opened_at', startDate, endDate));

    return this.prisma.cashRegister.findMany({
      where,
      include: { _count: { select: { sales: true } } },
      orderBy: { opened_at: 'desc' },
    }) as unknown as (CashRegister & { _count?: { sales: number } })[];
  }

  async create(openingAmount: number): Promise<CashRegister> {
    return this.prisma.cashRegister.create({
      data: { opening_amount: Number(openingAmount), total_sales: 0 },
    }) as unknown as CashRegister;
  }

  async updateTotalSales(id: number, delta: number): Promise<void> {
    await this.prisma.cashRegister.update({
      where: { id },
      data: { total_sales: { increment: delta } },
    });
  }

  async getSalesCount(id: number, since: Date): Promise<number> {
    return this.prisma.sale.count({
      where: { cash_register_id: id, created_at: { gte: since } },
    });
  }

  async getDailySummary(registerId: number): Promise<any> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const where = {
      cash_register_id: registerId,
      created_at: { gte: startOfDay, lte: endOfDay },
    };

    const register = await this.prisma.cashRegister.findFirst({
      where: { id: registerId, opened_at: { gte: startOfDay } },
    });

    if (!register) throw new Error('Caja no encontrada o no está abierta hoy.');

    const salesStats = await this.prisma.sale.aggregate({
      where,
      _count: { id: true },
      _sum: { total: true },
      _avg: { total: true },
    });

    const salesByPayment = await this.prisma.sale.groupBy({
      by: ['payment_method'],
      where,
      _count: { id: true },
      _sum: { total: true },
    });

    return {
      register,
      totalSales: salesStats._count.id,
      totalRevenue: salesStats._sum.total || 0,
      averageSale: salesStats._avg.total || 0,
      salesByPayment: salesByPayment as any,
    };
  }
}
