import { ProductRepository } from '../repositories/ProductRepository.js';
import { InventoryRepository } from '../repositories/InventoryRepository.js';
import { AuditRepository } from '../repositories/AuditRepository.js';
import { Product } from '../../common/types.js';

export class ProductService {
  static async getAllProducts() {
    return ProductRepository.findAll();
  }

  static async createProduct(productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>, userId: number = 1) {
    try {
      if (!productData.sku || productData.sku.trim() === '') throw new Error('El SKU es obligatorio.');
      if (!productData.name || productData.name.trim() === '') throw new Error('El nombre es obligatorio.');
      if (productData.price_sale < 0) throw new Error('El precio no puede ser negativo.');

      const existing = await ProductRepository.findBySku(productData.sku);
      let productId: number;
      let isUpdate = false;

      if (existing) {
        // ACTUALIZAR PRODUCTO EXISTENTE
        productId = existing.id!;
        isUpdate = true;
        await ProductRepository.update(productId, {
          name: productData.name,
          price_sale: productData.price_sale
        });
      } else {
        // CREAR NUEVO PRODUCTO
        const [idRow] = await ProductRepository.create({
          sku: productData.sku,
          name: productData.name,
          price_sale: productData.price_sale
        });
        productId = typeof idRow === 'object' ? (idRow as any).id : idRow;
      }

      // Procesar Stock (siempre como ENTRADA si es > 0)
      const quantityToAdd = productData.stock || 0;
      if (quantityToAdd > 0) {
        await InventoryRepository.createMovement({
          product_id: productId,
          type: 'ENTRADA',
          quantity: quantityToAdd
        });
      }

      await AuditRepository.create({
        user_id: userId,
        action: isUpdate ? 'UPDATE_PRODUCT_UPSERT' : 'CREATE_PRODUCT_UPSERT',
        entity: 'products',
        entity_id: productId
      });

      return { success: true, id: productId, message: isUpdate ? 'Producto actualizado correctamente' : 'Producto creado correctamente' };
    } catch (error: any) {
      console.error('Error en upsert de producto:', error);
      return { success: false, message: error.message || 'Error al procesar producto' };
    }
  }

  static async addInitialStock(productId: number, quantity: number, userId: number = 1) {
    try {
      if (quantity <= 0) {
        throw new Error('La cantidad a añadir debe ser mayor a cero.');
      }

      // 1. Verificar existencia del producto
      const product = await ProductRepository.findById(productId);
      if (!product) {
        throw new Error('El producto no existe.');
      }

      // 2. Mueve el inventario en 'ENTRADA'. El DB trigger actualizará Product.stock auto
      await InventoryRepository.createMovement({
        product_id: productId,
        type: 'ENTRADA',
        quantity
      });

      await AuditRepository.create({
        user_id: userId,
        action: 'STOCK_ENTRADA',
        entity: 'products',
        entity_id: productId
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error al añadir stock:', error);
      return { success: false, message: error.message || 'Error al añadir stock' };
    }
  }
}
