import type { PrismaClient } from '@prisma/client';
import { IProductRepository } from '../../domain/ports/IProductRepository.js';
import { Product, ProductWithRelations } from '../../domain/models.js';
import { CreateProductDTO, UpdateProductDTO, StockMovementDTO } from '../../domain/dtos.js';
import { BusinessRuleError } from '../../shared/errors.js';

export class PrismaProductRepository implements IProductRepository {
  constructor(private prisma: PrismaClient) {}

  async findAll(search?: string, categoryId?: number): Promise<Product[]> {
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' as const } },
        { sku: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
      ];
    }

    if (categoryId) where.category_id = categoryId;

    return this.prisma.product.findMany({
      where,
      select: {
        id: true, sku: true, name: true, description: true,
        price_sale: true, price_purchase: true, stock: true, min_stock: true,
        created_at: true, updated_at: true, category_id: true, supplier_id: true,
        category: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },
      },
      orderBy: { created_at: 'desc' },
    }) as unknown as Product[];
  }

  async findById(id: number): Promise<ProductWithRelations | null> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true, supplier: true },
    });
    return product as unknown as ProductWithRelations | null;
  }

  async findByIds(ids: number[]): Promise<Product[]> {
    return this.prisma.product.findMany({
      where: { id: { in: ids } },
    }) as unknown as Product[];
  }

  async findBySku(sku: string): Promise<Product | null> {
    return this.prisma.product.findUnique({ where: { sku } }) as unknown as Product | null;
  }

  async findLowStock(): Promise<ProductWithRelations[]> {
    return this.prisma.product.findMany({
      where: { stock: { lte: this.prisma.product.fields.min_stock } },
      include: { category: true },
      orderBy: { stock: 'asc' },
    }) as unknown as ProductWithRelations[];
  }

  async create(data: CreateProductDTO): Promise<Product> {
    const initialStock = data.stock || 0;
    return this.prisma.product.create({
      data: {
        sku: data.sku, name: data.name,
        price_sale: data.price_sale, price_purchase: data.price_purchase,
        description: data.description, category_id: data.category_id,
        supplier_id: data.supplier_id, min_stock: data.min_stock,
        stock: initialStock,
      },
    }) as unknown as Product;
  }

  async update(id: number, data: UpdateProductDTO): Promise<ProductWithRelations> {
    return this.prisma.product.update({
      where: { id }, data,
      include: { category: true, supplier: true },
    }) as unknown as ProductWithRelations;
  }

  async delete(id: number): Promise<void> {
    await this.prisma.product.delete({ where: { id } });
  }

  async getSalesCount(id: number): Promise<number> {
    return this.prisma.saleItem.count({ where: { product_id: id } });
  }

  async updateStock(id: number, delta: number): Promise<void> {
    if (delta < 0) {
      const result = await this.prisma.product.updateMany({
        where: { id, stock: { gte: Math.abs(delta) } },
        data: { stock: { increment: delta } },
      });
      if (result.count === 0) {
        throw new BusinessRuleError('Stock insuficiente');
      }
    } else {
      await this.prisma.product.update({
        where: { id },
        data: { stock: { increment: delta } },
      });
    }
  }

  async createMovement(data: StockMovementDTO): Promise<void> {
    await this.prisma.inventoryMovement.create({ data });
  }

  async getMovements(productId: number, limit = 50): Promise<any[]> {
    return this.prisma.inventoryMovement.findMany({
      where: { product_id: productId },
      orderBy: { created_at: 'desc' },
      take: limit,
    });
  }

  async bulkUpdatePrice(percentage: number, categoryId?: number): Promise<number> {
    const where: any = {};
    if (categoryId !== undefined) where.category_id = categoryId;

    const result = await this.prisma.product.updateMany({
      where,
      data: { price_sale: { multiply: 1 + percentage / 100 } },
    });

    return result.count;
  }
}
