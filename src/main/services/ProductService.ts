import { prisma } from '../prisma/client.js';
import { productSchema } from '../../common/schemas.js';

export class ProductService {
  static async getAllProducts() {
    return prisma.product.findMany({
      include: {
        category: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  static async createProduct(productData: any, userId: number = 1) {
    try {
      // Validar con Zod
      const validated = productSchema.parse(productData);

      const existing = await prisma.product.findUnique({
        where: { sku: validated.sku },
      });

      let productId: number;
      let isUpdate = false;

      if (existing) {
        // ACTUALIZAR PRODUCTO EXISTENTE
        productId = existing.id;
        isUpdate = true;

        await prisma.product.update({
          where: { id: productId },
          data: {
            name: validated.name,
            price_sale: validated.price_sale,
            price_purchase: validated.price_purchase,
            description: validated.description,
            category_id: validated.category_id,
            min_stock: validated.min_stock,
          },
        });
      } else {
        // CREAR NUEVO PRODUCTO
        const product = await prisma.product.create({
          data: {
            sku: validated.sku,
            name: validated.name,
            price_sale: validated.price_sale,
            price_purchase: validated.price_purchase,
            description: validated.description,
            category_id: validated.category_id,
            min_stock: validated.min_stock,
            stock: validated.stock || 0,
          },
        });

        productId = product.id;
      }

      // Procesar Stock (siempre como ENTRADA si es > 0)
      const quantityToAdd = validated.stock || 0;
      if (quantityToAdd > 0 && !isUpdate) {
        await prisma.inventoryMovement.create({
          data: {
            product_id: productId,
            type: 'ENTRADA',
            quantity: quantityToAdd,
          },
        });
      }

      await prisma.auditLog.create({
        data: {
          user_id: userId,
          action: isUpdate ? 'UPDATE_PRODUCT_UPSERT' : 'CREATE_PRODUCT_UPSERT',
          entity: 'products',
          entity_id: productId,
        },
      });

      return {
        success: true,
        id: productId,
        message: isUpdate
          ? 'Producto actualizado correctamente'
          : 'Producto creado correctamente',
      };
    } catch (error: any) {
      console.error('Error en upsert de producto:', error);

      if (error.name === 'ZodError') {
        return {
          success: false,
          message: error.errors.map((e: any) => e.message).join('. '),
        };
      }

      return {
        success: false,
        message: error.message || 'Error al procesar producto',
      };
    }
  }

  static async addInitialStock(
    productId: number,
    quantity: number,
    userId: number = 1,
  ) {
    try {
      if (quantity <= 0) {
        throw new Error('La cantidad a añadir debe ser mayor a cero.');
      }

      // 1. Verificar existencia del producto
      const product = await prisma.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        throw new Error('El producto no existe.');
      }

      // 2. Mueve el inventario en 'ENTRADA'
      await prisma.inventoryMovement.create({
        data: {
          product_id: productId,
          type: 'ENTRADA',
          quantity,
        },
      });

      await prisma.auditLog.create({
        data: {
          user_id: userId,
          action: 'STOCK_ENTRADA',
          entity: 'products',
          entity_id: productId,
        },
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error al añadir stock:', error);
      return {
        success: false,
        message: error.message || 'Error al añadir stock',
      };
    }
  }
}
