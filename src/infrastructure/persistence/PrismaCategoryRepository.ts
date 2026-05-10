import { PrismaClient } from '@prisma/client';
import { ICategoryRepository } from '../../domain/ports/ICategoryRepository.js';
import { Category, CategoryWithProducts } from '../../domain/models.js';
import { CreateCategoryDTO, UpdateCategoryDTO } from '../../domain/dtos.js';

export class PrismaCategoryRepository implements ICategoryRepository {
  constructor(private prisma: PrismaClient) {}

  async findAll(search?: string): Promise<Category[]> {
    const where = search
      ? { name: { contains: search, mode: 'insensitive' as const } }
      : {};

    return this.prisma.category.findMany({
      where,
      select: { id: true, name: true, created_at: true, updated_at: true },
      orderBy: { name: 'asc' },
    }) as unknown as Category[];
  }

  async findById(id: number): Promise<CategoryWithProducts | null> {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        products: { select: { id: true, name: true, sku: true, stock: true } },
      },
    });
    return category as unknown as CategoryWithProducts | null;
  }

  async findByName(name: string): Promise<Category | null> {
    return this.prisma.category.findFirst({ where: { name } }) as unknown as Category | null;
  }

  async create(data: CreateCategoryDTO): Promise<Category> {
    return this.prisma.category.create({ data }) as unknown as Category;
  }

  async update(id: number, data: UpdateCategoryDTO): Promise<Category> {
    return this.prisma.category.update({ where: { id }, data }) as unknown as Category;
  }

  async delete(id: number): Promise<void> {
    await this.prisma.category.delete({ where: { id } });
  }

  async getProductCount(id: number): Promise<number> {
    return this.prisma.product.count({ where: { category_id: id } });
  }
}
