import { prisma } from '../prisma/client.js';
import { saleSchema } from '../../common/schemas.js';

export class SaleService {
  /**
   * Obtiene todas las ventas con filtros opcionales
   */
  static async getAllSales(
    startDate?: Date,
    endDate?: Date,
    clientId?: number,
    cashRegisterId?: number,
  ) {
    const where: any = {};

    // Filtro por fecha
    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) {
        where.created_at.gte = startDate;
      }
      if (endDate) {
        where.created_at.lte = endDate;
      }
    }

    // Filtro por cliente
    if (clientId) {
      where.client_id = clientId;
    }

    // Filtro por caja
    if (cashRegisterId) {
      where.cash_register_id = cashRegisterId;
    }

    return prisma.sale.findMany({
      where,
      include: {
        client: true,
        cash_register: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  /**
   * Obtiene una venta por ID con todos sus detalles
   */
  static async getSaleDetails(id: number) {
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        client: true,
        cash_register: true,
      },
    });

    if (!sale) {
      throw new Error('Venta no encontrada');
    }

    return sale;
  }

  /**
   * Obtiene ventas del día actual
   */
  static async getTodaySales() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    return prisma.sale.findMany({
      where: {
        created_at: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        client: true,
        cash_register: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  /**
   * Obtiene estadísticas de ventas
   */
  static async getSalesStats(startDate?: Date, endDate?: Date) {
    const where: any = {};

    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) {
        where.created_at.gte = startDate;
      }
      if (endDate) {
        where.created_at.lte = endDate;
      }
    }

    const stats = await prisma.sale.aggregate({
      where,
      _count: {
        id: true,
      },
      _sum: {
        total: true,
      },
      _avg: {
        total: true,
      },
    });

    return {
      totalSales: stats._count.id,
      totalRevenue: stats._sum.total || 0,
      averageSale: stats._avg.total || 0,
    };
  }

  /**
   * Registra una nueva venta con actualización de inventario
   */
  static async registerSale(
    saleData: any,
    itemsData: any[],
    userId: number = 1,
  ) {
    // Validar con Zod
    const validated = saleSchema.parse({ ...saleData, items: itemsData });

    // Verificar que la caja existe y está abierta
    const cashRegister = await prisma.cashRegister.findFirst({
      where: {
        id: validated.cash_register_id,
        opened_at: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    });

    if (!cashRegister) {
      throw new Error('La caja no está abierta o no existe.');
    }

    let finalClientId = validated.client_id;

    // Lógica de Cliente Dinámico: Si se provee nombre y DNI, buscamos o creamos
    if (validated.client_dni && validated.client_name && !finalClientId) {
      const existingClient = await prisma.client.findFirst({
        where: { dni: validated.client_dni },
      });

      if (existingClient) {
        finalClientId = existingClient.id;
      } else {
        // Crear cliente al vuelo
        const client = await prisma.client.create({
          data: {
            dni: validated.client_dni,
            name: validated.client_name,
            code: `CLI-${Date.now()}`,
          },
        });
        finalClientId = client.id;
      }
    }

    // Verificar que el cliente existe (si se proporciona client_id directamente)
    if (finalClientId) {
      const client = await prisma.client.findUnique({
        where: { id: finalClientId },
      });

      if (!client) {
        throw new Error('El cliente no existe.');
      }
    }

    // Usamos una transacción para asegurar consistencia
    const saleId = await prisma.$transaction(async (tx) => {
      // Obtener productos para calcular purchase_price y verificar stock
      const productIds = validated.items.map((item: any) => item.product_id);
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
      });

      const productMap = new Map(products.map((p) => [p.id, p]));

      // Verificar stock suficiente para todos los productos
      for (const item of validated.items) {
        const product = productMap.get(item.product_id);

        if (!product) {
          throw new Error(`El producto ID ${item.product_id} no existe.`);
        }

        if (product.stock < item.quantity) {
          throw new Error(
            `Stock insuficiente para "${product.name}". Stock actual: ${product.stock}, Cantidad solicitada: ${item.quantity}`,
          );
        }
      }

      const itemsWithPurchasePrice = validated.items.map((item: any) => {
        const product = productMap.get(item.product_id);
        return {
          ...item,
          purchase_price: product?.price_purchase || 0,
        };
      });

      const total = itemsWithPurchasePrice.reduce(
        (acc: number, item: any) => acc + item.unit_price * item.quantity,
        0,
      );

      // Crear la venta
      const sale = await tx.sale.create({
        data: {
          cash_register_id: validated.cash_register_id,
          client_id: finalClientId || 1, // Default to a generic client if not provided
          total,
        },
      });

      // Crear los items de la venta y actualizar stock
      for (const item of itemsWithPurchasePrice) {
        // Crear item de venta
        await tx.saleItem.create({
          data: {
            sale_id: sale.id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            purchase_price: item.purchase_price,
          },
        });

        // Actualizar stock del producto (decrementar)
        await tx.product.update({
          where: { id: item.product_id },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });

        // Crear movimiento de inventario (SALIDA)
        await tx.inventoryMovement.create({
          data: {
            product_id: item.product_id,
            type: 'SALIDA',
            quantity: item.quantity,
          },
        });
      }

      // Actualizar total de ventas de la caja
      await tx.cashRegister.update({
        where: { id: validated.cash_register_id },
        data: {
          total_sales: {
            increment: total,
          },
        },
      });

      return sale.id;
    });

    // Registrar en auditoría
    await prisma.auditLog.create({
      data: {
        user_id: userId,
        action: 'CREATE_SALE',
        entity: 'sales',
        entity_id: saleId,
      },
    });

    return { success: true, id: saleId };
  }

  /**
   * Anula una venta (devolución completa)
   */
  static async cancelSale(saleId: number, userId: number = 1) {
    // Verificar que la venta existe
    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        items: true,
      },
    });

    if (!sale) {
      throw new Error('Venta no encontrada');
    }

    // Verificar si ya fue anulada (buscar en auditoría)
    // Nota: Podríamos agregar un campo "status" o "cancelled" en el futuro

    await prisma.$transaction(async (tx) => {
      // Devolver stock de los productos
      for (const item of sale.items) {
        // Actualizar stock del producto (incrementar)
        await tx.product.update({
          where: { id: item.product_id },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        });

        // Crear movimiento de inventario (ENTRADA por devolución)
        await tx.inventoryMovement.create({
          data: {
            product_id: item.product_id,
            type: 'ENTRADA',
            quantity: item.quantity,
          },
        });
      }

      // Actualizar total de ventas de la caja (decrementar)
      await tx.cashRegister.update({
        where: { id: sale.cash_register_id },
        data: {
          total_sales: {
            decrement: sale.total,
          },
        },
      });

      // Eliminar la venta y sus items (cascade delete)
      await tx.sale.delete({
        where: { id: saleId },
      });
    });

    // Registrar en auditoría
    await prisma.auditLog.create({
      data: {
        user_id: userId,
        action: 'CANCEL_SALE',
        entity: 'sales',
        entity_id: saleId,
      },
    });

    return { success: true };
  }
}
