import type { PrismaClient } from '@prisma/client';
import { ISaleRepository } from '../../domain/ports/ISaleRepository.js';
import { Sale, SaleWithItems } from '../../domain/models.js';
import { RegisterSaleDTO, SaleFilterDTO, SalesStatsDTO } from '../../domain/dtos.js';
import { buildDateFilter } from '../../shared/helpers.js';
import { BusinessRuleError } from '../../shared/errors.js';

export class PrismaSaleRepository implements ISaleRepository {
  constructor(private prisma: PrismaClient) {}

  async findAll(filter?: SaleFilterDTO): Promise<Sale[]> {
    const where: any = {};
    Object.assign(where, buildDateFilter('created_at', filter?.startDate, filter?.endDate));
    if (filter?.clientId) where.client_id = filter.clientId;
    if (filter?.cashRegisterId) where.cash_register_id = filter.cashRegisterId;

    return this.prisma.sale.findMany({
      where,
      select: {
        id: true, total: true, subtotal: true, tax_amount: true, payment_method: true,
        created_at: true, updated_at: true, cash_register_id: true, client_id: true,
        client: { select: { id: true, name: true, dni: true } },
        cash_register: { select: { id: true, opened_at: true, opening_amount: true } },
        _count: { select: { items: true } },
      },
      orderBy: { created_at: 'desc' },
    }) as unknown as Sale[];
  }

  async findById(id: number): Promise<SaleWithItems | null> {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        client: true,
        cash_register: true,
      },
    });
    return sale as unknown as SaleWithItems | null;
  }

  async findToday(): Promise<Sale[]> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    return this.prisma.sale.findMany({
      where: { created_at: { gte: startOfDay, lte: endOfDay } },
      include: { client: true, cash_register: true },
      orderBy: { created_at: 'desc' },
    }) as unknown as Sale[];
  }

  async findLast(): Promise<SaleWithItems | null> {
    const sale = await this.prisma.sale.findFirst({
      orderBy: { created_at: 'desc' },
      include: { items: true },
    });
    return sale as unknown as SaleWithItems | null;
  }

  async getStats(startDate?: Date, endDate?: Date): Promise<SalesStatsDTO> {
    const where: any = {};
    Object.assign(where, buildDateFilter('created_at', startDate, endDate));

    const stats = await this.prisma.sale.aggregate({
      where,
      _count: { id: true },
      _sum: { total: true },
      _avg: { total: true },
    });

    return {
      totalSales: stats._count.id,
      totalRevenue: stats._sum.total || 0,
      averageSale: stats._avg.total || 0,
    };
  }

  async registerSale(input: RegisterSaleDTO): Promise<number> {
    return this.prisma.$transaction(async (tx) => {
      const sale = await tx.sale.create({
        data: {
          cash_register_id: input.cash_register_id,
          client_id: input.client_id,
          subtotal: input.subtotal,
          tax_amount: input.tax_amount,
          total: input.total,
          payment_method: input.payment_method,
          exchange_rate: input.exchange_rate || 0,
        },
      });

      for (const item of input.items) {
        await tx.saleItem.create({
          data: {
            sale_id: sale.id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            purchase_price: item.purchase_price,
          },
        });

        const result = await tx.product.updateMany({
          where: { id: item.product_id, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (result.count === 0) {
          throw new BusinessRuleError(`Stock insuficiente para el producto ${item.product_id}`);
        }

        await tx.inventoryMovement.create({
          data: {
            product_id: item.product_id,
            type: 'SALIDA',
            quantity: item.quantity,
            reason: 'VENTA',
          },
        });
      }

      await tx.cashRegister.update({
        where: { id: input.cash_register_id },
        data: { total_sales: { increment: input.total } },
      });

      return sale.id;
    });
  }

  async cancelSale(saleId: number): Promise<void> {
    const sale = await this.prisma.sale.findUnique({
      where: { id: saleId },
      include: { items: true },
    });

    if (!sale) throw new Error('Venta no encontrada');

    await this.prisma.$transaction(async (tx) => {
      for (const item of sale.items) {
        await tx.product.update({
          where: { id: item.product_id },
          data: { stock: { increment: item.quantity } },
        });

        await tx.inventoryMovement.create({
          data: {
            product_id: item.product_id,
            type: 'ENTRADA',
            quantity: item.quantity,
            reason: 'DEVOLUCION',
          },
        });
      }

      await tx.cashRegister.update({
        where: { id: sale.cash_register_id },
        data: { total_sales: { decrement: sale.total } },
      });

      await tx.sale.delete({ where: { id: saleId } });
    });
  }
}
