import type { PrismaClient } from '@prisma/client';
import { IDiscountRepository } from '../../domain/ports/IDiscountRepository.js';
import { Discount, DiscountWithRelations } from '../../domain/models.js';
import { CreateDiscountDTO, UpdateDiscountDTO } from '../../domain/dtos.js';

export class PrismaDiscountRepository implements IDiscountRepository {
  constructor(private prisma: PrismaClient) {}

  async findAll(activeOnly?: boolean): Promise<Discount[]> {
    const where: any = {};
    if (activeOnly) where.is_active = true;

    return this.prisma.discount.findMany({
      where,
      include: { category: { select: { id: true, name: true } } },
      orderBy: { created_at: 'desc' },
    }) as unknown as Discount[];
  }

  async findById(id: number): Promise<DiscountWithRelations | null> {
    const discount = await this.prisma.discount.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true } },
        products: { include: { product: { select: { id: true, name: true, sku: true } } } },
      },
    });
    return discount as unknown as DiscountWithRelations | null;
  }

  async findApplicableToProduct(productId: number, totalAmount?: number): Promise<Discount[]> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { category_id: true },
    });
    if (!product) return [];

    const discounts = await this.prisma.discount.findMany({
      where: {
        is_active: true,
        OR: [
          { applicable_to: 'ALL' },
          { applicable_to: 'CATEGORY', category_id: product.category_id },
          { applicable_to: 'SPECIFIC', products: { some: { product_id: productId } } },
        ],
      },
    });

    if (totalAmount !== undefined) {
      return discounts.filter(
        (d) => d.min_purchase_amount === null || d.min_purchase_amount <= totalAmount,
      ) as unknown as Discount[];
    }

    return discounts as unknown as Discount[];
  }

  async create(data: CreateDiscountDTO): Promise<Discount> {
    const { product_ids, ...discountData } = data;

    return this.prisma.$transaction(async (tx) => {
      const discount = await tx.discount.create({
        data: {
          name: discountData.name,
          type: discountData.type,
          value: discountData.value,
          is_active: discountData.is_active ?? true,
          applicable_to: discountData.applicable_to ?? 'ALL',
          category_id: discountData.category_id ?? null,
          min_purchase_amount: discountData.min_purchase_amount ?? null,
        },
      });

      if (product_ids && product_ids.length > 0) {
        await tx.productDiscount.createMany({
          data: product_ids.map((pid) => ({
            product_id: pid,
            discount_id: discount.id,
          })),
        });
      }

      return discount as unknown as Discount;
    });
  }

  async update(id: number, data: UpdateDiscountDTO): Promise<Discount> {
    const { product_ids, ...discountData } = data;

    return this.prisma.$transaction(async (tx) => {
      const discount = await tx.discount.update({
        where: { id },
        data: {
          ...discountData,
          category_id: discountData.category_id ?? null,
          min_purchase_amount: discountData.min_purchase_amount ?? null,
        },
      });

      if (product_ids !== undefined) {
        await tx.productDiscount.deleteMany({ where: { discount_id: id } });
        if (product_ids.length > 0) {
          await tx.productDiscount.createMany({
            data: product_ids.map((pid) => ({
              product_id: pid,
              discount_id: id,
            })),
          });
        }
      }

      return discount as unknown as Discount;
    });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.discount.delete({ where: { id } });
  }

  async addProducts(discountId: number, productIds: number[]): Promise<void> {
    await this.prisma.productDiscount.createMany({
      data: productIds.map((pid) => ({
        product_id: pid,
        discount_id: discountId,
      })),
    });
  }

  async removeProducts(discountId: number, productIds: number[]): Promise<void> {
    await this.prisma.productDiscount.deleteMany({
      where: {
        discount_id: discountId,
        product_id: { in: productIds },
      },
    });
  }
}
