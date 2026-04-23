import { prisma } from '../prisma/client.js';
import { cashRegisterSchema, cashRegisterCloseSchema } from '../../common/schemas.js';

export class CashRegisterService {
  /**
   * Obtiene la caja abierta del día actual
   */
  static async getOpenRegister() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    return prisma.cashRegister.findFirst({
      where: {
        opened_at: {
          gte: startOfDay,
        },
      },
      orderBy: { opened_at: 'desc' },
    });
  }

  /**
   * Obtiene todas las cajas registradas con filtros opcionales
   */
  static async getAllRegisters(
    startDate?: Date,
    endDate?: Date,
  ) {
    const where: any = {};

    if (startDate || endDate) {
      where.opened_at = {};
      if (startDate) {
        where.opened_at.gte = startDate;
      }
      if (endDate) {
        where.opened_at.lte = endDate;
      }
    }

    return prisma.cashRegister.findMany({
      where,
      include: {
        _count: {
          select: {
            sales: true,
          },
        },
      },
      orderBy: { opened_at: 'desc' },
    });
  }

  /**
   * Obtiene los detalles de una caja específica
   */
  static async getRegisterDetails(id: number) {
    const register = await prisma.cashRegister.findUnique({
      where: { id },
      include: {
        sales: {
          include: {
            client: true,
            items: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    if (!register) {
      throw new Error('Caja no encontrada');
    }

    return register;
  }

  /**
   * Abre una nueva caja registradora
   */
  static async openRegister(openingAmount: number, userId: number = 1) {
    if (isNaN(openingAmount) || openingAmount < 0) {
      throw new Error('El monto de apertura no puede ser negativo.');
    }

    // Verificar si ya hay una caja abierta hoy
    const existing = await this.getOpenRegister();
    if (existing) {
      throw new Error('Ya hay una caja abierta para el día de hoy.');
    }

    const cashRegister = await prisma.cashRegister.create({
      data: {
        opening_amount: Number(openingAmount),
        total_sales: 0,
      },
    });

    // Registrar en auditoría
    await prisma.auditLog.create({
      data: {
        user_id: userId,
        action: 'OPEN_CASH_REGISTER',
        entity: 'cash_registers',
        entity_id: cashRegister.id,
      },
    });

    return { success: true, id: cashRegister.id };
  }

  /**
   * Cierra una caja registradora con conciliación
   */
  static async closeRegister(
    registerId: number,
    closingAmount: number,
    userId: number = 1,
  ) {
    if (isNaN(closingAmount) || closingAmount < 0) {
      throw new Error('El monto de cierre no puede ser negativo.');
    }

    // Buscar la caja por ID
    const register = await prisma.cashRegister.findUnique({
      where: {
        id: Number(registerId),
      },
    });

    if (!register) {
      throw new Error('Caja no encontrada.');
    }

    // Calculamos el balance esperado: Fondo Inicial + Ventas
    const expectedCash =
      Number(register.opening_amount) + Number(register.total_sales);
    const difference = Number(closingAmount) - expectedCash;

    // Obtener cantidad de ventas desde que se abrió la caja
    const salesCount = await prisma.sale.count({
      where: {
        cash_register_id: register.id,
        created_at: {
          gte: register.opened_at,
        },
      },
    });

    // Determinar estado
    const status =
      difference === 0
        ? 'PERFECT'
        : difference > 0
        ? 'SURPLUS'
        : 'MISSING';

    // Registrar en auditoría
    await prisma.auditLog.create({
      data: {
        user_id: userId,
        action: 'CLOSE_CASH_REGISTER',
        entity: 'cash_registers',
        entity_id: register.id,
      },
    });

    return {
      success: true,
      registerId: register.id,
      openingAmount: register.opening_amount,
      totalSales: register.total_sales,
      expectedCash,
      realCash: Number(closingAmount),
      difference,
      status,
      salesCount,
    };
  }

  /**
   * Obtiene el resumen del día para una caja específica
   */
  static async getDailySummary(registerId: number) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Obtener la caja
    const register = await prisma.cashRegister.findFirst({
      where: {
        id: registerId,
        opened_at: {
          gte: startOfDay,
        },
      },
    });

    if (!register) {
      throw new Error('Caja no encontrada o no está abierta hoy.');
    }

    // Obtener estadísticas de ventas
    const salesStats = await prisma.sale.aggregate({
      where: {
        cash_register_id: registerId,
        created_at: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
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

    // Obtener ventas por método de pago
    const salesByPayment = await prisma.sale.groupBy({
      by: ['payment_method'],
      where: {
        cash_register_id: registerId,
        created_at: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      _count: {
        id: true,
      },
      _sum: {
        total: true,
      },
    });

    return {
      register,
      totalSales: salesStats._count.id,
      totalRevenue: salesStats._sum.total || 0,
      averageSale: salesStats._avg.total || 0,
      salesByPayment,
    };
  }
}
