import { ISupplierRepository } from '../../domain/ports/ISupplierRepository.js';
import { IAuditLogRepository } from '../../domain/ports/IAuditLogRepository.js';
import { ICashRegisterRepository } from '../../domain/ports/ICashRegisterRepository.js';
import { CreateSupplierDTO, UpdateSupplierDTO } from '../../domain/dtos.js';
import { NotFoundError, ConflictError, BusinessRuleError, ValidationError } from '../../shared/errors.js';
import { logger } from '../../shared/logger.js';

export class SupplierService {
  constructor(
    private supplierRepo: ISupplierRepository,
    private auditLogRepo: IAuditLogRepository,
    private cashRegisterRepo: ICashRegisterRepository,
  ) {}

  async getAllSuppliers(search?: string) {
    try {
      return await this.supplierRepo.findAll(search);
    } catch (error: any) {
      logger.error('Get all suppliers error:', error);
      throw new Error('Error al obtener proveedores');
    }
  }

  async getSupplierById(id: number) {
    try {
      const supplier = await this.supplierRepo.findById(id);
      if (!supplier) throw new NotFoundError('Proveedor');
      return supplier;
    } catch (error: any) {
      logger.error('Get supplier by ID error:', error);
      if (error.code === 'P2025') throw new NotFoundError('Proveedor');
      throw error;
    }
  }

  async createSupplier(data: CreateSupplierDTO, createdBy: number) {
    try {
      if (data.ruc) {
        const exists = await this.supplierRepo.findByRuc(data.ruc);
        if (exists) throw new ConflictError(`El RUC ${data.ruc} ya está registrado`);
      }

      const supplier = await this.supplierRepo.create(data);

      await this.auditLogRepo.create({
        userId: createdBy,
        action: 'CREATE_SUPPLIER',
        entity: 'suppliers',
        entity_id: supplier.id,
      });

      return supplier;
    } catch (error: any) {
      logger.error('Create supplier error:', error);
      if (error.code === 'P2002') throw new ConflictError('El RUC ya está en uso');
      throw error;
    }
  }

  async updateSupplier(id: number, data: UpdateSupplierDTO, updatedBy: number) {
    try {
      const existing = await this.supplierRepo.findById(id);
      if (!existing) throw new NotFoundError('Proveedor');

      if (data.ruc && data.ruc !== existing.ruc) {
        const rucExists = await this.supplierRepo.findByRuc(data.ruc);
        if (rucExists) throw new ConflictError(`El RUC ${data.ruc} ya está registrado`);
      }

      const supplier = await this.supplierRepo.update(id, data);

      await this.auditLogRepo.create({
        userId: updatedBy,
        action: 'UPDATE_SUPPLIER',
        entity: 'suppliers',
        entity_id: id,
      });

      return supplier;
    } catch (error: any) {
      logger.error('Update supplier error:', error);
      if (error.code === 'P2025') throw new NotFoundError('Proveedor');
      throw error;
    }
  }

  async deleteSupplier(id: number, deletedBy: number) {
    try {
      const supplier = await this.supplierRepo.findById(id);
      if (!supplier) throw new NotFoundError('Proveedor');

      const hasProducts = await this.supplierRepo.hasProducts(id);
      if (hasProducts) throw new BusinessRuleError('No se puede eliminar el proveedor porque tiene producto(s) asociado(s)');

      const hasPurchases = await this.supplierRepo.hasPurchases(id);
      if (hasPurchases) throw new BusinessRuleError('No se puede eliminar el proveedor porque tiene compra(s) asociada(s)');

      await this.supplierRepo.delete(id);

      await this.auditLogRepo.create({
        userId: deletedBy,
        action: 'DELETE_SUPPLIER',
        entity: 'suppliers',
        entity_id: id,
      });

      return { success: true };
    } catch (error: any) {
      logger.error('Delete supplier error:', error);
      if (error.code === 'P2025') throw new NotFoundError('Proveedor');
      throw error;
    }
  }

  /**
   * Cuentas por pagar por proveedor (compras recibidas no saldadas).
   */
  async getAccountsPayable() {
    try {
      const [payables, cashPosition] = await Promise.all([
        this.supplierRepo.getAccountsPayable(),
        this.getCashPosition(),
      ]);
      return { payables, cashPosition };
    } catch (error: any) {
      logger.error('Get accounts payable error:', error);
      throw new Error('Error al obtener cuentas por pagar');
    }
  }

  /**
   * Compras pendientes de pago de un proveedor (orden FIFO) + saldo disponible.
   */
  async getSupplierDebt(supplierId: number) {
    try {
      const supplier = await this.supplierRepo.findById(supplierId);
      if (!supplier) throw new NotFoundError('Proveedor');

      const purchases = await this.supplierRepo.getOutstandingPurchases(supplierId);
      const outstanding = purchases.map((p) => ({
        id: p.id,
        total_amount: p.total_amount,
        paid_amount: p.paid_amount ?? 0,
        remaining: Math.round((p.total_amount - (p.paid_amount ?? 0)) * 100) / 100,
        created_at: p.created_at,
      }));
      const totalOwed = Math.round(outstanding.reduce((sum, p) => sum + p.remaining, 0) * 100) / 100;

      return { supplier, purchases: outstanding, total_owed: totalOwed, cashPosition: await this.getCashPosition() };
    } catch (error: any) {
      logger.error('Get supplier debt error:', error);
      throw error;
    }
  }

