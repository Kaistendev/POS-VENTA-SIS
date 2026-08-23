import { IProductRepository } from '../../domain/ports/IProductRepository.js';
import { ISupplierRepository } from '../../domain/ports/ISupplierRepository.js';
import { ICashRegisterRepository } from '../../domain/ports/ICashRegisterRepository.js';
import { AccountingSummary } from '../../domain/models.js';
import { logger } from '../../shared/logger.js';

export class AccountingService {
  constructor(
    private productRepo: IProductRepository,
    private supplierRepo: ISupplierRepository,
    private cashRegisterRepo: ICashRegisterRepository,
  ) {}

  /**
   * Resumen contable de la empresa:
   * - cashPosition: saldo disponible (ingresos por ventas/aperturas − pagos a proveedores)
   * - payables / total_debt: cuentas por pagar a proveedores
   * - projection: ganancia bruta proyectada según el inventario actual
   */
  async getSummary(): Promise<AccountingSummary> {
    try {
      const [totalInflow, totalPaid, payables, valuation] = await Promise.all([
        this.cashRegisterRepo.getTotalInflow(),
        this.supplierRepo.getTotalPaid(),
        this.supplierRepo.getAccountsPayable(),
        this.productRepo.getInventoryValuation(),
      ]);

      const round = (n: number) => Math.round(n * 100) / 100;

      return {
        cashPosition: {
          total_inflow: round(totalInflow),
          paid_to_suppliers: round(totalPaid),
          available: round(totalInflow - totalPaid),
        },
        total_debt: round(payables.reduce((sum, p) => sum + p.total_owed, 0)),
        payables,
        projection: {
          units_in_stock: valuation.units_in_stock,
          inventory_cost_value: valuation.cost_value,
          potential_revenue: valuation.potential_revenue,
          projected_gross_profit: round(valuation.potential_revenue - valuation.cost_value),
        },
      };
    } catch (error: any) {
      logger.error('Get accounting summary error:', error);
      throw error;
    }
  }
}
