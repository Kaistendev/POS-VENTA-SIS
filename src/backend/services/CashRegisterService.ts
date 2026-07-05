import { ICashRegisterRepository } from '../../domain/ports/ICashRegisterRepository.js';
import { IAuditLogRepository } from '../../domain/ports/IAuditLogRepository.js';
import { NotFoundError, ConflictError, BusinessRuleError, ValidationError } from '../../shared/errors.js';

export class CashRegisterService {
  constructor(
    private cashRegisterRepo: ICashRegisterRepository,
    private auditLogRepo: IAuditLogRepository,
  ) {}

  async getOpenRegister() {
    return this.cashRegisterRepo.findOpen();
  }

  async getAllRegisters(startDate?: Date, endDate?: Date) {
    return this.cashRegisterRepo.findAll(startDate, endDate);
  }

  async getRegisterDetails(id: number) {
    const register = await this.cashRegisterRepo.findById(id);
    if (!register) throw new NotFoundError('Caja');
    return register;
  }

  async openRegister(openingAmount: number, userId: number = 1) {
    if (isNaN(openingAmount) || openingAmount < 0) {
      throw new ValidationError('El monto de apertura no puede ser negativo.');
    }

    const existing = await this.cashRegisterRepo.findOpen();
    if (existing) throw new ConflictError('Ya hay una caja abierta para el día de hoy.');

    const cashRegister = await this.cashRegisterRepo.create(openingAmount);

    await this.auditLogRepo.create({
      userId,
      action: 'OPEN_CASH_REGISTER',
      entity: 'cash_registers',
      entity_id: cashRegister.id,
    });

    return { success: true, id: cashRegister.id };
  }

  async closeRegister(registerId: number, closingAmount: number, userId: number = 1) {
    if (isNaN(closingAmount) || closingAmount < 0) {
      throw new ValidationError('El monto de cierre no puede ser negativo.');
    }

    const register = await this.cashRegisterRepo.findById(registerId);
    if (!register) throw new NotFoundError('Caja');

    const expectedCash = Number(register.opening_amount) + Number(register.total_sales);
    const difference = Math.round((Number(closingAmount) - expectedCash) * 100) / 100;

    const salesCount = await this.cashRegisterRepo.getSalesCount(
      register.id,
      register.opened_at,
    );

    const status = difference === 0 ? 'PERFECT' : difference > 0 ? 'SURPLUS' : 'MISSING';

    await this.cashRegisterRepo.close(register.id, Number(closingAmount), difference, status);

    await this.auditLogRepo.create({
      userId,
      action: 'CLOSE_CASH_REGISTER',
      entity: 'cash_registers',
      entity_id: register.id,
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

  async getDailySummary(registerId: number) {
    return this.cashRegisterRepo.getDailySummary(registerId);
  }
}
