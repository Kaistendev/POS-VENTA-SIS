import { prisma } from '../prisma/client.js';

export class CashRegisterService {
  static async getOpenRegister() {
    // En PostgreSQL, necesitamos verificar si hay una caja abierta
    // Podemos usar un campo status o verificar si opened_at es de hoy
    return prisma.cashRegister.findFirst({
      where: {
        opened_at: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
      orderBy: { opened_at: 'desc' },
    });
  }

  static async openRegister(openingAmount: number) {
    const existing = await this.getOpenRegister();
    if (existing) throw new Error('Ya hay una caja abierta.');

    const cashRegister = await prisma.cashRegister.create({
      data: {
        opening_amount: openingAmount,
        total_sales: 0,
      },
    });

    return cashRegister.id;
  }

  static async closeRegister(id: number, closingAmount: number) {
    const register = await prisma.cashRegister.findFirst({
      where: {
        id,
        opened_at: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    });

    if (!register) throw new Error('Caja no encontrada o ya cerrada.');

    // Calculamos el balance esperado: Fondo Inicial + Ventas
    const expectedCash = Number(register.opening_amount) + Number(register.total_sales);
    const difference = closingAmount - expectedCash;

    await prisma.cashRegister.update({
      where: { id },
      data: {
        total_sales: register.total_sales, // Mantener el valor actual
      },
    });

    return {
      expected: expectedCash,
      real: closingAmount,
      difference,
      status:
        difference === 0 ? 'PERFECT' : difference > 0 ? 'SURPLUS' : 'MISSING',
    };
  }
}