  /**
   * Posición de caja de la empresa:
   * - total_inflow: dinero que ha ingresado (aperturas de caja + ventas)
   * - paid_to_suppliers: pagos ya realizados a proveedores
   * - available: saldo disponible para pagar
   */
  async getCashPosition() {
    const [totalInflow, totalPaid] = await Promise.all([
      this.cashRegisterRepo.getTotalInflow(),
      this.supplierRepo.getTotalPaid(),
    ]);
    const round = (n: number) => Math.round(n * 100) / 100;
    return {
      total_inflow: round(totalInflow),
      paid_to_suppliers: round(totalPaid),
      available: round(totalInflow - totalPaid),
    };
  }

  /**
   * Registra un pago a proveedor. Aplica el monto a las compras pendientes
   * más antiguas primero (FIFO) y valida que la empresa tenga saldo suficiente.
   */
  async paySupplier(supplierId: number, amount: number, userId: number, note?: string) {
    try {
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new ValidationError('El monto del pago debe ser mayor a cero');
      }
      amount = Math.round(amount * 100) / 100;

      const supplier = await this.supplierRepo.findById(supplierId);
      if (!supplier) throw new NotFoundError('Proveedor');

      const pending = await this.supplierRepo.getOutstandingPurchases(supplierId);
      const totalOwed = pending.reduce(
        (sum, p) => sum + (p.total_amount - (p.paid_amount ?? 0)), 0,
      );
      if (totalOwed <= 0) {
        throw new BusinessRuleError('Este proveedor no tiene deudas pendientes');
      }
      if (amount > totalOwed + 0.001) {
        throw new BusinessRuleError(
          `El pago excede la deuda del proveedor ($${totalOwed.toFixed(2)})`,
        );
      }

      const cashPosition = await this.getCashPosition();
      if (cashPosition.available <= 0) {
        throw new BusinessRuleError(
          'No hay saldo disponible: el dinero que ingresa por ventas aún no cubre los pagos realizados',
        );
      }
      if (amount > cashPosition.available + 0.001) {
        throw new BusinessRuleError(
          `Saldo insuficiente. Disponible: $${cashPosition.available.toFixed(2)} (ingresos $${cashPosition.total_inflow.toFixed(2)} − pagos $${cashPosition.paid_to_suppliers.toFixed(2)})`,
        );
      }

      let remaining = amount;
      const paymentIds: number[] = [];
      for (const purchase of pending) {
        if (remaining <= 0) break;
        const purchaseRemaining = purchase.total_amount - (purchase.paid_amount ?? 0);
        const allocation = Math.round(Math.min(remaining, purchaseRemaining) * 100) / 100;
        const payment = await this.supplierRepo.registerPayment({
          supplier_id: supplierId,
          purchase_id: purchase.id,
          amount: allocation,
          note,
          created_by: userId,
        });
        paymentIds.push(payment.id);
        await this.supplierRepo.applyPaymentToPurchase(purchase.id, allocation);
        remaining -= allocation;
      }

      await this.auditLogRepo.create({
        userId,
        action: 'PAY_SUPPLIER',
        entity: 'suppliers',
        entity_id: supplierId,
      });

      logger.info(`Pago a proveedor ${supplierId}: $${amount} por usuario ${userId}`);

      return { success: true, paid: amount, remaining_debt: Math.round((totalOwed - amount) * 100) / 100, payment_ids: paymentIds };
    } catch (error: any) {
      logger.error('Pay supplier error:', error);
      throw error;
    }
  }

  /**
   * Historial de pagos a un proveedor.
   */
  async getSupplierPayments(supplierId: number) {
    try {
      const supplier = await this.supplierRepo.findById(supplierId);
      if (!supplier) throw new NotFoundError('Proveedor');
      return this.supplierRepo.getPayments(supplierId);
    } catch (error: any) {
      logger.error('Get supplier payments error:', error);
      throw error;
    }
  }

  /**
   * Pagos por ID (para generar recibos).
   */
  async getPaymentsByIds(ids: number[]) {
    return this.supplierRepo.getPaymentsByIds(ids);
  }

  /**
   * Deuda total pendiente de un proveedor.
   */
  async getSupplierRemainingDebt(supplierId: number): Promise<number> {
    const pending = await this.supplierRepo.getOutstandingPurchases(supplierId);
    return Math.round(pending.reduce((sum, p) => sum + (p.total_amount - (p.paid_amount ?? 0)), 0) * 100) / 100;
  }
}
