import { prisma } from '../prisma/client.js';
import { saleSchema } from '../../common/schemas.js';

export class SaleService {
  static async getAllSales() {
    return prisma.sale.findMany({
      include: {
        client: true,
        cash_register: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  static async getSaleDetails(id: number) {
    return prisma.sale.findUnique({
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
  }

  static async registerSale(
    saleData: any,
    itemsData: any[],
  ) {
    try {
      // Validar con Zod
      const validated = saleSchema.parse({ ...saleData, items: itemsData });

      let finalClientId = validated.client_id;

      // Lógica de Cliente Dinámico: Si se provee nombre y DNI, buscamos o creamos
      if (validated.client_dni && validated.client_name) {
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

      // Usamos una transacción para asegurar consistencia
      const result = await prisma.$transaction(async (tx) => {
        // Obtener productos para calcular purchase_price
        const productIds = validated.items.map((item: any) => item.product_id);
        const products = await tx.product.findMany({
          where: { id: { in: productIds } },
        });

        const productMap = new Map(products.map(p => [p.id, p]));

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
            client_id: finalClientId,
            total,
          },
        });

        // Crear los items de la venta
        const saleItems = await Promise.all(
          itemsWithPurchasePrice.map((item: any) =>
            tx.saleItem.create({
              data: {
                sale_id: sale.id,
                product_id: item.product_id,
                quantity: item.quantity,
                unit_price: item.unit_price,
                purchase_price: item.purchase_price,
              },
            }),
          ),
        );

        // Crear movimientos de inventario (SALIDA)
        await tx.inventoryMovement.createMany({
          data: saleItems.map((item) => ({
            product_id: item.product_id,
            type: 'SALIDA',
            quantity: item.quantity,
          })),
        });

        return sale.id;
      });

      return { success: true, id: result };
    } catch (error: any) {
      console.error('Error al registrar venta:', error);

      if (error.name === 'ZodError') {
        return {
          success: false,
          message: error.errors.map((e: any) => e.message).join('. '),
        };
      }

      return {
        success: false,
        message: error.message || 'Error al registrar venta',
      };
    }
  }
}
