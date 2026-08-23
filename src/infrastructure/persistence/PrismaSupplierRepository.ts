import type { PrismaClient } from '@prisma/client';
import { ISupplierRepository, RegisterPaymentData } from '../../domain/ports/ISupplierRepository.js';
import { Supplier, SupplierWithRelations, SupplierPayment, SupplierAccountPayable, Purchase } from '../../domain/models.js';
import { CreateSupplierDTO, UpdateSupplierDTO } from '../../domain/dtos.js';

export class PrismaSupplierRepository implements ISupplierRepository {
  constructor(private prisma: PrismaClient) {}

  async findAll(search?: string): Promise<(Supplier & { _count?: { products: number; purchases: number } })[]> {
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { ruc: { contains: search } },
        { email: { contains: search } },
      ];
    }

    return this.prisma.supplier.findMany({
      where,
      include: { _count: { select: { products: true, purchases: true } } },
      orderBy: { name: 'asc' },
    }) as unknown as (Supplier & { _count?: { products: number; purchases: number } })[];
  }

  async findById(id: number): Promise<SupplierWithRelations | null> {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
      include: {
        products: { select: { id: true, name: true, sku: true, stock: true } },
        purchases: { orderBy: { created_at: 'desc' }, take: 10 },
      },
    });
    return supplier as unknown as SupplierWithRelations | null;
  }

  async findByRuc(ruc: string): Promise<Supplier | null> {
    return this.prisma.supplier.findFirst({ where: { ruc } }) as unknown as Supplier | null;
  }

  async create(data: CreateSupplierDTO): Promise<Supplier> {
    return this.prisma.supplier.create({ data }) as unknown as Supplier;
  }

  async update(id: number, data: UpdateSupplierDTO): Promise<Supplier> {
    return this.prisma.supplier.update({ where: { id }, data }) as unknown as Supplier;
  }

  async delete(id: number): Promise<void> {
    await this.prisma.supplier.delete({ where: { id } });
  }

  async hasProducts(id: number): Promise<boolean> {
    const count = await this.prisma.product.count({ where: { supplier_id: id } });
    return count > 0;
  }

  async hasPurchases(id: number): Promise<boolean> {
    const count = await this.prisma.purchase.count({ where: { supplier_id: id } });
    return count > 0;
  }

  async getOutstandingPurchases(supplierId: number): Promise<Purchase[]> {
    return this.prisma.purchase.findMany({
      where: {
        supplier_id: supplierId,
        status: 'RECEIVED',
        payment_status: { not: 'PAID' },
      },
      orderBy: { created_at: 'asc' },
    }) as unknown as Purchase[];
  }

  async getAccountsPayable(): Promise<SupplierAccountPayable[]> {
    const purchases = await this.prisma.purchase.groupBy({
      by: ['supplier_id'],
      where: { status: 'RECEIVED', payment_status: { not: 'PAID' } },
      _sum: { total_amount: true, paid_amount: true },
      _count: { id: true },
    });

    if (purchases.length === 0) return [];

    const suppliers = await this.prisma.supplier.findMany({
      where: { id: { in: purchases.map((p) => p.supplier_id) } },
      select: { id: true, name: true, ruc: true },
    });
    const supplierMap = new Map(suppliers.map((s) => [s.id, s]));

    return purchases
      .map((p) => {
        const supplier = supplierMap.get(p.supplier_id);
        const totalOwed = (p._sum.total_amount || 0) - (p._sum.paid_amount || 0);
        return {
          supplier_id: p.supplier_id,
          name: supplier?.name ?? `Proveedor #${p.supplier_id}`,
          ruc: supplier?.ruc ?? null,
          total_owed: Math.round(totalOwed * 100) / 100,
          unpaid_purchases: p._count.id,
        };
      })
      .filter((a) => a.total_owed > 0)
      .sort((a, b) => b.total_owed - a.total_owed);
  }

  async registerPayment(data: RegisterPaymentData): Promise<SupplierPayment> {
    return this.prisma.supplierPayment.create({
      data: {
        supplier_id: data.supplier_id,
        purchase_id: data.purchase_id ?? null,
        amount: data.amount,
        note: data.note ?? null,
        created_by: data.created_by ?? null,
      },
    }) as unknown as SupplierPayment;
  }

  async applyPaymentToPurchase(purchaseId: number, amount: number): Promise<boolean> {
    const purchase = await this.prisma.purchase.findUnique({
      where: { id: purchaseId },
      select: { total_amount: true, paid_amount: true },
    });
    if (!purchase) return false;

    const newPaid = Math.min((purchase.paid_amount || 0) + amount, purchase.total_amount);
    const fullyPaid = newPaid >= purchase.total_amount;

    await this.prisma.purchase.update({
      where: { id: purchaseId },
      data: {
        paid_amount: newPaid,
        payment_status: fullyPaid ? 'PAID' : 'UNPAID',
      },
    });

    return fullyPaid;
  }

  async getTotalPaid(): Promise<number> {
    const result = await this.prisma.supplierPayment.aggregate({
      _sum: { amount: true },
    });
    return result._sum.amount || 0;
  }

  async getPayments(supplierId: number, limit = 50): Promise<SupplierPayment[]> {
    return this.prisma.supplierPayment.findMany({
      where: { supplier_id: supplierId },
      include: { purchase: { select: { id: true, total_amount: true } } },
      orderBy: { created_at: 'desc' },
      take: limit,
    }) as unknown as SupplierPayment[];
  }

  async getPaymentsByPurchase(purchaseId: number): Promise<SupplierPayment[]> {
    return this.prisma.supplierPayment.findMany({
      where: { purchase_id: purchaseId },
      orderBy: { created_at: 'asc' },
    }) as unknown as SupplierPayment[];
  }

  async getPaymentsByIds(ids: number[]): Promise<(SupplierPayment & { purchase?: { id: number; created_at: Date } | null })[]> {
    if (ids.length === 0) return [];
    return this.prisma.supplierPayment.findMany({
      where: { id: { in: ids } },
      include: { purchase: { select: { id: true, created_at: true } }, supplier: { select: { name: true, ruc: true } } },
      orderBy: { created_at: 'asc' },
    }) as unknown as (SupplierPayment & { purchase?: { id: number; created_at: Date } | null; supplier?: Pick<Supplier, 'name' | 'ruc'> | null })[];
  }
}
