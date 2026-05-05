import { prisma } from '../prisma/client.js';
import { productSchema } from '../../common/schemas.js';
import { createAuditLog } from '../utils/auditLog.js';

export class ProductService {
  /**
   * Obtiene todos los productos con búsqueda opcional
   */
  static async getAllProducts(search?: string, categoryId?: number) {
    const where: any = {};

    // Búsqueda por nombre, SKU o descripción
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' as const } },
        { sku: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
      ];
    }

    // Filtro por categoría
    if (categoryId) {
      where.category_id = categoryId;
    }

    return prisma.product.findMany({
      where,
      select: {
        id: true,
        sku: true,
        name: true,
        description: true,
        price_sale: true,
        price_purchase: true,
        stock: true,
        min_stock: true,
        created_at: true,
        updated_at: true,
        category: {
          select: { id: true, name: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  /**
   * Obtiene un producto por ID
   */
  static async getProductById(id: number) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });

    if (!product) {
      throw new Error('Producto no encontrado');
    }

    return product;
  }

  /**
   * Obtiene productos con stock bajo
   */
  static async getLowStockProducts(threshold?: number) {
    return prisma.product.findMany({
      where: {
        stock: {
          lte: prisma.product.fields.min_stock,
        },
      },
      include: {
        category: true,
      },
      orderBy: {
        stock: 'asc',
      },
    });
  }

  /**
   * Crea un nuevo producto
   */
  static async createProduct(productData: any, userId: number = 1) {
    // Validar con Zod
    const validated = productSchema.parse(productData);

    // Verificar SKU duplicado
    const existing = await prisma.product.findUnique({
      where: { sku: validated.sku },
    });

    if (existing) {
      throw new Error(`El SKU ${validated.sku} ya se encuentra registrado.`);
    }

    // Verificar que la categoría existe (si se proporciona)
    if (validated.category_id) {
      const category = await prisma.category.findUnique({
        where: { id: validated.category_id },
      });

      if (!category) {
        throw new Error('La categoría especificada no existe.');
      }
    }

    const initialStock = validated.stock || 0;

    // Crear el producto
    const product = await prisma.product.create({
      data: {
        sku: validated.sku,
        name: validated.name,
        price_sale: validated.price_sale,
        price_purchase: validated.price_purchase,
        description: validated.description,
        category_id: validated.category_id,
        min_stock: validated.min_stock,
        stock: initialStock,
      },
    });

    // Registrar movimiento de inventario si hay stock inicial
    if (initialStock > 0) {
      await prisma.inventoryMovement.create({
        data: {
          product_id: product.id,
          type: 'ENTRADA',
          quantity: initialStock,
          reason: 'INICIAL',
        },
      });
    }

    // Registrar en auditoría
    await createAuditLog({
      userId,
      action: 'CREATE_PRODUCT',
      entity: 'products',
      entity_id: product.id,
    });

    return { success: true, id: product.id };
  }

  /**
   * Actualiza un producto existente
   */
  static async updateProduct(id: number, productData: any, userId: number = 1) {
    // Verificar que el producto existe
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      throw new Error('Producto no encontrado');
    }

    // Validar datos de entrada
    const validated = productSchema.parse(productData);

    // Verificar SKU duplicado (excluyendo el producto actual)
    if (validated.sku !== existingProduct.sku) {
      const skuExists = await prisma.product.findUnique({
        where: { sku: validated.sku },
      });

      if (skuExists) {
        throw new Error(`El SKU ${validated.sku} ya se encuentra registrado.`);
      }
    }

    // Verificar que la categoría existe (si se proporciona)
    if (validated.category_id) {
      const category = await prisma.category.findUnique({
        where: { id: validated.category_id },
      });

      if (!category) {
        throw new Error('La categoría especificada no existe.');
      }
    }

    // Actualizar el producto
    const product = await prisma.product.update({
      where: { id },
      data: {
        sku: validated.sku,
        name: validated.name,
        price_sale: validated.price_sale,
        price_purchase: validated.price_purchase,
        description: validated.description,
        category_id: validated.category_id,
        min_stock: validated.min_stock,
      },
    });

    // Registrar en auditoría
    await createAuditLog({
      userId,
      action: 'UPDATE_PRODUCT',
      entity: 'products',
      entity_id: product.id,
    });

    return { success: true, product };
  }

  /**
   * Elimina un producto
   */
  static async deleteProduct(id: number, userId: number = 1) {
    // Verificar que el producto existe
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      throw new Error('Producto no encontrado');
    }

    // Verificar si el producto tiene ventas asociadas
    const salesCount = await prisma.saleItem.count({
      where: { product_id: id },
    });

    if (salesCount > 0) {
      throw new Error(
        `No se puede eliminar el producto porque tiene ${salesCount} venta(s) asociada(s).`,
      );
    }

    // Eliminar el producto (los movimientos de inventario se eliminan en cascada)
    await prisma.product.delete({
      where: { id },
    });

    // Registrar en auditoría
    await createAuditLog({
      userId,
      action: 'DELETE_PRODUCT',
      entity: 'products',
      entity_id: id,
    });

    return { success: true };
  }

  /**
   * Añade stock inicial o adicional (ENTRADA)
   */
  static async addStock(productId: number, quantity: number, userId: number = 1, reason: string = 'AJUSTE') {
    // Verificar existencia del producto
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new Error('El producto no existe.');
    }

    if (quantity <= 0) {
      throw new Error('La cantidad debe ser mayor a cero.');
    }

    // Actualizar stock
    await prisma.product.update({
      where: { id: productId },
      data: {
        stock: {
          increment: quantity,
        },
      },
    });

    // Registrar movimiento de inventario
    await prisma.inventoryMovement.create({
      data: {
        product_id: productId,
        type: 'ENTRADA',
        quantity,
        reason,
      },
    });

    // Registrar en auditoría
    await createAuditLog({
      userId,
      action: 'STOCK_ENTRADA',
      entity: 'products',
      entity_id: productId,
    });

    return { success: true };
  }

  /**
   * Reduce stock (SALIDA) - Para devoluciones o ajustes
   */
  static async removeStock(productId: number, quantity: number, userId: number = 1, reason: string = 'AJUSTE') {
    // Verificar existencia del producto
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new Error('El producto no existe.');
    }

    if (quantity <= 0) {
      throw new Error('La cantidad debe ser mayor a cero.');
    }

    // Verificar que hay suficiente stock
    if (product.stock < quantity) {
      throw new Error(
        `Stock insuficiente. Stock actual: ${product.stock}, Cantidad solicitada: ${quantity}`,
      );
    }

    // Actualizar stock
    await prisma.product.update({
      where: { id: productId },
      data: {
        stock: {
          decrement: quantity,
        },
      },
    });

    // Registrar movimiento de inventario
    await prisma.inventoryMovement.create({
      data: {
        product_id: productId,
        type: 'SALIDA',
        quantity,
        reason,
      },
    });

    // Registrar en auditoría
    await createAuditLog({
      userId,
      action: 'STOCK_SALIDA',
      entity: 'products',
      entity_id: productId,
    });

    return { success: true };
  }

  /**
   * Obtiene el historial de movimientos de un producto
   */
  static async getInventoryMovements(productId: number, limit: number = 50) {
    // Verificar que el producto existe
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new Error('El producto no existe.');
    }

    return prisma.inventoryMovement.findMany({
      where: { product_id: productId },
      orderBy: { created_at: 'desc' },
      take: limit,
    });
  }
}
