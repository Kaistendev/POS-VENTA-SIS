import { prisma } from '../prisma/client.js';
import { createAuditLog } from '../utils/auditLog.js';

export class PurchaseService {
  /**
   * Get all purchases with optional filters
   */
  static async getAllPurchases(supplierId?: number, status?: string) {
    try {
      const where: any = {};

      if (supplierId) {
        where.supplier_id = supplierId;
      }

      if (status) {
        where.status = status;
      }

      return await prisma.purchase.findMany({
        where,
        include: {
          supplier: {
            select: { id: true, name: true, ruc: true },
          },
          items: {
            include: {
              product: {
                select: { id: true, name: true, sku: true },
              },
            },
          },
        },
        orderBy: { created_at: 'desc' },
      });
    } catch (error: any) {
      console.error('Get all purchases error:', error);
      throw new Error('Error al obtener compras');
    }
  }

  /**
   * Get purchase by ID
   */
  static async getPurchaseById(id: number) {
    try {
      const purchase = await prisma.purchase.findUnique({
        where: { id },
        include: {
          supplier: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!purchase) {
        throw new Error('Compra no encontrada');
      }

      return purchase;
    } catch (error: any) {
      console.error('Get purchase by ID error:', error);
      if (error.code === 'P2025') {
        throw new Error('Compra no encontrada');
      }
      throw new Error('Error al obtener compra');
    }
  }

  /**
   * Create a new purchase order (status: PENDING)
   */
  static async createPurchase(
    data: {
      supplier_id: number;
      items: { product_id: number; quantity: number; unit_cost: number }[];
    },
    createdBy: number,
  ) {
    try {
      // Verify supplier exists
      const supplier = await prisma.supplier.findUnique({
        where: { id: data.supplier_id },
      });

      if (!supplier) {
        throw new Error('Proveedor no encontrado');
      }

      // Verify all products exist
      const productIds = data.items.map((item) => item.product_id);
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
      });

      if (products.length !== productIds.length) {
        throw new Error('Uno o más productos no existen');
      }

      // Calculate total
      const totalAmount = data.items.reduce(
        (sum, item) => sum + item.quantity * item.unit_cost,
        0
      );

      // Create purchase with items
      const purchase = await prisma.purchase.create({
        data: {
          supplier_id: data.supplier_id,
          total_amount: totalAmount,
          status: 'PENDING',
          items: {
            create: data.items.map((item) => ({
              product_id: item.product_id,
              quantity: item.quantity,
              unit_cost: item.unit_cost,
            })),
          },
        },
        include: {
          supplier: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      // Log audit
      await createAuditLog({
        userId: createdBy,
        action: 'CREATE_PURCHASE',
        entity: 'purchases',
        entity_id: purchase.id,
      });

      return purchase;
    } catch (error: any) {
      console.error('Create purchase error:', error);
      throw error;
    }
  }

  /**
   * Receive purchase (change status to RECEIVED and update stock)
   */
  static async receivePurchase(purchaseId: number, receivedBy: number) {
    try {
      // Get purchase with items
      const purchase = await prisma.purchase.findUnique({
        where: { id: purchaseId },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!purchase) {
        throw new Error('Compra no encontrada');
      }

      if (purchase.status === 'RECEIVED') {
        throw new Error('Esta compra ya fue recibida');
      }

      if (purchase.status === 'CANCELLED') {
        throw new Error('No se puede recibir una compra cancelada');
      }

      // Update stock and create inventory movements
      await prisma.$transaction(async (tx) => {
        // Update each product's stock
        for (const item of purchase.items) {
          await tx.product.update({
            where: { id: item.product_id },
            data: {
              stock: {
                increment: item.quantity,
              },
              // Update purchase price to last purchase cost
              price_purchase: item.unit_cost,
            },
          });

          // Create inventory movement
          await tx.inventoryMovement.create({
            data: {
              product_id: item.product_id,
              type: 'ENTRADA',
              quantity: item.quantity,
              reason: 'COMPRA',
            },
          });
        }

        // Update purchase status
        await tx.purchase.update({
          where: { id: purchaseId },
          data: { status: 'RECEIVED' },
        });
      });

      // Log audit
      await createAuditLog({
        userId: receivedBy,
        action: 'RECEIVE_PURCHASE',
        entity: 'purchases',
        entity_id: purchaseId,
      });

      return { success: true };
    } catch (error: any) {
      console.error('Receive purchase error:', error);
      if (error.code === 'P2025') {
        throw new Error('Compra no encontrada');
      }
      throw error;
    }
  }

  /**
   * Cancel purchase (only if PENDING)
   */
  static async cancelPurchase(purchaseId: number, cancelledBy: number) {
    try {
      const purchase = await prisma.purchase.findUnique({
        where: { id: purchaseId },
      });

      if (!purchase) {
        throw new Error('Compra no encontrada');
      }

      if (purchase.status === 'RECEIVED') {
        throw new Error('No se puede cancelar una compra ya recibida');
      }

      if (purchase.status === 'CANCELLED') {
        throw new Error('Esta compra ya está cancelada');
      }

      await prisma.purchase.update({
        where: { id: purchaseId },
        data: { status: 'CANCELLED' },
      });

      // Log audit
      await createAuditLog({
        userId: cancelledBy,
        action: 'CANCEL_PURCHASE',
        entity: 'purchases',
        entity_id: purchaseId,
      });

      return { success: true };
    } catch (error: any) {
      console.error('Cancel purchase error:', error);
      if (error.code === 'P2025') {
        throw new Error('Compra no encontrada');
      }
      throw error;
    }
  }
}
