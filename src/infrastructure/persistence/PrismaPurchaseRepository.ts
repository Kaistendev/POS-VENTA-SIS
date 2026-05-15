import type { PrismaClient } from '@prisma/client';
import { IPurchaseRepository } from '../../domain/ports/IPurchaseRepository.js';
import { Purchase } from '../../domain/models.js';
import { CreatePurchaseDTO } from '../../domain/dtos.js';

export class PrismaPurchaseRepository implements IPurchaseRepository {
  constructor(private prisma: PrismaClient) {}

  async findAll(supplierId?: number, status?: string): Promise<Purchase[]> {
    const where: any = {};
    if (supplierId) where.supplier_id = supplierId;
    if (status) where.status = status;

    return this.prisma.purchase.findMany({
      where,
      include: {
        supplier: { select: { id: true, name: true, ruc: true } },
        items: {
          include: { product: { select: { id: true, name: true, sku: true } } },
        },
      },
      orderBy: { created_at: 'desc' },
    }) as unknown as Purchase[];
  }

  async findById(id: number): Promise<Purchase | null> {
    const purchase = await this.prisma.purchase.findUnique({
      where: { id },
      include: {
        supplier: true,
        items: { include: { product: true } },
      },
    });
    return purchase as unknown as Purchase | null;
  }

  async create(data: CreatePurchaseDTO): Promise<Purchase> {
    const totalAmount = data.items.reduce(
      (sum, item) => sum + item.quantity * item.unit_cost, 0,
    );

    return this.prisma.purchase.create({
      data: {
        supplier_id: data.supplier_id,
        total_amount: totalAmount,
        status: 'PENDING',
        payment_status: data.payment_status || 'UNPAID',
        items: {
          create: data.items.map((item) => ({
            product_id: item.product_id,
            quantity: item.quantity,
            unit_cost: item.unit_cost,
          })),
        },
      },
      include: {
        supplier: true,
        items: { include: { product: true } },
      },
    }) as unknown as Purchase;
  }

  async receive(purchaseId: number): Promise<void> {
    const purchase = await this.prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: { items: { include: { product: true } } },
    });

    if (!purchase) throw new Error('Compra no encontrada');
    if (purchase.status === 'RECEIVED') throw new Error('Esta compra ya fue recibida');
    if (purchase.status === 'CANCELLED') throw new Error('No se puede recibir una compra cancelada');

    await this.prisma.$transaction(async (tx) => {
      for (const item of purchase.items) {
        await tx.product.update({
          where: { id: item.product_id },
          data: {
            stock: { increment: item.quantity },
            price_purchase: item.unit_cost,
          },
        });

        await tx.inventoryMovement.create({
          data: {
            product_id: item.product_id,
            type: 'ENTRADA',
            quantity: item.quantity,
            reason: 'COMPRA',
          },
        });
      }

      await tx.purchase.update({
        where: { id: purchaseId },
        data: { status: 'RECEIVED' },
      });
    });
  }

  async cancel(purchaseId: number): Promise<void> {
    const purchase = await this.prisma.purchase.findUnique({ where: { id: purchaseId } });
    if (!purchase) throw new Error('Compra no encontrada');
    if (purchase.status === 'RECEIVED') throw new Error('No se puede cancelar una compra ya recibida');
    if (purchase.status === 'CANCELLED') throw new Error('Esta compra ya está cancelada');

    await this.prisma.purchase.update({
      where: { id: purchaseId },
      data: { status: 'CANCELLED' },
    });
  }

  async updatePaymentStatus(purchaseId: number, paymentStatus: string): Promise<void> {
    await this.prisma.purchase.update({
      where: { id: purchaseId },
      data: { payment_status: paymentStatus },
    });
  }
}
