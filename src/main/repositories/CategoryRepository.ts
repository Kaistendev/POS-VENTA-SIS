import { prisma } from '../prisma/client.js';

export class CategoryRepository {
  static async findAll() {
    return prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
  }

  static async findById(id: number) {
    return prisma.category.findUnique({
      where: { id },
    });
  }

  static async create(category: any) {
    return prisma.category.create({
      data: category,
    });
  }

  static async update(id: number, category: any) {
    return prisma.category.update({
      where: { id },
      data: category,
    });
  }

  static async delete(id: number) {
    return prisma.category.delete({
      where: { id },
    });
  }
}
