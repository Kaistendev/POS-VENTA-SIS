import { prisma } from '../prisma/client.js';
import { categorySchema } from '../../common/schemas.js';
import { createAuditLog } from '../utils/auditLog.js';

export class CategoryRepository {
  /**
   * Obtiene todas las categorías con búsqueda opcional
   */
  static async findAll(search?: string) {
    const where = search
      ? {
          name: { contains: search, mode: 'insensitive' as const },
        }
      : {};

    return prisma.category.findMany({
      where,
      select: {
        id: true,
        name: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Obtiene una categoría por ID
   */
  static async findById(id: number) {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        products: {
          select: {
            id: true,
            name: true,
            sku: true,
            stock: true,
          },
        },
      },
    });

    if (!category) {
      throw new Error('Categoría no encontrada');
    }

    return category;
  }

  /**
   * Crea una nueva categoría
   */
  static async create(categoryData: any, userId?: number) {
    // Validar con Zod
    const validated = categorySchema.parse(categoryData);

    // Verificar nombre duplicado
    const existing = await prisma.category.findFirst({
      where: { name: validated.name },
    });

    if (existing) {
      throw new Error(`La categoría "${validated.name}" ya existe.`);
    }

    const category = await prisma.category.create({
      data: validated,
    });

    // Registrar en auditoría si se proporciona userId
    if (userId) {
      await createAuditLog({
        userId,
        action: 'CREATE_CATEGORY',
        entity: 'categories',
        entity_id: category.id,
      });
    }

    return category;
  }

  /**
   * Actualiza una categoría
   */
  static async update(id: number, categoryData: any, userId?: number) {
    // Verificar que la categoría existe
    const existingCategory = await prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      throw new Error('Categoría no encontrada');
    }

    // Validar datos de entrada
    const validated = categorySchema.parse(categoryData);

    // Verificar nombre duplicado (excluyendo la categoría actual)
    const duplicate = await prisma.category.findFirst({
      where: {
        name: validated.name,
        NOT: { id },
      },
    });

    if (duplicate) {
      throw new Error(`La categoría "${validated.name}" ya existe.`);
    }

    const category = await prisma.category.update({
      where: { id },
      data: validated,
    });

    // Registrar en auditoría si se proporciona userId
    if (userId) {
      await createAuditLog({
        userId,
        action: 'UPDATE_CATEGORY',
        entity: 'categories',
        entity_id: category.id,
      });
    }

    return category;
  }

  /**
   * Elimina una categoría
   */
  static async delete(id: number, userId?: number) {
    // Verificar que la categoría existe
    const existingCategory = await prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      throw new Error('Categoría no encontrada');
    }

    // Verificar si hay productos usando esta categoría
    const productsCount = await prisma.product.count({
      where: { category_id: id },
    });

    if (productsCount > 0) {
      throw new Error(
        `No se puede eliminar la categoría porque tiene ${productsCount} producto(s) asociado(s).`,
      );
    }

    await prisma.category.delete({
      where: { id },
    });

    // Registrar en auditoría si se proporciona userId
    if (userId) {
      await createAuditLog({
        userId,
        action: 'DELETE_CATEGORY',
        entity: 'categories',
        entity_id: id,
      });
    }

    return { success: true };
  }
}
