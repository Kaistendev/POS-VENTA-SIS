import type { PrismaClient } from '@prisma/client';
import { ISupplierRepository } from '../../domain/ports/ISupplierRepository.js';
import { Supplier, SupplierWithRelations } from '../../domain/models.js';
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
}
