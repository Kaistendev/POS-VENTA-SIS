import db from '../db.js';

export class CashRegisterService {
  static async getOpenRegister() {
    return db('cash_registers').where({ status: 'OPEN' }).first();
  }

  static async openRegister(openingAmount: number) {
    const existing = await this.getOpenRegister();
    if (existing) throw new Error('Ya hay una caja abierta.');

    const [id] = await db('cash_registers').insert({
      opening_amount: openingAmount,
      status: 'OPEN',
      opened_at: db.fn.now()
    }).returning('id');

    return typeof id === 'object' ? id.id : id;
  }

  static async closeRegister(id: number, closingAmount: number) {
    const register = await db('cash_registers').where({ id, status: 'OPEN' }).first();
    if (!register) throw new Error('Caja no encontrada o ya cerrada.');

    // Calculamos el balance esperado: Fondo Inicial + Ventas en Efectivo
    const expectedCash = Number(register.opening_amount) + Number(register.cash_sales);
    const difference = closingAmount - expectedCash;

    await db('cash_registers').where({ id }).update({
      closing_amount: closingAmount,
      closed_at: db.fn.now(),
      status: 'CLOSED',
      updated_at: db.fn.now()
    });

    return {
      expected: expectedCash,
      real: closingAmount,
      difference,
      status: difference === 0 ? 'PERFECT' : difference > 0 ? 'SURPLUS' : 'MISSING'
    };
  }
}
